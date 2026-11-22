import type { Recipe, Slot } from '../../shared/types'
import { uid } from './ids'

export function blank(name: string, mealTypes: Slot[]): Recipe {
  return {
    id: uid(),
    name,
    mealTypes,
    cookMinutes: null,
    kcal: null,
    protein: null,
    carbs: null,
    fat: null,
    heat: null,
    tags: [],
    ingredients: [],
    steps: '',
    notes: '',
    makesExtra: false,
    source: 'own',
    updatedAt: new Date().toISOString(),
  }
}
