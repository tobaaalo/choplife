import type { MealTarget } from './nutrition'

export const MIN_MULT = 0.5
export const MAX_MULT = 2.5

export interface Portion {
  mult: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** achieved calories divided by the target */
  reach: number
  status: 'ok' | 'under' | 'over'
}

export interface RecipeNutrition {
  kcal: number
  protein: number | null
  carbs: number | null
  fat: number | null
}

export function clampMult(raw: number): number {
  const stepped = Math.round(raw * 4) / 4
  return Math.min(MAX_MULT, Math.max(MIN_MULT, stepped))
}

export function portionFor(target: MealTarget, r: RecipeNutrition): Portion {
  const raw = target.kcal > 0 ? target.kcal / r.kcal : 1
  const mult = clampMult(raw)
  const kcal = Math.round(r.kcal * mult)
  const reach = target.kcal > 0 ? kcal / target.kcal : 1
  return {
    mult,
    kcal,
    protein: Math.round((r.protein ?? 0) * mult),
    carbs: Math.round((r.carbs ?? 0) * mult),
    fat: Math.round((r.fat ?? 0) * mult),
    reach,
    status: reach < 0.9 ? 'under' : reach > 1.1 ? 'over' : 'ok',
  }
}

export function formatMult(m: number): string {
  const s = Number.isInteger(m) ? String(m) : String(m)
  return `${s}x`
}
