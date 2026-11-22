import type { AppState, Member, Recipe } from '../shared/types'
import { DEFAULT_SETTINGS, emptyProfile } from '../shared/types'
import { STARTER_DISHES } from '../shared/starterDishes'
import { STARTER_RECIPES } from '../shared/starterRecipes'
import { hashPassword, inviteCode, randomToken, sha256Hex, verifyPassword } from './crypto'
import { sendEmail, emailConfigured } from './email'
import type { D1Prepared, Env } from './types'
import { HttpError } from './types'
import * as v from './validate'

const SESSION_COOKIE = 'cl_session'
const SESSION_DAYS = 30
const HOUSEHOLD_SIZE = 2

interface UserRow {
  id: string
  household_id: string | null
  email: string
  name: string
  password_hash: string
}

interface Ctx {
  req: Request
  env: Env
  url: URL
  ip: string
  user: UserRow | null
  sessionId: string | null
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  })
}

async function body(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new HttpError(400, 'invalid', 'The request was not valid JSON.')
  }
}

function now(): string {
  return new Date().toISOString()
}

function plusMinutes(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString()
}

async function rateLimit(env: Env, key: string, limit: number, windowSec: number): Promise<void> {
  const t = Math.floor(Date.now() / 1000)
  const row = await env.DB.prepare('SELECT window_start, count FROM rate_limits WHERE key = ?')
    .bind(key)
    .first<{ window_start: number; count: number }>()
  if (!row || t - row.window_start >= windowSec) {
    await env.DB.prepare(
      'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1',
    )
      .bind(key, t)
      .run()
    return
  }
  if (row.count >= limit) {
    throw new HttpError(
      429,
      'rate_limited',
      'Too many attempts. Please wait a few minutes and try again.',
    )
  }
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run()
}

async function runBatch(env: Env, stmts: D1Prepared[]): Promise<void> {
  for (let i = 0; i < stmts.length; i += 50) {
    await env.DB.batch(stmts.slice(i, i + 50))
  }
}

function cookieHeader(ctx: Ctx, token: string | null): string {
  const secure = ctx.url.protocol === 'https:' ? '; Secure' : ''
  if (token === null)
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie')
  if (!raw) return null
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return null
}

async function loadSession(ctx: Ctx): Promise<void> {
  const token = readCookie(ctx.req, SESSION_COOKIE)
  if (!token) return
  const sid = await sha256Hex(token)
  const row = await ctx.env.DB.prepare(
    'SELECT u.id, u.household_id, u.email, u.name, u.password_hash, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?',
  )
    .bind(sid)
    .first<UserRow & { expires_at: string }>()
  if (!row || row.expires_at < now()) return
  ctx.user = row
  ctx.sessionId = sid
}

function requireUser(ctx: Ctx): UserRow {
  if (!ctx.user) throw new HttpError(401, 'signed_out', 'Please log in to continue.')
  return ctx.user
}

function requireHousehold(ctx: Ctx): { user: UserRow; householdId: string } {
  const user = requireUser(ctx)
  if (!user.household_id) {
    throw new HttpError(409, 'no_household', 'Start or join a household first.')
  }
  return { user, householdId: user.household_id }
}

async function startSession(ctx: Ctx, userId: string): Promise<string> {
  const token = randomToken(32)
  await ctx.env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()).run()
  await ctx.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(
      await sha256Hex(token),
      userId,
      now(),
      plusMinutes(SESSION_DAYS * 24 * 60),
      (ctx.req.headers.get('user-agent') ?? '').slice(0, 200),
    )
    .run()
  return token
}

function iterations(env: Env): number {
  return env.PBKDF2_ITERATIONS ? Number(env.PBKDF2_ITERATIONS) : 100_000
}

let dummyHash: string | null = null

// ---------- households ----------

async function seedStarter(env: Env, householdId: string): Promise<void> {
  const stmts: D1Prepared[] = STARTER_DISHES.map((d) => {
    const r: Recipe = {
      id: crypto.randomUUID(),
      name: d.name,
      mealTypes: d.mealTypes,
      cookMinutes: d.cookMinutes,
      kcal: null,
      protein: null,
      carbs: null,
      fat: null,
      heat: d.heat,
      tags: d.tags,
      ingredients: (STARTER_RECIPES[d.key]?.ingredients ?? []).map(
        ([name, amount, unit, aisle]) => ({
          name,
          amount,
          unit,
          aisle,
        }),
      ),
      steps: STARTER_RECIPES[d.key]?.steps ?? '',
      notes: '',
      makesExtra: false,
      source: 'starter',
      updatedAt: now(),
    }
    return env.DB.prepare(
      'INSERT INTO recipes (household_id, id, data, starter_key, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(householdId, r.id, JSON.stringify(r), d.key, r.updatedAt)
  })
  await runBatch(env, stmts)
}

async function createHousehold(env: Env, userId: string, tz: string): Promise<string> {
  const hid = crypto.randomUUID()
  const settings = { ...DEFAULT_SETTINGS, tz }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await env.DB.prepare(
        'INSERT INTO households (id, invite_code, created_by, settings, empty_since, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
      )
        .bind(hid, inviteCode(), userId, JSON.stringify(settings), now())
        .run()
      break
    } catch (e) {
      if (attempt === 4) throw e
    }
  }
  await env.DB.prepare('UPDATE users SET household_id = ? WHERE id = ?').bind(hid, userId).run()
  await seedStarter(env, hid)
  return hid
}

async function joinHousehold(env: Env, userId: string, codeRaw: string): Promise<string> {
  const code = codeRaw.trim().toUpperCase()
  const h = await env.DB.prepare('SELECT id FROM households WHERE invite_code = ?')
    .bind(code)
    .first<{ id: string }>()
  if (!h)
    throw new HttpError(
      404,
      'bad_code',
      'That invite code was not found. Check it with your partner and try again.',
    )
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE household_id = ?')
    .bind(h.id)
    .first<{ n: number }>()
  if ((n?.n ?? 0) >= HOUSEHOLD_SIZE) {
    throw new HttpError(409, 'household_full', 'That household already has two people.')
  }
  await env.DB.prepare('UPDATE users SET household_id = ? WHERE id = ?').bind(h.id, userId).run()
  await env.DB.prepare('UPDATE households SET empty_since = NULL WHERE id = ?').bind(h.id).run()
  return h.id
}

const HOUSEHOLD_TABLES = [
  'recipes',
  'plan',
  'logs',
  'pantry',
  'manual',
  'feedback',
  'train',
  'push_subs',
  'reminder_log',
]

async function deleteHousehold(env: Env, householdId: string): Promise<void> {
  const stmts = HOUSEHOLD_TABLES.map((t) =>
    env.DB.prepare(`DELETE FROM ${t} WHERE household_id = ?`).bind(householdId),
  )
  stmts.push(env.DB.prepare('DELETE FROM households WHERE id = ?').bind(householdId))
  await env.DB.batch(stmts)
}

async function memberRows(env: Env, householdId: string): Promise<{ id: string; name: string }[]> {
  const r = await env.DB.prepare(
    'SELECT id, name FROM users WHERE household_id = ? ORDER BY created_at',
  )
    .bind(householdId)
    .all<{ id: string; name: string }>()
  return r.results
}

/** Takes a person out of their household and keeps the household consistent. */
async function detach(env: Env, userId: string, householdId: string): Promise<void> {
  await env.DB.prepare('UPDATE users SET household_id = NULL WHERE id = ?').bind(userId).run()
  await env.DB.prepare('DELETE FROM push_subs WHERE user_id = ?').bind(userId).run()
  const rest = await memberRows(env, householdId)
  if (rest.length === 0) {
    await env.DB.prepare('UPDATE households SET empty_since = ? WHERE id = ?')
      .bind(now(), householdId)
      .run()
  } else {
    await env.DB.prepare('UPDATE households SET created_by = ? WHERE id = ? AND created_by = ?')
      .bind(rest[0].id, householdId, userId)
      .run()
  }
}

// ---------- state ----------

async function loadState(env: Env, user: UserRow, householdId: string): Promise<AppState> {
  const db = env.DB
  const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10)
  const trainCutoff = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10)
  const [h, mem, recipes, plan, logs, pantry, manual, fb, train] = await Promise.all([
    db
      .prepare('SELECT id, invite_code, created_by, settings FROM households WHERE id = ?')
      .bind(householdId)
      .first<{ id: string; invite_code: string; created_by: string; settings: string }>(),
    db
      .prepare(
        'SELECT u.id, u.name, p.data FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.household_id = ? ORDER BY u.created_at',
      )
      .bind(householdId)
      .all<{ id: string; name: string; data: string | null }>(),
    db
      .prepare('SELECT data FROM recipes WHERE household_id = ?')
      .bind(householdId)
      .all<{ data: string }>(),
    db
      .prepare('SELECT data FROM plan WHERE household_id = ? AND date >= ?')
      .bind(householdId, cutoff)
      .all<{ data: string }>(),
    db
      .prepare('SELECT data FROM logs WHERE household_id = ? AND date >= ?')
      .bind(householdId, cutoff)
      .all<{ data: string }>(),
    db
      .prepare('SELECT data FROM pantry WHERE household_id = ?')
      .bind(householdId)
      .all<{ data: string }>(),
    db
      .prepare('SELECT data FROM manual WHERE household_id = ?')
      .bind(householdId)
      .all<{ data: string }>(),
    db
      .prepare('SELECT data FROM feedback WHERE household_id = ?')
      .bind(householdId)
      .all<{ data: string }>(),
    db
      .prepare(
        "SELECT data FROM train WHERE household_id = ? AND (kind IN ('goal','level','pref') OR date >= ?)",
      )
      .bind(householdId, trainCutoff)
      .all<{ data: string }>(),
  ])
  if (!h) throw new HttpError(404, 'no_household', 'Household not found.')
  const members: Member[] = mem.results.map((m) => ({
    id: m.id,
    name: m.name,
    profile: m.data ? JSON.parse(m.data) : emptyProfile(m.id),
  }))
  members.sort((a, b) => (a.id === h.created_by ? -1 : b.id === h.created_by ? 1 : 0))
  const parse = <T>(rows: { data: string }[]) => rows.map((r) => JSON.parse(r.data) as T)
  return {
    user: { id: user.id, name: user.name, email: user.email },
    household: {
      id: h.id,
      inviteCode: h.invite_code,
      createdBy: h.created_by,
      settings: JSON.parse(h.settings),
    },
    members,
    recipes: parse(recipes.results),
    plan: parse(plan.results),
    logs: parse(logs.results),
    pantry: parse(pantry.results),
    manual: parse(manual.results),
    feedback: parse(fb.results),
    train: parse(train.results),
  }
}

// ---------- batch writes ----------

const LIMITS: Record<string, number> = {
  recipes: 1000,
  plan: 3000,
  logs: 20000,
  pantry: 500,
  manual: 500,
  feedback: 1000,
  train: 8000,
}
const ENTITIES = Object.keys(LIMITS)

async function applyBatch(ctx: Ctx, raw: unknown): Promise<void> {
  const { user, householdId } = requireHousehold(ctx)
  const { env } = ctx
  const o = v.obj(raw)
  const ops = v.arr(o.ops, 'ops', 400)
  const members = new Set((await memberRows(env, householdId)).map((m) => m.id))
  const stmts: D1Prepared[] = []
  const adds: Record<string, number> = {}
  const db = env.DB
  for (const opRaw of ops) {
    const op = v.obj(opRaw, 'Operation')
    const entity = v.oneOf(op.entity, 'entity', ENTITIES)
    const kind = v.oneOf(op.op, 'op', ['put', 'delete'] as const)
    const id = v.id(op.id)
    if (kind === 'delete') {
      if (entity === 'recipes') {
        stmts.push(
          db
            .prepare(
              "DELETE FROM plan WHERE household_id = ? AND json_extract(data, '$.recipeId') = ?",
            )
            .bind(householdId, id),
          db
            .prepare('DELETE FROM feedback WHERE household_id = ? AND id = ?')
            .bind(householdId, id),
        )
      }
      if (entity === 'train') {
        // You can only delete your own training entries.
        stmts.push(
          db
            .prepare('DELETE FROM train WHERE household_id = ? AND id = ? AND user_id = ?')
            .bind(householdId, id, user.id),
        )
        continue
      }
      stmts.push(
        db.prepare(`DELETE FROM ${entity} WHERE household_id = ? AND id = ?`).bind(householdId, id),
      )
      continue
    }
    adds[entity] = (adds[entity] ?? 0) + 1
    const bodyObj = op.body
    switch (entity) {
      case 'recipes': {
        const r = v.recipe(bodyObj, id)
        stmts.push(
          db
            .prepare(
              'INSERT INTO recipes (household_id, id, data, starter_key, updated_at) VALUES (?, ?, ?, NULL, ?) ON CONFLICT(household_id, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at',
            )
            .bind(householdId, id, JSON.stringify(r), r.updatedAt),
        )
        break
      }
      case 'plan': {
        const e = v.planEntry(bodyObj, id)
        stmts.push(
          db
            .prepare(
              'DELETE FROM plan WHERE household_id = ? AND date = ? AND slot = ? AND id <> ?',
            )
            .bind(householdId, e.date, e.slot, id),
          db
            .prepare(
              'INSERT INTO plan (household_id, id, date, slot, data) VALUES (?, ?, ?, ?, ?) ON CONFLICT(household_id, id) DO UPDATE SET date = excluded.date, slot = excluded.slot, data = excluded.data',
            )
            .bind(householdId, id, e.date, e.slot, JSON.stringify(e)),
        )
        break
      }
      case 'logs': {
        const forUser =
          typeof v.obj(bodyObj).userId === 'string' ? (v.obj(bodyObj).userId as string) : user.id
        if (!members.has(forUser))
          throw new HttpError(400, 'invalid', 'That person is not in your household.')
        const l = v.mealLog(bodyObj, id, forUser)
        stmts.push(
          db
            .prepare(
              'INSERT INTO logs (household_id, id, user_id, date, data) VALUES (?, ?, ?, ?, ?) ON CONFLICT(household_id, id) DO UPDATE SET date = excluded.date, data = excluded.data',
            )
            .bind(householdId, id, forUser, l.date, JSON.stringify(l)),
        )
        break
      }
      case 'pantry': {
        const p = v.pantryItem(bodyObj, id)
        stmts.push(
          db
            .prepare(
              'INSERT INTO pantry (household_id, id, data) VALUES (?, ?, ?) ON CONFLICT(household_id, id) DO UPDATE SET data = excluded.data',
            )
            .bind(householdId, id, JSON.stringify(p)),
        )
        break
      }
      case 'manual': {
        const m = v.manualItem(bodyObj, id)
        stmts.push(
          db
            .prepare(
              'INSERT INTO manual (household_id, id, data) VALUES (?, ?, ?) ON CONFLICT(household_id, id) DO UPDATE SET data = excluded.data',
            )
            .bind(householdId, id, JSON.stringify(m)),
        )
        break
      }
      case 'train': {
        const t = v.trainItem(bodyObj, id, user.id)
        // An id that already belongs to someone else cannot be overwritten.
        stmts.push(
          db
            .prepare(
              'INSERT INTO train (household_id, id, user_id, kind, date, data) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(household_id, id) DO UPDATE SET date = excluded.date, kind = excluded.kind, data = excluded.data WHERE train.user_id = excluded.user_id',
            )
            .bind(householdId, id, user.id, t.kind, v.trainDate(t), JSON.stringify(t)),
        )
        break
      }
      case 'feedback': {
        const f = v.feedback(bodyObj, id)
        stmts.push(
          db
            .prepare(
              'INSERT INTO feedback (household_id, id, data) VALUES (?, ?, ?) ON CONFLICT(household_id, id) DO UPDATE SET data = excluded.data',
            )
            .bind(householdId, id, JSON.stringify(f)),
        )
        break
      }
    }
  }
  for (const [entity, n] of Object.entries(adds)) {
    const c = await db
      .prepare(`SELECT COUNT(*) AS n FROM ${entity} WHERE household_id = ?`)
      .bind(householdId)
      .first<{ n: number }>()
    if ((c?.n ?? 0) + n > LIMITS[entity]) {
      throw new HttpError(413, 'limit', `You have reached the limit for ${entity}.`)
    }
  }
  await runBatch(env, stmts)
}

// ---------- routes ----------

type Handler = (ctx: Ctx) => Promise<Response>

const routes: Record<string, Handler> = {
  'GET /api/auth/config': async (ctx) =>
    json({
      emailConfigured: emailConfigured(ctx.env),
      vapidPublicKey: ctx.env.VAPID_PUBLIC_KEY ?? null,
    }),

  'GET /api/auth/me': async (ctx) => {
    if (!ctx.user) return json({ user: null })
    return json({
      user: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
      hasHousehold: !!ctx.user.household_id,
    })
  },

  'POST /api/auth/signup': async (ctx) => {
    const o = v.obj(await body(ctx.req))
    const name = v.str(o.name, 'Name', 60, { min: 1 })
    const email = v.email(o.email)
    const pw = v.password(o.password)
    const mode = v.oneOf(o.mode ?? 'create', 'mode', ['create', 'join'] as const)
    const code = mode === 'join' ? v.str(o.code, 'Invite code', 12, { min: 1 }) : ''
    const tz = typeof o.tz === 'string' && o.tz.length < 64 ? o.tz : 'Europe/London'
    await rateLimit(ctx.env, `signup:ip:${ctx.ip}`, 20, 3600)
    const exists = await ctx.env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first()
    if (exists)
      throw new HttpError(
        409,
        'email_taken',
        'An account with that email already exists. Try logging in instead.',
      )
    if (mode === 'join') {
      const h = await ctx.env.DB.prepare('SELECT id FROM households WHERE invite_code = ?')
        .bind(code.toUpperCase())
        .first<{ id: string }>()
      if (!h)
        throw new HttpError(
          404,
          'bad_code',
          'That invite code was not found. Check it with your partner and try again.',
        )
    }
    const userId = crypto.randomUUID()
    await ctx.env.DB.prepare(
      'INSERT INTO users (id, household_id, email, name, password_hash, created_at) VALUES (?, NULL, ?, ?, ?, ?)',
    )
      .bind(userId, email, name, await hashPassword(pw, iterations(ctx.env)), now())
      .run()
    try {
      if (mode === 'join') await joinHousehold(ctx.env, userId, code)
      else await createHousehold(ctx.env, userId, tz)
    } catch (e) {
      await ctx.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
      throw e
    }
    const token = await startSession(ctx, userId)
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader(ctx, token) })
  },

  'POST /api/auth/login': async (ctx) => {
    const o = v.obj(await body(ctx.req))
    const email = v.email(o.email)
    const pw = v.str(o.password, 'Password', 200, { min: 1, trim: false })
    await rateLimit(ctx.env, `login:email:${email}`, 10, 900)
    await rateLimit(ctx.env, `login:ip:${ctx.ip}`, 60, 900)
    const row = await ctx.env.DB.prepare('SELECT id, password_hash FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string; password_hash: string }>()
    dummyHash ??= await hashPassword('not-a-real-password', iterations(ctx.env))
    const ok = await verifyPassword(pw, row?.password_hash ?? dummyHash)
    if (!row || !ok)
      throw new HttpError(
        401,
        'bad_login',
        'That email and password do not match. Check them and try again.',
      )
    const token = await startSession(ctx, row.id)
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader(ctx, token) })
  },

  'POST /api/auth/logout': async (ctx) => {
    if (ctx.sessionId)
      await ctx.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(ctx.sessionId).run()
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader(ctx, null) })
  },

  'POST /api/auth/logout-others': async (ctx) => {
    const user = requireUser(ctx)
    await ctx.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?')
      .bind(user.id, ctx.sessionId)
      .run()
    return json({ ok: true })
  },

  'POST /api/auth/forgot': async (ctx) => {
    const o = v.obj(await body(ctx.req))
    const email = v.email(o.email)
    await rateLimit(ctx.env, `forgot:email:${email}`, 5, 3600)
    await rateLimit(ctx.env, `forgot:ip:${ctx.ip}`, 20, 3600)
    const configured = emailConfigured(ctx.env)
    if (configured) {
      const row = await ctx.env.DB.prepare('SELECT id, name FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: string; name: string }>()
      if (row) {
        const token = randomToken(32)
        await ctx.env.DB.prepare(
          'INSERT INTO tokens (id, user_id, kind, payload, expires_at) VALUES (?, ?, ?, NULL, ?)',
        )
          .bind(await sha256Hex(token), row.id, 'reset', plusMinutes(30))
          .run()
        const base = ctx.env.APP_URL ?? ctx.url.origin
        await sendEmail(ctx.env, {
          to: email,
          subject: 'Reset your Choplife password',
          text: `Hi ${row.name},\n\nUse this link to choose a new password. It works for 30 minutes.\n\n${base}/reset?token=${token}\n\nIf you did not ask for this, you can ignore this email.`,
        })
      }
    }
    return json({ ok: true, emailConfigured: configured })
  },

  'POST /api/auth/reset': async (ctx) => {
    const o = v.obj(await body(ctx.req))
    const token = v.str(o.token, 'Reset link', 200, { min: 1 })
    const pw = v.password(o.password, 'New password')
    await rateLimit(ctx.env, `reset:ip:${ctx.ip}`, 20, 3600)
    const tid = await sha256Hex(token)
    const row = await ctx.env.DB.prepare(
      'SELECT user_id, expires_at FROM tokens WHERE id = ? AND kind = ?',
    )
      .bind(tid, 'reset')
      .first<{ user_id: string; expires_at: string }>()
    if (!row || row.expires_at < now()) {
      throw new HttpError(400, 'bad_token', 'That reset link has expired. Ask for a new one.')
    }
    await ctx.env.DB.batch([
      ctx.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(
        await hashPassword(pw, iterations(ctx.env)),
        row.user_id,
      ),
      ctx.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.user_id),
      ctx.env.DB.prepare('DELETE FROM tokens WHERE id = ?').bind(tid),
    ])
    return json({ ok: true })
  },

  'POST /api/auth/password': async (ctx) => {
    const user = requireUser(ctx)
    const o = v.obj(await body(ctx.req))
    const current = v.str(o.current, 'Current password', 200, { min: 1, trim: false })
    const next = v.password(o.next, 'New password')
    await rateLimit(ctx.env, `pw:user:${user.id}`, 10, 900)
    if (!(await verifyPassword(current, user.password_hash))) {
      throw new HttpError(400, 'bad_password', 'Your current password is not right.')
    }
    await ctx.env.DB.batch([
      ctx.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(
        await hashPassword(next, iterations(ctx.env)),
        user.id,
      ),
      ctx.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').bind(
        user.id,
        ctx.sessionId,
      ),
    ])
    return json({ ok: true })
  },

  'POST /api/auth/name': async (ctx) => {
    const user = requireUser(ctx)
    const o = v.obj(await body(ctx.req))
    const name = v.str(o.name, 'Name', 60, { min: 1 })
    await ctx.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, user.id).run()
    return json({ ok: true })
  },

  'POST /api/auth/email': async (ctx) => {
    const user = requireUser(ctx)
    const o = v.obj(await body(ctx.req))
    const newEmail = v.email(o.newEmail)
    const pw = v.str(o.password, 'Password', 200, { min: 1, trim: false })
    await rateLimit(ctx.env, `email:user:${user.id}`, 10, 900)
    if (!(await verifyPassword(pw, user.password_hash))) {
      throw new HttpError(400, 'bad_password', 'Your password is not right.')
    }
    const taken = await ctx.env.DB.prepare('SELECT id FROM users WHERE email = ? AND id <> ?')
      .bind(newEmail, user.id)
      .first()
    if (taken)
      throw new HttpError(409, 'email_taken', 'That email is already used by another account.')
    if (!emailConfigured(ctx.env)) {
      await ctx.env.DB.prepare('UPDATE users SET email = ? WHERE id = ?')
        .bind(newEmail, user.id)
        .run()
      return json({ ok: true, applied: true })
    }
    const token = randomToken(32)
    await ctx.env.DB.prepare(
      'INSERT INTO tokens (id, user_id, kind, payload, expires_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(await sha256Hex(token), user.id, 'email', newEmail, plusMinutes(60))
      .run()
    const base = ctx.env.APP_URL ?? ctx.url.origin
    await sendEmail(ctx.env, {
      to: newEmail,
      subject: 'Confirm your new Choplife email',
      text: `Open this link to confirm ${newEmail} as your Choplife email. It works for one hour.\n\n${base}/confirm-email?token=${token}`,
    })
    return json({ ok: true, pending: true })
  },

  'POST /api/auth/email/confirm': async (ctx) => {
    const user = requireUser(ctx)
    const o = v.obj(await body(ctx.req))
    const token = v.str(o.token, 'Link', 200, { min: 1 })
    const tid = await sha256Hex(token)
    const row = await ctx.env.DB.prepare(
      'SELECT user_id, payload, expires_at FROM tokens WHERE id = ? AND kind = ?',
    )
      .bind(tid, 'email')
      .first<{ user_id: string; payload: string; expires_at: string }>()
    if (!row || row.expires_at < now() || row.user_id !== user.id) {
      throw new HttpError(
        400,
        'bad_token',
        'That confirmation link has expired. Request the change again.',
      )
    }
    const taken = await ctx.env.DB.prepare('SELECT id FROM users WHERE email = ? AND id <> ?')
      .bind(row.payload, user.id)
      .first()
    if (taken)
      throw new HttpError(409, 'email_taken', 'That email is already used by another account.')
    await ctx.env.DB.batch([
      ctx.env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(row.payload, user.id),
      ctx.env.DB.prepare('DELETE FROM tokens WHERE id = ?').bind(tid),
    ])
    return json({ ok: true })
  },

  'POST /api/auth/delete': async (ctx) => {
    const user = requireUser(ctx)
    const o = v.obj(await body(ctx.req))
    if (v.email(o.email) !== user.email) {
      throw new HttpError(400, 'bad_confirm', 'Type your account email exactly to confirm.')
    }
    const hid = user.household_id
    const db = ctx.env.DB
    await db.batch([
      db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM tokens WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM push_subs WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM profiles WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM logs WHERE user_id = ?').bind(user.id),
      db.prepare('DELETE FROM train WHERE user_id = ?').bind(user.id),
    ])
    if (hid) {
      await detach(ctx.env, user.id, hid)
      const rest = await memberRows(ctx.env, hid)
      if (rest.length === 0) await deleteHousehold(ctx.env, hid)
    }
    await db.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run()
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader(ctx, null) })
  },

  'GET /api/state': async (ctx) => {
    const { user, householdId } = requireHousehold(ctx)
    return json(await loadState(ctx.env, user, householdId))
  },

  'POST /api/batch': async (ctx) => {
    await applyBatch(ctx, await body(ctx.req))
    return json({ ok: true })
  },

  'PUT /api/profile': async (ctx) => {
    const user = requireUser(ctx)
    const p = v.profile(await body(ctx.req), user.id)
    await ctx.env.DB.prepare(
      'INSERT INTO profiles (user_id, data) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data',
    )
      .bind(user.id, JSON.stringify(p))
      .run()
    return json({ ok: true })
  },

  'PUT /api/household/settings': async (ctx) => {
    const { householdId } = requireHousehold(ctx)
    const s = v.settings(await body(ctx.req))
    await ctx.env.DB.prepare('UPDATE households SET settings = ? WHERE id = ?')
      .bind(JSON.stringify(s), householdId)
      .run()
    return json({ ok: true })
  },

  'POST /api/household/create': async (ctx) => {
    const user = requireUser(ctx)
    if (user.household_id)
      throw new HttpError(409, 'has_household', 'You already belong to a household.')
    const o = v.obj(await body(ctx.req))
    const tz = typeof o.tz === 'string' && o.tz.length < 64 ? o.tz : 'Europe/London'
    await createHousehold(ctx.env, user.id, tz)
    return json({ ok: true })
  },

  'POST /api/household/join': async (ctx) => {
    const user = requireUser(ctx)
    if (user.household_id)
      throw new HttpError(409, 'has_household', 'You already belong to a household.')
    const o = v.obj(await body(ctx.req))
    await rateLimit(ctx.env, `join:user:${user.id}`, 10, 900)
    await joinHousehold(ctx.env, user.id, v.str(o.code, 'Invite code', 12, { min: 1 }))
    return json({ ok: true })
  },

  'POST /api/household/invite/regenerate': async (ctx) => {
    const { householdId } = requireHousehold(ctx)
    const code = inviteCode()
    await ctx.env.DB.prepare('UPDATE households SET invite_code = ? WHERE id = ?')
      .bind(code, householdId)
      .run()
    return json({ ok: true, inviteCode: code })
  },

  'POST /api/household/remove-partner': async (ctx) => {
    const { user, householdId } = requireHousehold(ctx)
    const h = await ctx.env.DB.prepare('SELECT created_by FROM households WHERE id = ?')
      .bind(householdId)
      .first<{ created_by: string }>()
    if (h?.created_by !== user.id)
      throw new HttpError(
        403,
        'forbidden',
        'Only the person who created the household can remove someone.',
      )
    const partner = (await memberRows(ctx.env, householdId)).find((m) => m.id !== user.id)
    if (!partner) throw new HttpError(404, 'no_partner', 'There is nobody else in your household.')
    await detach(ctx.env, partner.id, householdId)
    // A new code so the removed person cannot simply rejoin with the old one.
    await ctx.env.DB.prepare('UPDATE households SET invite_code = ? WHERE id = ?')
      .bind(inviteCode(), householdId)
      .run()
    await ctx.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(partner.id).run()
    return json({ ok: true })
  },

  'POST /api/household/leave': async (ctx) => {
    const { user, householdId } = requireHousehold(ctx)
    await detach(ctx.env, user.id, householdId)
    return json({ ok: true })
  },

  'POST /api/household/transfer': async (ctx) => {
    const { user, householdId } = requireHousehold(ctx)
    const h = await ctx.env.DB.prepare('SELECT created_by FROM households WHERE id = ?')
      .bind(householdId)
      .first<{ created_by: string }>()
    if (h?.created_by !== user.id)
      throw new HttpError(
        403,
        'forbidden',
        'Only the person who created the household can hand it over.',
      )
    const partner = (await memberRows(ctx.env, householdId)).find((m) => m.id !== user.id)
    if (!partner) throw new HttpError(404, 'no_partner', 'There is nobody else in your household.')
    await ctx.env.DB.prepare('UPDATE households SET created_by = ? WHERE id = ?')
      .bind(partner.id, householdId)
      .run()
    return json({ ok: true })
  },

  'GET /api/export': async (ctx) => {
    const { user, householdId } = requireHousehold(ctx)
    const state = await loadState(ctx.env, user, householdId)
    return json(state, 200, {
      'content-disposition': 'attachment; filename="choplife-export.json"',
    })
  },

  'POST /api/push/subscribe': async (ctx) => {
    const { user, householdId } = requireHousehold(ctx)
    const o = v.obj(await body(ctx.req))
    const endpoint = v.str(o.endpoint, 'endpoint', 1000, { min: 1 })
    if (!endpoint.startsWith('https://'))
      throw new HttpError(400, 'invalid', 'The push address is not valid.')
    const keys = v.obj(o.keys, 'keys')
    const data = {
      p256dh: v.str(keys.p256dh, 'p256dh', 200, { min: 1 }),
      auth: v.str(keys.auth, 'auth', 100, { min: 1 }),
    }
    await ctx.env.DB.prepare(
      'INSERT INTO push_subs (endpoint, user_id, household_id, data, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, household_id = excluded.household_id, data = excluded.data',
    )
      .bind(endpoint, user.id, householdId, JSON.stringify(data), now())
      .run()
    return json({ ok: true })
  },

  'POST /api/push/unsubscribe': async (ctx) => {
    const user = requireUser(ctx)
    const o = v.obj(await body(ctx.req))
    await ctx.env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ? AND user_id = ?')
      .bind(v.str(o.endpoint, 'endpoint', 1000, { min: 1 }), user.id)
      .run()
    return json({ ok: true })
  },
}

export async function handle(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const ctx: Ctx = {
    req,
    env,
    url,
    ip:
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      'local',
    user: null,
    sessionId: null,
  }
  try {
    const isWrite = req.method !== 'GET' && req.method !== 'HEAD'
    if (isWrite) {
      const origin = req.headers.get('origin')
      if (origin && origin !== url.origin)
        throw new HttpError(403, 'forbidden', 'That request came from somewhere unexpected.')
      if (!(req.headers.get('content-type') ?? '').includes('application/json')) {
        throw new HttpError(415, 'invalid', 'Requests must be JSON.')
      }
    }
    const handler = routes[`${req.method} ${url.pathname}`]
    if (!handler) throw new HttpError(404, 'not_found', 'Not found.')
    await loadSession(ctx)
    return await handler(ctx)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status)
    console.error(e)
    return json(
      { error: 'server', message: 'Something went wrong on our side. Please try again.' },
      500,
    )
  }
}
