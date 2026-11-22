import { describe, expect, it } from 'vitest'
import { bonusFor, est1RM, progressSeries, trainingKcal, weekStreak } from './logic'
import { coachPlan, drillsFor } from './sports'
import type { SportSession, TrainItem, Workout } from './types'

const me = 'u1'
const wk = (id: string, date: string, kg: number, reps = 5, done = true): Workout => ({
  id,
  userId: me,
  kind: 'workout',
  date,
  name: 'Push',
  notes: '',
  done,
  exercises: [{ name: 'Bench press', sets: [{ reps, kg }] }],
})
const sess = (id: string, date: string, drills: string[]): SportSession => ({
  id,
  userId: me,
  kind: 'session',
  date,
  sport: 'tennis',
  minutes: 45,
  distance: null,
  drills,
  rating: 3,
  notes: '',
})

describe('gym maths', () => {
  it('estimates a one rep max', () => {
    expect(est1RM(100, 1)).toBe(100)
    expect(est1RM(60, 5)).toBeCloseTo(70)
    expect(est1RM(0, 5)).toBe(0)
  })

  it('charts finished workouts oldest first', () => {
    const items: TrainItem[] = [
      wk('b', '2026-11-10', 62.5),
      wk('a', '2026-11-03', 60),
      wk('c', '2026-11-17', 65, 5, false),
    ]
    const s = progressSeries(items, me, 'Bench press')
    expect(s.map((p) => p.date)).toEqual(['2026-11-03', '2026-11-10'])
    expect(s[1].e1rm).toBeGreaterThan(s[0].e1rm)
  })

  it('adds the training bonus only on days you trained', () => {
    const items: TrainItem[] = [wk('a', '2026-11-20', 60)]
    expect(trainingKcal(items, me)).toBe(250)
    expect(bonusFor(items, me, '2026-11-20')).toBe(250)
    expect(bonusFor(items, me, '2026-11-21')).toBe(0)
    items.push({ id: 'p', userId: me, kind: 'pref', trainingKcal: 400 })
    expect(bonusFor(items, me, '2026-11-20')).toBe(400)
  })

  it('counts consecutive weeks with training', () => {
    const items: TrainItem[] = [
      wk('a', '2026-11-18', 60),
      wk('b', '2026-11-11', 60),
      wk('c', '2026-10-28', 60),
    ]
    expect(weekStreak(items, me, '2026-11-20')).toBe(2)
    expect(weekStreak([], me, '2026-11-20')).toBe(0)
  })
})

describe('coach', () => {
  it('only picks drills at or below your level', () => {
    const p = coachPlan('tennis', 'beginner', [], [], '2026-11-20')
    expect(p.drills.length).toBeGreaterThan(0)
    for (const d of p.drills) expect(d.level).toBe('beginner')
    expect(p.minutes).toBeGreaterThan(0)
  })

  it('moves on to drills you have not practised lately', () => {
    const first = coachPlan('tennis', 'improver', [], [], '2026-11-20')
    const ids = first.drills.map((d) => d.id)
    const second = coachPlan('tennis', 'improver', [sess('s', '2026-11-18', ids)], [], '2026-11-20')
    expect(second.drills.map((d) => d.id).join()).not.toBe(ids.join())
  })

  it('has drills for every sport', () => {
    for (const s of ['tennis', 'badminton', 'swimming'] as const)
      expect(drillsFor(s).length).toBeGreaterThanOrEqual(9)
  })
})
