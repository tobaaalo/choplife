import { beforeEach, describe, expect, it } from 'vitest'
import type { AppState } from '../shared/types'
import { STARTER_DISHES } from '../shared/starterDishes'
import { handle } from './handler'
import { createNodeD1 } from './node-d1'
import type { Env, Mail } from './types'

let env: Env
let outbox: Mail[]

beforeEach(() => {
  outbox = []
  env = {
    DB: createNodeD1(':memory:'),
    PBKDF2_ITERATIONS: '1000',
    mailer: async (m) => {
      outbox.push(m)
    },
  }
})

class Client {
  cookie = ''
  ip: string
  constructor(ip = '1.1.1.1') {
    this.ip = ip
  }
  async call(method: string, path: string, data?: unknown, headers: Record<string, string> = {}) {
    const res = await handle(
      new Request(`https://choplife.test${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': this.ip,
          ...(this.cookie ? { cookie: this.cookie } : {}),
          ...headers,
        },
        body: data === undefined ? undefined : JSON.stringify(data),
      }),
      env,
    )
    const set = res.headers.get('set-cookie')
    if (set) this.cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0]
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null }
  }
  async state(): Promise<AppState> {
    const r = await this.call('GET', '/api/state')
    expect(r.status).toBe(200)
    return r.body as AppState
  }
}

async function signup(
  email: string,
  name = 'Toba',
  extra: Record<string, unknown> = {},
  ip?: string,
) {
  const c = new Client(ip)
  const r = await c.call('POST', '/api/auth/signup', {
    name,
    email,
    password: 'password123',
    mode: 'create',
    ...extra,
  })
  expect(r.status).toBe(200)
  return c
}

const recipeBody = (over: Record<string, unknown> = {}) => ({
  name: 'Jollof rice',
  mealTypes: ['lunch', 'dinner'],
  kcal: 700,
  heat: 'medium',
  tags: ['rice'],
  ingredients: [{ name: 'Rice', amount: 100, unit: 'g', aisle: 'grains' }],
  ...over,
})

describe('sign up and households', () => {
  it('creates a household with starter dishes and an invite code', async () => {
    const c = await signup('toba@example.com')
    const s = await c.state()
    expect(s.recipes.length).toBe(STARTER_DISHES.length)
    expect(s.recipes.every((r) => r.kcal === null && r.source === 'starter')).toBe(true)
    expect(s.household.inviteCode).toMatch(/^[A-Z2-9]{6}$/)
    expect(s.members.length).toBe(1)
  })

  it('rejects signed-out requests', async () => {
    const r = await new Client().call('GET', '/api/state')
    expect(r.status).toBe(401)
  })

  it('validates sign-up fields with friendly messages', async () => {
    const c = new Client()
    const bad = await c.call('POST', '/api/auth/signup', {
      name: 'T',
      email: 'nope',
      password: 'password123',
    })
    expect(bad.status).toBe(400)
    expect(bad.body.message).toMatch(/valid email/)
    const short = await c.call('POST', '/api/auth/signup', {
      name: 'T',
      email: 'a@b.co',
      password: 'short',
    })
    expect(short.body.message).toMatch(/8 characters/)
  })

  it('rejects a duplicate email', async () => {
    await signup('dup@example.com')
    const r = await new Client().call('POST', '/api/auth/signup', {
      name: 'X',
      email: 'DUP@example.com',
      password: 'password123',
    })
    expect(r.status).toBe(409)
  })

  it('lets a partner join with the code, and refuses a third person', async () => {
    const a = await signup('a@example.com')
    const code = (await a.state()).household.inviteCode
    const b = new Client()
    const j = await b.call('POST', '/api/auth/signup', {
      name: 'Wife',
      email: 'b@example.com',
      password: 'password123',
      mode: 'join',
      code: code.toLowerCase(),
    })
    expect(j.status).toBe(200)
    const s = await b.state()
    expect(s.members.map((m) => m.name).sort()).toEqual(['Toba', 'Wife'])
    expect(s.recipes.length).toBe(STARTER_DISHES.length)
    const third = await new Client().call('POST', '/api/auth/signup', {
      name: 'C',
      email: 'c@example.com',
      password: 'password123',
      mode: 'join',
      code,
    })
    expect(third.status).toBe(409)
    const wrong = await new Client().call('POST', '/api/auth/signup', {
      name: 'D',
      email: 'd@example.com',
      password: 'password123',
      mode: 'join',
      code: 'ZZZZZZ',
    })
    expect(wrong.status).toBe(404)
    const ghost = await new Client().call('POST', '/api/auth/login', {
      email: 'd@example.com',
      password: 'password123',
    })
    expect(ghost.status).toBe(401)
  })
})

describe('login and sessions', () => {
  it('logs in, out, and gives one generic error for bad credentials', async () => {
    await signup('l@example.com')
    const c = new Client()
    const bad = await c.call('POST', '/api/auth/login', {
      email: 'l@example.com',
      password: 'wrongwrong',
    })
    const unknown = await c.call('POST', '/api/auth/login', {
      email: 'nobody@example.com',
      password: 'wrongwrong',
    })
    expect(bad.status).toBe(401)
    expect(bad.body.message).toBe(unknown.body.message)
    expect(
      (await c.call('POST', '/api/auth/login', { email: 'l@example.com', password: 'password123' }))
        .status,
    ).toBe(200)
    expect((await c.call('GET', '/api/auth/me')).body.user.email).toBe('l@example.com')
    await c.call('POST', '/api/auth/logout', {})
    expect((await c.call('GET', '/api/state')).status).toBe(401)
  })

  it('rate limits repeated failed logins', async () => {
    await signup('r@example.com')
    const c = new Client('9.9.9.9')
    let last = 0
    for (let i = 0; i < 12; i++) {
      last = (
        await c.call('POST', '/api/auth/login', { email: 'r@example.com', password: 'wrongwrong' })
      ).status
    }
    expect(last).toBe(429)
  })

  it('logs out other devices when the password changes', async () => {
    const phone = await signup('p@example.com')
    const laptop = new Client()
    await laptop.call('POST', '/api/auth/login', {
      email: 'p@example.com',
      password: 'password123',
    })
    const bad = await phone.call('POST', '/api/auth/password', {
      current: 'nope-nope',
      next: 'newpassword1',
    })
    expect(bad.status).toBe(400)
    const ok = await phone.call('POST', '/api/auth/password', {
      current: 'password123',
      next: 'newpassword1',
    })
    expect(ok.status).toBe(200)
    expect((await laptop.call('GET', '/api/state')).status).toBe(401)
    expect((await phone.call('GET', '/api/state')).status).toBe(200)
  })

  it('blocks cross-origin writes and non-JSON bodies', async () => {
    const c = await signup('o@example.com')
    const r1 = await c.call('POST', '/api/batch', { ops: [] }, { origin: 'https://evil.example' })
    expect(r1.status).toBe(403)
    const r2 = await handle(
      new Request('https://choplife.test/api/batch', {
        method: 'POST',
        headers: { cookie: c.cookie, 'content-type': 'text/plain' },
        body: '{}',
      }),
      env,
    )
    expect(r2.status).toBe(415)
  })
})

describe('password reset and email change', () => {
  it('resets a password once with an emailed link and revokes sessions', async () => {
    const c = await signup('reset@example.com')
    const f = await new Client().call('POST', '/api/auth/forgot', { email: 'reset@example.com' })
    expect(f.body).toEqual({ ok: true, emailConfigured: true })
    expect(outbox.length).toBe(1)
    const token = outbox[0].text.match(/token=([\w-]+)/)![1]
    const r = await new Client().call('POST', '/api/auth/reset', { token, password: 'brandnew123' })
    expect(r.status).toBe(200)
    expect(
      (await new Client().call('POST', '/api/auth/reset', { token, password: 'another1234' }))
        .status,
    ).toBe(400)
    expect((await c.call('GET', '/api/state')).status).toBe(401)
    const login = await new Client().call('POST', '/api/auth/login', {
      email: 'reset@example.com',
      password: 'brandnew123',
    })
    expect(login.status).toBe(200)
  })

  it('does not reveal whether an email exists', async () => {
    const r = await new Client().call('POST', '/api/auth/forgot', { email: 'ghost@example.com' })
    expect(r.status).toBe(200)
    expect(outbox.length).toBe(0)
  })

  it('says so when email is not set up', async () => {
    env.mailer = undefined
    const r = await new Client().call('POST', '/api/auth/forgot', { email: 'x@example.com' })
    expect(r.body.emailConfigured).toBe(false)
  })

  it('changes email after confirmation', async () => {
    const c = await signup('old@example.com')
    const bad = await c.call('POST', '/api/auth/email', {
      newEmail: 'new@example.com',
      password: 'wrongwrong',
    })
    expect(bad.status).toBe(400)
    const r = await c.call('POST', '/api/auth/email', {
      newEmail: 'new@example.com',
      password: 'password123',
    })
    expect(r.body.pending).toBe(true)
    expect((await c.call('GET', '/api/auth/me')).body.user.email).toBe('old@example.com')
    const token = outbox[0].text.match(/token=([\w-]+)/)![1]
    expect((await c.call('POST', '/api/auth/email/confirm', { token })).status).toBe(200)
    expect((await c.call('GET', '/api/auth/me')).body.user.email).toBe('new@example.com')
  })
})

describe('household isolation', () => {
  it('keeps two households completely separate', async () => {
    const a = await signup('iso-a@example.com')
    const b = await signup('iso-b@example.com', 'Other', {}, '2.2.2.2')
    const rid = 'recipe-shared-id'
    expect(
      (
        await a.call('POST', '/api/batch', {
          ops: [
            { op: 'put', entity: 'recipes', id: rid, body: recipeBody({ name: 'A secret dish' }) },
          ],
        })
      ).status,
    ).toBe(200)
    expect(
      (
        await a.call('POST', '/api/batch', {
          ops: [{ op: 'put', entity: 'pantry', id: 'p1', body: { name: 'Palm oil' } }],
        })
      ).status,
    ).toBe(200)
    const sb = await b.state()
    expect(sb.recipes.find((r) => r.name === 'A secret dish')).toBeUndefined()
    expect(sb.pantry).toEqual([])
    // B using the same ids creates its own rows and cannot touch A's
    await b.call('POST', '/api/batch', {
      ops: [{ op: 'put', entity: 'recipes', id: rid, body: recipeBody({ name: 'B dish' }) }],
    })
    await b.call('POST', '/api/batch', {
      ops: [
        { op: 'delete', entity: 'pantry', id: 'p1' },
        { op: 'delete', entity: 'recipes', id: rid },
      ],
    })
    const sa = await a.state()
    expect(sa.recipes.find((r) => r.id === rid)?.name).toBe('A secret dish')
    expect(sa.pantry.length).toBe(1)
  })

  it('does not let one household log for a member of another', async () => {
    const a = await signup('x-a@example.com')
    const b = await signup('x-b@example.com', 'Other', {}, '3.3.3.3')
    const bId = (await b.state()).user.id
    const r = await a.call('POST', '/api/batch', {
      ops: [
        {
          op: 'put',
          entity: 'logs',
          id: 'l1',
          body: { userId: bId, date: '2026-11-21', slot: 'lunch', status: 'eaten', kcal: 500 },
        },
      ],
    })
    expect(r.status).toBe(400)
  })
})

describe('batch writes', () => {
  it('validates and rejects the whole batch if any operation is bad', async () => {
    const c = await signup('v@example.com')
    const r = await c.call('POST', '/api/batch', {
      ops: [
        { op: 'put', entity: 'pantry', id: 'ok1', body: { name: 'Rice' } },
        { op: 'put', entity: 'recipes', id: 'bad1', body: recipeBody({ kcal: -5 }) },
      ],
    })
    expect(r.status).toBe(400)
    expect((await c.state()).pantry).toEqual([])
    const unknown = await c.call('POST', '/api/batch', {
      ops: [{ op: 'put', entity: 'users', id: 'x', body: {} }],
    })
    expect(unknown.status).toBe(400)
  })

  it('stores a recipe and replaces a plan entry in the same slot', async () => {
    const c = await signup('plan@example.com')
    await c.call('POST', '/api/batch', {
      ops: [
        { op: 'put', entity: 'recipes', id: 'r1', body: recipeBody() },
        { op: 'put', entity: 'recipes', id: 'r2', body: recipeBody({ name: 'Eba and egusi' }) },
        {
          op: 'put',
          entity: 'plan',
          id: 'e1',
          body: { date: '2026-11-23', slot: 'lunch', recipeId: 'r1' },
        },
      ],
    })
    await c.call('POST', '/api/batch', {
      ops: [
        {
          op: 'put',
          entity: 'plan',
          id: 'e2',
          body: { date: '2026-11-23', slot: 'lunch', recipeId: 'r2' },
        },
      ],
    })
    const s = await c.state()
    expect(s.plan.map((p) => p.id)).toEqual(['e2'])
    expect(s.recipes.find((r) => r.id === 'r1')?.kcal).toBe(700)
  })

  it('removes plan entries and feedback when a recipe is deleted', async () => {
    const c = await signup('del@example.com')
    await c.call('POST', '/api/batch', {
      ops: [
        { op: 'put', entity: 'recipes', id: 'r1', body: recipeBody() },
        {
          op: 'put',
          entity: 'plan',
          id: 'e1',
          body: { date: '2026-11-23', slot: 'dinner', recipeId: 'r1' },
        },
        { op: 'put', entity: 'feedback', id: 'r1', body: { loved: true } },
      ],
    })
    await c.call('POST', '/api/batch', { ops: [{ op: 'delete', entity: 'recipes', id: 'r1' }] })
    const s = await c.state()
    expect(s.plan).toEqual([])
    expect(s.feedback).toEqual([])
    expect(s.recipes.find((r) => r.id === 'r1')).toBeUndefined()
  })

  it('lets partners log meals for each other', async () => {
    const a = await signup('log-a@example.com')
    const code = (await a.state()).household.inviteCode
    const b = new Client()
    await b.call('POST', '/api/auth/signup', {
      name: 'Wife',
      email: 'log-b@example.com',
      password: 'password123',
      mode: 'join',
      code,
    })
    const bId = (await b.state()).user.id
    const r = await a.call('POST', '/api/batch', {
      ops: [
        {
          op: 'put',
          entity: 'logs',
          id: 'l1',
          body: {
            userId: bId,
            date: '2026-11-21',
            slot: 'lunch',
            status: 'eaten',
            kcal: 520,
            name: 'Jollof',
            mult: 0.75,
          },
        },
      ],
    })
    expect(r.status).toBe(200)
    const logs = (await b.state()).logs
    expect(logs[0].userId).toBe(bId)
    expect(logs[0].kcal).toBe(520)
  })

  it('saves profiles and settings with validation', async () => {
    const c = await signup('prof@example.com')
    const p = await c.call('PUT', '/api/profile', {
      sex: 'male',
      birthYear: 1988,
      heightCm: 181,
      weightKg: 86,
      activity: 'light',
      goal: 'gain',
      shares: { breakfast: 25, lunch: 35, dinner: 40, snack: 10 },
      allergies: ['peanut'],
      wontEat: ['Okra'],
      setupDone: true,
    })
    expect(p.status).toBe(200)
    const s = await c.state()
    expect(s.members[0].profile.allergies).toEqual(['peanut'])
    expect(s.members[0].profile.wontEat).toEqual(['okra'])
    expect((await c.call('PUT', '/api/profile', { heightCm: 5 })).status).toBe(400)
    const none = await c.call('PUT', '/api/household/settings', {
      meals: {
        breakfast: { on: false, time: '08:00' },
        lunch: { on: false, time: '13:00' },
        dinner: { on: false, time: '19:00' },
        snack: { on: false, time: '16:00' },
      },
      tz: 'Europe/London',
      remindersOn: true,
      leadMinutes: 60,
      shoppingNudge: true,
    })
    expect(none.status).toBe(400)
  })
})

describe('household management and deletion', () => {
  async function pair() {
    const a = await signup('m-a@example.com')
    const code = (await a.state()).household.inviteCode
    const b = new Client('4.4.4.4')
    await b.call('POST', '/api/auth/signup', {
      name: 'Wife',
      email: 'm-b@example.com',
      password: 'password123',
      mode: 'join',
      code,
    })
    return { a, b, code }
  }

  it('regenerates the invite code', async () => {
    const { a, code } = await pair()
    const r = await a.call('POST', '/api/household/invite/regenerate', {})
    expect(r.body.inviteCode).not.toBe(code)
    expect((await a.state()).household.inviteCode).toBe(r.body.inviteCode)
  })

  it('lets only the creator remove the partner, and the partner then needs a household', async () => {
    const { a, b } = await pair()
    expect((await b.call('POST', '/api/household/remove-partner', {})).status).toBe(403)
    expect((await a.call('POST', '/api/household/remove-partner', {})).status).toBe(200)
    expect((await b.call('GET', '/api/state')).status).toBe(401)
    const again = new Client('4.4.4.4')
    await again.call('POST', '/api/auth/login', {
      email: 'm-b@example.com',
      password: 'password123',
    })
    expect((await again.call('GET', '/api/state')).body.error).toBe('no_household')
    expect((await again.call('POST', '/api/household/create', {})).status).toBe(200)
    expect((await again.state()).recipes.length).toBe(STARTER_DISHES.length)
  })

  it('transfers ownership and hands it on when the creator leaves', async () => {
    const { a, b } = await pair()
    const bId = (await b.state()).user.id
    expect((await a.call('POST', '/api/household/transfer', {})).status).toBe(200)
    expect((await b.state()).household.createdBy).toBe(bId)
    expect((await a.call('POST', '/api/household/leave', {})).status).toBe(200)
    expect((await b.state()).members.length).toBe(1)
  })

  it('exports data and deletes an account, removing the household when nobody is left', async () => {
    const { a, b } = await pair()
    const exp = await a.call('GET', '/api/export')
    expect(exp.status).toBe(200)
    expect(exp.body.recipes.length).toBe(STARTER_DISHES.length)
    expect((await b.call('POST', '/api/auth/delete', { email: 'wrong@example.com' })).status).toBe(
      400,
    )
    expect((await b.call('POST', '/api/auth/delete', { email: 'm-b@example.com' })).status).toBe(
      200,
    )
    expect((await a.state()).members.length).toBe(1)
    expect((await a.call('POST', '/api/auth/delete', { email: 'm-a@example.com' })).status).toBe(
      200,
    )
    const left = await env.DB.prepare('SELECT COUNT(*) AS n FROM recipes').first<{ n: number }>()
    expect(left?.n).toBe(0)
    const users = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>()
    expect(users?.n).toBe(0)
  })
})

describe('training entries', () => {
  const workout = (userId: string, id = 'w1', name = 'Push') => ({
    id,
    userId,
    kind: 'workout',
    date: '2026-11-20',
    name,
    notes: '',
    done: true,
    exercises: [{ name: 'Bench press', sets: [{ reps: 5, kg: 60 }] }],
  })

  it('saves, lists and deletes your own entries', async () => {
    const a = await signup('t-a@example.com')
    const me = (await a.state()).user.id
    const put = await a.call('POST', '/api/batch', {
      ops: [{ op: 'put', entity: 'train', id: 'w1', body: workout(me) }],
    })
    expect(put.status).toBe(200)
    expect((await a.state()).train.map((t) => t.id)).toEqual(['w1'])
    await a.call('POST', '/api/batch', { ops: [{ op: 'delete', entity: 'train', id: 'w1' }] })
    expect((await a.state()).train).toEqual([])
  })

  it('keeps households separate and refuses to edit a partner or another household', async () => {
    const a = await signup('t2-a@example.com')
    const code = (await a.state()).household.inviteCode
    const partner = new Client('4.4.4.4')
    await partner.call('POST', '/api/auth/signup', {
      name: 'Wife',
      email: 't2-b@example.com',
      password: 'password123',
      mode: 'join',
      code,
    })
    const other = await signup('t2-c@example.com', 'Other', {}, '5.5.5.5')
    const aId = (await a.state()).user.id
    const pId = (await partner.state()).user.id

    await a.call('POST', '/api/batch', {
      ops: [{ op: 'put', entity: 'train', id: 'w1', body: workout(aId) }],
    })
    // other household sees nothing and cannot delete
    expect((await other.state()).train).toEqual([])
    await other.call('POST', '/api/batch', { ops: [{ op: 'delete', entity: 'train', id: 'w1' }] })
    expect((await a.state()).train.length).toBe(1)
    // partner cannot delete or overwrite it
    await partner.call('POST', '/api/batch', { ops: [{ op: 'delete', entity: 'train', id: 'w1' }] })
    await partner.call('POST', '/api/batch', {
      ops: [{ op: 'put', entity: 'train', id: 'w1', body: workout(pId, 'w1', 'Hijacked') }],
    })
    const after = (await a.state()).train[0] as { name: string; userId: string }
    expect(after.name).toBe('Push')
    expect(after.userId).toBe(aId)
  })

  it('always files entries under the signed-in user and rejects bad data', async () => {
    const a = await signup('t3-a@example.com')
    const me = (await a.state()).user.id
    const forged = await a.call('POST', '/api/batch', {
      ops: [{ op: 'put', entity: 'train', id: 'w9', body: workout('not-me', 'w9') }],
    })
    expect(forged.status).toBe(200)
    expect(((await a.state()).train[0] as { userId: string }).userId).toBe(me)
    const nonsense = await a.call('POST', '/api/batch', {
      ops: [{ op: 'put', entity: 'train', id: 'w8', body: { ...workout(me, 'w8'), kind: 'nope' } }],
    })
    expect(nonsense.status).toBe(400)
  })
})
