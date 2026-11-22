export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type Slot = (typeof SLOTS)[number]

export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export type Sex = 'female' | 'male'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
export type Goal = 'lose' | 'maintain' | 'gain'
export type Heat = 'mild' | 'medium' | 'hot'

export const AISLES = [
  'veg_fruit',
  'tubers',
  'grains',
  'protein',
  'dairy_eggs',
  'bakery',
  'beans',
  'pantry',
  'other',
] as const
export type Aisle = (typeof AISLES)[number]

export const AISLE_LABEL: Record<Aisle, string> = {
  veg_fruit: 'Fruit and veg',
  tubers: 'Yam, potato and plantain',
  grains: 'Rice, pasta and grains',
  protein: 'Meat and fish',
  dairy_eggs: 'Dairy and eggs',
  bakery: 'Bread and wraps',
  beans: 'Beans and legumes',
  pantry: 'Oils, spices and cupboard',
  other: 'Other',
}

export const AISLE_SHORT: Record<Aisle, string> = {
  veg_fruit: 'Veg',
  tubers: 'Tubers',
  grains: 'Grains',
  protein: 'Meat/fish',
  dairy_eggs: 'Dairy',
  bakery: 'Bread',
  beans: 'Beans',
  pantry: 'Cupboard',
  other: 'Other',
}

export const UNITS = ['', 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pinch'] as const

export interface Ingredient {
  name: string
  amount: number | null
  unit: string
  aisle: Aisle
}

export interface Recipe {
  id: string
  name: string
  mealTypes: Slot[]
  cookMinutes: number | null
  kcal: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  heat: Heat | null
  tags: string[]
  ingredients: Ingredient[]
  steps: string
  notes: string
  makesExtra: boolean
  source: 'starter' | 'own'
  updatedAt: string
}

export interface Profile {
  userId: string
  sex: Sex | null
  birthYear: number | null
  heightCm: number | null
  weightKg: number | null
  activity: Activity
  goal: Goal
  adjustKcal: number | null
  overrideKcal: number | null
  overrideProtein: number | null
  overrideCarbs: number | null
  overrideFat: number | null
  allergies: string[]
  wontEat: string[]
  shares: Record<Slot, number>
  setupDone: boolean
}

export interface PlanEntry {
  id: string
  date: string
  slot: Slot
  recipeId: string
  locked: boolean
  leftover: boolean
}

export interface MealLog {
  id: string
  userId: string
  date: string
  slot: Slot
  recipeId: string | null
  status: 'eaten' | 'skipped'
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  mult: number
}

export interface PantryItem {
  id: string
  name: string
  quantity: string
}

export interface ManualItem {
  id: string
  name: string
  aisle: Aisle
  amount: string
}

export interface Feedback {
  recipeId: string
  loved: boolean
  hiddenUntil: string | null
}

export interface MealConfig {
  on: boolean
  time: string
}

export interface HouseholdSettings {
  meals: Record<Slot, MealConfig>
  tz: string
  remindersOn: boolean
  leadMinutes: number
  quietFrom: string | null
  quietTo: string | null
  shoppingNudge: boolean
}

export interface Member {
  id: string
  name: string
  profile: Profile
}

export interface AppState {
  user: { id: string; name: string; email: string }
  household: {
    id: string
    inviteCode: string
    createdBy: string
    settings: HouseholdSettings
  }
  members: Member[]
  recipes: Recipe[]
  plan: PlanEntry[]
  logs: MealLog[]
  pantry: PantryItem[]
  manual: ManualItem[]
  feedback: Feedback[]
}

export const DEFAULT_SHARES: Record<Slot, number> = {
  breakfast: 25,
  lunch: 35,
  dinner: 40,
  snack: 10,
}

export const DEFAULT_SETTINGS: HouseholdSettings = {
  meals: {
    breakfast: { on: true, time: '08:00' },
    lunch: { on: true, time: '13:00' },
    dinner: { on: true, time: '19:00' },
    snack: { on: false, time: '16:00' },
  },
  tz: 'Europe/London',
  remindersOn: true,
  leadMinutes: 60,
  quietFrom: null,
  quietTo: null,
  shoppingNudge: true,
}

export function emptyProfile(userId: string): Profile {
  return {
    userId,
    sex: null,
    birthYear: null,
    heightCm: null,
    weightKg: null,
    activity: 'light',
    goal: 'maintain',
    adjustKcal: null,
    overrideKcal: null,
    overrideProtein: null,
    overrideCarbs: null,
    overrideFat: null,
    allergies: [],
    wontEat: [],
    shares: { ...DEFAULT_SHARES },
    setupDone: false,
  }
}
