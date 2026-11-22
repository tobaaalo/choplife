import type { Aisle } from '../types'
export type StarterIngredient = [name: string, amount: number | null, unit: string, aisle: Aisle]
export interface StarterRecipe {
  ingredients: StarterIngredient[]
  steps: string
  makesExtra?: boolean
}
