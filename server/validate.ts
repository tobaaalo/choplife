import type {
  Feedback,
  HouseholdSettings,
  Ingredient,
  MealLog,
  ManualItem,
  PantryItem,
  PlanEntry,
  Profile,
  Recipe,
  Slot,
} from '../shared/types'
import { AISLES, SLOTS } from '../shared/types'
import { HttpError } from './types'

type Obj = Record<string, unknown>

function bad(message: string): never {
  throw new HttpError(400, 'invalid', message)
}

export function obj(v: unknown, what = 'Request body'): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) bad(`${what} must be an object.`)
  return v as Obj
}

export function str(
  v: unknown,
  field: string,
  max: number,
  opts: { min?: number; trim?: boolean } = {},
): string {
  if (typeof v !== 'string') bad(`${field} must be text.`)
  const s = opts.trim === false ? v : v.trim()
  if (s.length < (opts.min ?? 0)) bad(`${field} is required.`)
  if (s.length > max) bad(`${field} is too long (max ${max} characters).`)
  return s
}

export function optStr(v: unknown, field: string, max: number): string {
  if (v == null) return ''
  return str(v, field, max)
}

export function num(v: unknown, field: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) bad(`${field} must be a number.`)
  if (v < min || v > max) bad(`${field} must be between ${min} and ${max}.`)
  return v
}

export function optNum(v: unknown, field: string, min: number, max: number): number | null {
  if (v == null || v === '') return null
  return num(v, field, min, max)
}

export function bool(v: unknown): boolean {
  return v === true
}

export function oneOf<T extends string>(v: unknown, field: string, allowed: readonly T[]): T {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
    bad(`${field} must be one of: ${allowed.join(', ')}.`)
  }
  return v as T
}

export function arr(v: unknown, field: string, max: number): unknown[] {
  if (!Array.isArray(v)) bad(`${field} must be a list.`)
  if (v.length > max) bad(`${field} has too many items (max ${max}).`)
  return v
}

export function strList(v: unknown, field: string, maxItems: number, maxLen: number): string[] {
  if (v == null) return []
  return arr(v, field, maxItems).map((x) => str(x, field, maxLen, { min: 1 }))
}

const ID_RE = /^[A-Za-z0-9_:.-]{1,100}$/
export function id(v: unknown, field = 'id'): string {
  if (typeof v !== 'string' || !ID_RE.test(v)) bad(`${field} is not valid.`)
  return v
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
export function date(v: unknown, field = 'date'): string {
  if (typeof v !== 'string' || !DATE_RE.test(v) || Number.isNaN(Date.parse(v)))
    bad(`${field} must be a date.`)
  return v
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
function time(v: unknown, field: string): string {
  if (typeof v !== 'string' || !TIME_RE.test(v)) bad(`${field} must be a time like 08:00.`)
  return v
}

export function email(v: unknown): string {
  const s = str(v, 'Email', 254, { min: 1 }).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s))
    bad('Enter a valid email address, like name@example.com.')
  return s
}

export function password(v: unknown, field = 'Password'): string {
  const s = str(v, field, 200, { trim: false })
  if (s.length < 8) bad(`${field} needs at least 8 characters.`)
  return s
}

function ingredient(v: unknown): Ingredient {
  const o = obj(v, 'Ingredient')
  return {
    name: str(o.name, 'Ingredient name', 80, { min: 1 }),
    amount: optNum(o.amount, 'Ingredient amount', 0, 100000),
    unit: optStr(o.unit, 'Ingredient unit', 12),
    aisle: AISLES.includes(o.aisle as never) ? (o.aisle as Ingredient['aisle']) : 'other',
  }
}

export function recipe(v: unknown, idValue: string): Recipe {
  const o = obj(v, 'Recipe')
  const kcal = optNum(o.kcal, 'Calories', 1, 5000)
  return {
    id: idValue,
    name: str(o.name, 'Dish name', 120, { min: 1 }),
    mealTypes: arr(o.mealTypes ?? [], 'Meal types', 4).map((x) => oneOf(x, 'Meal type', SLOTS)),
    cookMinutes: optNum(o.cookMinutes, 'Cook minutes', 1, 1440),
    kcal,
    protein: optNum(o.protein, 'Protein', 0, 1000),
    carbs: optNum(o.carbs, 'Carbs', 0, 1000),
    fat: optNum(o.fat, 'Fat', 0, 1000),
    heat: o.heat == null ? null : oneOf(o.heat, 'Heat', ['mild', 'medium', 'hot'] as const),
    tags: strList(o.tags, 'Tags', 20, 30).map((t) => t.toLowerCase()),
    ingredients: arr(o.ingredients ?? [], 'Ingredients', 60).map(ingredient),
    steps: optStr(o.steps, 'Steps', 6000),
    notes: optStr(o.notes, 'Notes', 2000),
    makesExtra: bool(o.makesExtra),
    source: o.source === 'starter' ? 'starter' : 'own',
    updatedAt: new Date().toISOString(),
  }
}

export function planEntry(v: unknown, idValue: string): PlanEntry {
  const o = obj(v, 'Plan entry')
  return {
    id: idValue,
    date: date(o.date),
    slot: oneOf(o.slot, 'Slot', SLOTS),
    recipeId: id(o.recipeId, 'recipeId'),
    locked: bool(o.locked),
    leftover: bool(o.leftover),
  }
}

export function mealLog(v: unknown, idValue: string, userId: string): MealLog {
  const o = obj(v, 'Log')
  return {
    id: idValue,
    userId,
    date: date(o.date),
    slot: oneOf(o.slot, 'Slot', SLOTS),
    recipeId: o.recipeId == null ? null : id(o.recipeId, 'recipeId'),
    status: oneOf(o.status, 'Status', ['eaten', 'skipped'] as const),
    name: optStr(o.name, 'Name', 120),
    kcal: num(o.kcal ?? 0, 'Calories', 0, 10000),
    protein: num(o.protein ?? 0, 'Protein', 0, 2000),
    carbs: num(o.carbs ?? 0, 'Carbs', 0, 2000),
    fat: num(o.fat ?? 0, 'Fat', 0, 2000),
    mult: num(o.mult ?? 1, 'Portion', 0, 10),
  }
}

export function pantryItem(v: unknown, idValue: string): PantryItem {
  const o = obj(v, 'Pantry item')
  return {
    id: idValue,
    name: str(o.name, 'Item name', 80, { min: 1 }),
    quantity: optStr(o.quantity, 'Quantity', 40),
  }
}

export function manualItem(v: unknown, idValue: string): ManualItem {
  const o = obj(v, 'List item')
  return {
    id: idValue,
    name: str(o.name, 'Item name', 80, { min: 1 }),
    aisle: AISLES.includes(o.aisle as never) ? (o.aisle as ManualItem['aisle']) : 'other',
    amount: optStr(o.amount, 'Amount', 40),
  }
}

export function feedback(v: unknown, recipeId: string): Feedback {
  const o = obj(v, 'Feedback')
  return {
    recipeId,
    loved: bool(o.loved),
    hiddenUntil: o.hiddenUntil == null ? null : date(o.hiddenUntil, 'hiddenUntil'),
  }
}

export function profile(v: unknown, userId: string): Profile {
  const o = obj(v, 'Profile')
  const sharesIn = obj(o.shares ?? {}, 'Shares')
  const shares = {} as Record<Slot, number>
  for (const s of SLOTS) shares[s] = num(sharesIn[s] ?? 0, `${s} share`, 0, 100)
  return {
    userId,
    sex: o.sex == null ? null : oneOf(o.sex, 'Sex', ['female', 'male'] as const),
    birthYear: optNum(o.birthYear, 'Birth year', 1900, new Date().getFullYear()),
    heightCm: optNum(o.heightCm, 'Height', 80, 250),
    weightKg: optNum(o.weightKg, 'Weight', 25, 400),
    activity: oneOf(o.activity ?? 'light', 'Activity', [
      'sedentary',
      'light',
      'moderate',
      'very',
      'extra',
    ] as const),
    goal: oneOf(o.goal ?? 'maintain', 'Goal', ['lose', 'maintain', 'gain'] as const),
    adjustKcal: optNum(o.adjustKcal, 'Calorie adjustment', -2000, 2000),
    overrideKcal: optNum(o.overrideKcal, 'Daily calories', 500, 10000),
    overrideProtein: optNum(o.overrideProtein, 'Protein', 0, 1000),
    overrideCarbs: optNum(o.overrideCarbs, 'Carbs', 0, 2000),
    overrideFat: optNum(o.overrideFat, 'Fat', 0, 1000),
    allergies: strList(o.allergies, 'Allergies', 30, 40),
    wontEat: strList(o.wontEat, 'Foods you will not eat', 40, 40).map((x) => x.toLowerCase()),
    shares,
    setupDone: bool(o.setupDone),
  }
}

export function settings(v: unknown): HouseholdSettings {
  const o = obj(v, 'Settings')
  const mealsIn = obj(o.meals ?? {}, 'Meals')
  const meals = {} as HouseholdSettings['meals']
  for (const s of SLOTS) {
    const m = obj(mealsIn[s] ?? {}, `${s} settings`)
    meals[s] = { on: bool(m.on), time: time(m.time ?? '12:00', `${s} time`) }
  }
  if (!SLOTS.some((s) => meals[s].on)) bad('Keep at least one meal switched on.')
  const tz = str(o.tz ?? 'Europe/London', 'Time zone', 64, { min: 1 })
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
  } catch {
    bad('That time zone is not recognised.')
  }
  return {
    meals,
    tz,
    remindersOn: bool(o.remindersOn),
    leadMinutes: num(o.leadMinutes ?? 60, 'Reminder lead time', 5, 240),
    quietFrom: o.quietFrom == null ? null : time(o.quietFrom, 'Quiet hours start'),
    quietTo: o.quietTo == null ? null : time(o.quietTo, 'Quiet hours end'),
    shoppingNudge: bool(o.shoppingNudge),
  }
}
