import type { Recipe, Profile } from './types'
import { emptyProfile } from './types'
import type { Person } from './logic/engine'
import { buildPeople } from './logic/engine'
import { calcTargets } from './logic/nutrition'
import type { RankCtx } from './logic/engine'

export function recipe(over: Partial<Recipe> & { name: string }): Recipe {
  return {
    id: over.id ?? over.name.toLowerCase().replace(/\W+/g, '-'),
    mealTypes: ['lunch', 'dinner'],
    cookMinutes: 40,
    kcal: 700,
    protein: 30,
    carbs: 80,
    fat: 25,
    heat: 'mild',
    tags: [],
    ingredients: [],
    steps: '',
    notes: '',
    makesExtra: false,
    source: 'own',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  }
}

export function profile(userId: string, over: Partial<Profile> = {}): Profile {
  return {
    ...emptyProfile(userId),
    sex: 'male',
    birthYear: 1988,
    heightCm: 181,
    weightKg: 86,
    activity: 'light',
    goal: 'gain',
    setupDone: true,
    ...over,
  }
}

export function people(...profiles: Profile[]): Person[] {
  return buildPeople(
    profiles.map((p) => ({ id: p.userId, name: p.userId, profile: p })),
    (p) => calcTargets(p, new Date('2026-11-21T12:00:00Z')),
    ['breakfast', 'lunch', 'dinner'],
  )
}

export function ctxFor(recipes: Recipe[], ppl: Person[], over: Partial<RankCtx> = {}): RankCtx {
  return {
    recipes,
    people: ppl,
    pantry: [],
    feedback: [],
    plan: [],
    logs: [],
    today: '2026-11-21',
    ...over,
  }
}
