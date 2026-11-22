import { DEFAULT_TRAINING_KCAL } from './types'
import type {
  Goal,
  Level,
  Sport,
  SportLevel,
  SportSession,
  TrainItem,
  TrainPref,
  Workout,
} from './types'

export const workoutsOf = (items: TrainItem[], userId: string): Workout[] =>
  items
    .filter((i): i is Workout => i.kind === 'workout' && i.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

export const sessionsOf = (items: TrainItem[], userId: string, sport?: Sport): SportSession[] =>
  items
    .filter(
      (i): i is SportSession =>
        i.kind === 'session' && i.userId === userId && (!sport || i.sport === sport),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))

export const goalsOf = (items: TrainItem[], userId: string, area: Goal['area']): Goal[] =>
  items.filter((i): i is Goal => i.kind === 'goal' && i.userId === userId && i.area === area)

export function levelOf(items: TrainItem[], userId: string, sport: Sport): Level {
  const l = items.find(
    (i): i is SportLevel => i.kind === 'level' && i.userId === userId && i.sport === sport,
  )
  return l?.level ?? 'beginner'
}

export function trainingKcal(items: TrainItem[], userId: string): number {
  const p = items.find((i): i is TrainPref => i.kind === 'pref' && i.userId === userId)
  return p ? p.trainingKcal : DEFAULT_TRAINING_KCAL
}

/** True when the person has a workout or sport session on that date. */
export function trainsOn(items: TrainItem[], userId: string, date: string): boolean {
  return items.some(
    (i) => (i.kind === 'workout' || i.kind === 'session') && i.userId === userId && i.date === date,
  )
}

/** Extra calories for the day, 0 when there is no training. */
export function bonusFor(items: TrainItem[], userId: string, date: string): number {
  return trainsOn(items, userId, date) ? trainingKcal(items, userId) : 0
}

/** Estimated one-rep max (Epley). Reps of 1 return the weight itself. */
export function est1RM(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0
  return reps === 1 ? kg : kg * (1 + reps / 30)
}

export function volumeOf(w: Workout): number {
  return w.exercises.reduce((n, e) => n + e.sets.reduce((m, s) => m + s.kg * s.reps, 0), 0)
}

export interface ProgressPoint {
  date: string
  e1rm: number
  best: string
}

/** Best set per finished workout for one exercise, oldest first. */
export function progressSeries(
  items: TrainItem[],
  userId: string,
  exercise: string,
): ProgressPoint[] {
  const out: ProgressPoint[] = []
  for (const w of workoutsOf(items, userId).reverse()) {
    if (!w.done) continue
    const ex = w.exercises.find((e) => e.name === exercise)
    if (!ex) continue
    let best: ProgressPoint | null = null
    for (const s of ex.sets) {
      const v = est1RM(s.kg, s.reps)
      if (v > 0 && (!best || v > best.e1rm)) {
        best = { date: w.date, e1rm: Math.round(v * 10) / 10, best: `${s.reps} x ${s.kg} kg` }
      }
    }
    if (best) out.push(best)
  }
  return out
}

/** What you did last time for this exercise, to pre-fill and compare. */
export function lastSets(items: TrainItem[], userId: string, exercise: string, beforeId?: string) {
  for (const w of workoutsOf(items, userId)) {
    if (w.id === beforeId || !w.done) continue
    const ex = w.exercises.find((e) => e.name === exercise && e.sets.length > 0)
    if (ex) return { date: w.date, sets: ex.sets }
  }
  return null
}

export function exercisesDone(items: TrainItem[], userId: string): string[] {
  const names = new Set<string>()
  for (const w of workoutsOf(items, userId))
    if (w.done) for (const e of w.exercises) names.add(e.name)
  return [...names].sort()
}

/** Monday of the week containing the ISO date. */
export function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

export function sessionsThisWeek(items: TrainItem[], userId: string, today: string): number {
  const start = weekStart(today)
  return items.filter(
    (i) =>
      (i.kind === 'workout' ? i.done : i.kind === 'session') &&
      i.userId === userId &&
      'date' in i &&
      i.date >= start &&
      i.date <= today,
  ).length
}

/** Consecutive weeks (ending this week) with at least one finished workout or session. */
export function weekStreak(items: TrainItem[], userId: string, today: string): number {
  const weeks = new Set<string>()
  for (const i of items) {
    if (i.userId !== userId) continue
    if ((i.kind === 'workout' && i.done) || i.kind === 'session') weeks.add(weekStart(i.date))
  }
  let n = 0
  let w = weekStart(today)
  if (!weeks.has(w)) {
    // the current week may simply not have started yet
    const prev = new Date(`${w}T12:00:00Z`)
    prev.setUTCDate(prev.getUTCDate() - 7)
    w = prev.toISOString().slice(0, 10)
  }
  while (weeks.has(w)) {
    n++
    const d = new Date(`${w}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 7)
    w = d.toISOString().slice(0, 10)
  }
  return n
}
