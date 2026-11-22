export const SPORTS = ['tennis', 'badminton', 'swimming'] as const
export type Sport = (typeof SPORTS)[number]
export const SPORT_LABEL: Record<Sport, string> = {
  tennis: 'Tennis',
  badminton: 'Badminton',
  swimming: 'Swimming',
}

export const LEVELS = ['beginner', 'improver', 'advanced'] as const
export type Level = (typeof LEVELS)[number]
export const LEVEL_LABEL: Record<Level, string> = {
  beginner: 'Beginner',
  improver: 'Improver',
  advanced: 'Advanced',
}

export interface SetEntry {
  reps: number
  kg: number
}
export interface WorkoutExercise {
  name: string
  sets: SetEntry[]
}

interface Base {
  id: string
  userId: string
}
export interface Workout extends Base {
  kind: 'workout'
  date: string
  name: string
  exercises: WorkoutExercise[]
  notes: string
  done: boolean
}
export interface SportSession extends Base {
  kind: 'session'
  date: string
  sport: Sport
  minutes: number
  /** Metres swum, for swimming. */
  distance: number | null
  drills: string[]
  rating: number
  notes: string
}
export interface Goal extends Base {
  kind: 'goal'
  area: Sport | 'gym'
  text: string
  target: number
  progress: number
  unit: string
  done: boolean
}
export interface SportLevel extends Base {
  kind: 'level'
  sport: Sport
  level: Level
}
export interface TrainPref extends Base {
  kind: 'pref'
  /** Extra calories on days you train. */
  trainingKcal: number
}
export type TrainItem = Workout | SportSession | Goal | SportLevel | TrainPref

export const DEFAULT_TRAINING_KCAL = 250
