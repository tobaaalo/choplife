import type { HouseholdSettings, PlanEntry, Recipe, Slot } from '../shared/types'
import { SLOTS, SLOT_LABEL } from '../shared/types'
import type { D1Like } from '../server/types'

export interface Sub {
  endpoint: string
  data: { p256dh: string; auth: string }
}
export interface Note {
  title: string
  body: string
  url: string
}
/** Returns the HTTP status from the push service, or 0 when it could not be reached. */
export type Sender = (sub: Sub, note: Note) => Promise<number>

const WINDOW_MIN = 30
const SHOP_HOUR = 20
const EMPTY_DAYS = 30

export function localParts(now: Date, tz: string): { date: string; minutes: number } {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) }
}

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function inQuiet(s: HouseholdSettings, minutes: number): boolean {
  if (!s.quietFrom || !s.quietTo) return false
  const a = toMin(s.quietFrom)
  const b = toMin(s.quietTo)
  return a <= b ? minutes >= a && minutes < b : minutes >= a || minutes < b
}

function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

const HOUSEHOLD_TABLES = [
  'recipes',
  'plan',
  'logs',
  'pantry',
  'manual',
  'feedback',
  'push_subs',
  'reminder_log',
]

export async function runReminders(
  db: D1Like,
  now: Date,
  send: Sender,
): Promise<{ sent: number; cleaned: number }> {
  let sent = 0
  const hs = await db
    .prepare('SELECT id, settings FROM households')
    .all<{ id: string; settings: string }>()

  for (const h of hs.results) {
    const s = JSON.parse(h.settings) as HouseholdSettings
    if (!s.remindersOn && !s.shoppingNudge) continue
    const { date, minutes } = localParts(now, s.tz)
    if (inQuiet(s, minutes)) continue
    const subs = (
      await db
        .prepare('SELECT endpoint, data FROM push_subs WHERE household_id = ?')
        .bind(h.id)
        .all<{ endpoint: string; data: string }>()
    ).results.map((r) => ({ endpoint: r.endpoint, data: JSON.parse(r.data) as Sub['data'] }))
    if (subs.length === 0) continue

    const due: { key: string; note: Note }[] = []

    if (s.remindersOn) {
      for (const slot of SLOTS as readonly Slot[]) {
        if (!s.meals[slot].on) continue
        const at = toMin(s.meals[slot].time) - s.leadMinutes
        if (minutes < at || minutes >= at + WINDOW_MIN) continue
        const entry = await db
          .prepare('SELECT data FROM plan WHERE household_id = ? AND date = ? AND slot = ?')
          .bind(h.id, date, slot)
          .first<{ data: string }>()
        if (!entry) continue
        const e = JSON.parse(entry.data) as PlanEntry
        const logged = await db
          .prepare(
            "SELECT 1 AS x FROM logs WHERE household_id = ? AND date = ? AND json_extract(data, '$.slot') = ? LIMIT 1",
          )
          .bind(h.id, date, slot)
          .first()
        if (logged) continue
        const rec = await db
          .prepare('SELECT data FROM recipes WHERE household_id = ? AND id = ?')
          .bind(h.id, e.recipeId)
          .first<{ data: string }>()
        const name = rec ? (JSON.parse(rec.data) as Recipe).name : 'your planned meal'
        due.push({
          key: `meal:${date}:${slot}`,
          note: {
            title: `${SLOT_LABEL[slot]} time`,
            body:
              s.leadMinutes > 0
                ? `${name} in about ${s.leadMinutes} minutes.`
                : `${name} is on the plan.`,
            url: '/today',
          },
        })
      }
    }

    if (s.shoppingNudge && minutes >= SHOP_HOUR * 60 && minutes < SHOP_HOUR * 60 + WINDOW_MIN) {
      const tomorrow = nextDay(date)
      const n = await db
        .prepare('SELECT COUNT(*) AS n FROM plan WHERE household_id = ? AND date = ?')
        .bind(h.id, tomorrow)
        .first<{ n: number }>()
      if ((n?.n ?? 0) > 0) {
        due.push({
          key: `shop:${date}`,
          note: {
            title: 'Shopping check',
            body: 'Meals are planned for tomorrow. Check your list.',
            url: '/list',
          },
        })
      }
    }

    for (const d of due) {
      const claimed = await db
        .prepare('SELECT 1 AS x FROM reminder_log WHERE household_id = ? AND key = ?')
        .bind(h.id, d.key)
        .first()
      if (claimed) continue
      await db
        .prepare('INSERT OR IGNORE INTO reminder_log (household_id, key, sent_at) VALUES (?, ?, ?)')
        .bind(h.id, d.key, now.toISOString())
        .run()
      for (const sub of subs) {
        const status = await send(sub, d.note)
        if (status === 404 || status === 410) {
          await db.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(sub.endpoint).run()
        } else if (status >= 200 && status < 300) sent++
      }
    }
  }

  // housekeeping
  let cleaned = 0
  const cutoff = new Date(now.getTime() - EMPTY_DAYS * 86_400_000).toISOString()
  const empty = await db
    .prepare('SELECT id FROM households WHERE empty_since IS NOT NULL AND empty_since < ?')
    .bind(cutoff)
    .all<{ id: string }>()
  for (const h of empty.results) {
    const stmts = HOUSEHOLD_TABLES.map((t) =>
      db.prepare(`DELETE FROM ${t} WHERE household_id = ?`).bind(h.id),
    )
    stmts.push(db.prepare('DELETE FROM households WHERE id = ?').bind(h.id))
    await db.batch(stmts)
    cleaned++
  }
  await db
    .prepare('DELETE FROM reminder_log WHERE sent_at < ?')
    .bind(new Date(now.getTime() - 7 * 86_400_000).toISOString())
    .run()
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now.toISOString()).run()
  await db.prepare('DELETE FROM tokens WHERE expires_at < ?').bind(now.toISOString()).run()
  return { sent, cleaned }
}
