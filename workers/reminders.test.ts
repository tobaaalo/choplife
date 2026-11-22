import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../shared/types'
import { createNodeD1 } from '../server/node-d1'
import { localParts, runReminders } from './core'
import type { Note } from './core'

async function seed(settings = DEFAULT_SETTINGS, empty: string | null = null) {
  const db = createNodeD1(':memory:')
  await db
    .prepare(
      'INSERT INTO households (id, invite_code, created_by, settings, empty_since, created_at) VALUES (?,?,?,?,?,?)',
    )
    .bind('h1', 'ABCDEF', 'u1', JSON.stringify(settings), empty, '2026-01-01')
    .run()
  await db
    .prepare(
      'INSERT INTO push_subs (endpoint, user_id, household_id, data, created_at) VALUES (?,?,?,?,?)',
    )
    .bind(
      'https://push.example/1',
      'u1',
      'h1',
      JSON.stringify({ p256dh: 'a', auth: 'b' }),
      '2026-01-01',
    )
    .run()
  await db
    .prepare(
      'INSERT INTO recipes (household_id, id, data, starter_key, updated_at) VALUES (?,?,?,?,?)',
    )
    .bind('h1', 'r1', JSON.stringify({ id: 'r1', name: 'Jollof rice' }), null, '2026-01-01')
    .run()
  await db
    .prepare('INSERT INTO plan (household_id, id, date, slot, data) VALUES (?,?,?,?,?)')
    .bind(
      'h1',
      'p1',
      '2026-11-21',
      'dinner',
      JSON.stringify({ id: 'p1', date: '2026-11-21', slot: 'dinner', recipeId: 'r1' }),
    )
    .run()
  return db
}

describe('reminders', () => {
  it('converts to the household time zone', () => {
    expect(localParts(new Date('2026-07-01T12:00:00Z'), 'Europe/London')).toEqual({
      date: '2026-07-01',
      minutes: 13 * 60,
    })
  })

  it('sends one meal reminder in the window, only once', async () => {
    const db = await seed()
    const got: Note[] = []
    const send = async (_: unknown, n: Note) => (got.push(n), 201)
    // dinner 19:00, 60 min lead, so 18:00 UTC in November (GMT)
    const t = new Date('2026-11-21T18:05:00Z')
    expect((await runReminders(db, t, send)).sent).toBe(1)
    expect(got[0].body).toContain('Jollof rice')
    expect((await runReminders(db, new Date('2026-11-21T18:20:00Z'), send)).sent).toBe(0)
  })

  it('stays quiet outside the window, when eaten, or in quiet hours', async () => {
    const send = async () => 201
    const db = await seed()
    expect((await runReminders(db, new Date('2026-11-21T15:00:00Z'), send)).sent).toBe(0)
    await db
      .prepare('INSERT INTO logs (household_id, id, user_id, date, data) VALUES (?,?,?,?,?)')
      .bind('h1', 'l1', 'u1', '2026-11-21', JSON.stringify({ slot: 'dinner', status: 'eaten' }))
      .run()
    expect((await runReminders(db, new Date('2026-11-21T18:05:00Z'), send)).sent).toBe(0)
    const quiet = await seed({ ...DEFAULT_SETTINGS, quietFrom: '17:00', quietTo: '19:00' })
    expect((await runReminders(quiet, new Date('2026-11-21T18:05:00Z'), send)).sent).toBe(0)
  })

  it('drops dead subscriptions and removes long-empty households', async () => {
    const db = await seed(DEFAULT_SETTINGS, '2026-01-01T00:00:00Z')
    const r = await runReminders(db, new Date('2026-11-21T18:05:00Z'), async () => 410)
    expect(r.cleaned).toBe(1)
    const subs = await db.prepare('SELECT COUNT(*) AS n FROM push_subs').first<{ n: number }>()
    expect(subs?.n).toBe(0)
  })

  it('nudges about shopping the evening before', async () => {
    const db = await seed()
    await db.prepare('UPDATE plan SET date = ? WHERE id = ?').bind('2026-11-22', 'p1').run()
    const got: Note[] = []
    await runReminders(db, new Date('2026-11-21T20:05:00Z'), async (_, n) => (got.push(n), 201))
    expect(got.some((n) => n.url === '/list')).toBe(true)
  })
})
