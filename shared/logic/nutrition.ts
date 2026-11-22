import type { Activity, Goal, Profile, Slot } from '../types'
import { SLOTS } from '../types'
import { ageFromBirthYear } from './dates'

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
}

export const ACTIVITY_LABEL: Record<Activity, string> = {
  sedentary: 'Mostly sitting',
  light: 'Lightly active',
  moderate: 'Active 3 to 5 days a week',
  very: 'Very active',
  extra: 'Athlete or manual work',
}

export const GOAL_ADJUST: Record<Goal, number> = { gain: 400, lose: -500, maintain: 0 }

export interface Targets {
  kcal: number
  protein: number
  carbs: number
  fat: number
  source: 'calculated' | 'programme'
  bmr: number | null
  tdee: number | null
  adjust: number | null
}

export interface MealTarget {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export function bmr(
  sex: 'female' | 'male',
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

const round10 = (n: number) => Math.round(n / 10) * 10

/** Fills in protein, fat and carbs from a calorie figure, honouring any macros the person typed. */
function macrosFor(
  kcal: number,
  weightKg: number | null,
  p: Pick<Profile, 'overrideProtein' | 'overrideCarbs' | 'overrideFat'>,
) {
  const protein = p.overrideProtein ?? Math.round(weightKg ? 1.6 * weightKg : (kcal * 0.2) / 4)
  const fat = p.overrideFat ?? Math.round((kcal * 0.25) / 9)
  const carbs = p.overrideCarbs ?? Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  return { protein, carbs, fat }
}

/** Calculated target from stats, or null when stats are missing and there is no override. */
export function calcTargets(profile: Profile, now: Date = new Date()): Targets | null {
  const adjust = profile.adjustKcal ?? GOAL_ADJUST[profile.goal]
  let calcKcal: number | null = null
  let b: number | null = null
  let tdee: number | null = null
  if (profile.sex && profile.birthYear && profile.heightCm && profile.weightKg) {
    b = bmr(
      profile.sex,
      profile.weightKg,
      profile.heightCm,
      ageFromBirthYear(profile.birthYear, now),
    )
    tdee = b * ACTIVITY_FACTOR[profile.activity]
    calcKcal = round10(tdee + adjust)
  }
  if (profile.overrideKcal != null) {
    const kcal = Math.round(profile.overrideKcal)
    return {
      kcal,
      ...macrosFor(kcal, profile.weightKg, profile),
      source: 'programme',
      bmr: b,
      tdee,
      adjust,
    }
  }
  if (calcKcal == null) return null
  return {
    kcal: calcKcal,
    ...macrosFor(calcKcal, profile.weightKg, profile),
    source: 'calculated',
    bmr: b,
    tdee,
    adjust,
  }
}

/** Splits a daily target across the meals a household eats, using each person's shares. */
export function mealTargets(
  targets: Targets,
  shares: Record<Slot, number>,
  enabled: Slot[],
): Record<Slot, MealTarget> {
  const total = enabled.reduce((s, slot) => s + (shares[slot] ?? 0), 0) || 1
  const out = {} as Record<Slot, MealTarget>
  for (const slot of SLOTS) {
    const f = enabled.includes(slot) ? (shares[slot] ?? 0) / total : 0
    out[slot] = {
      kcal: Math.round(targets.kcal * f),
      protein: Math.round(targets.protein * f),
      carbs: Math.round(targets.carbs * f),
      fat: Math.round(targets.fat * f),
    }
  }
  return out
}

export function lowTargetNote(t: Targets | null): string | null {
  if (t && t.kcal < 1200) {
    return 'This is under 1,200 kcal a day. Please check it with your programme provider.'
  }
  return null
}
