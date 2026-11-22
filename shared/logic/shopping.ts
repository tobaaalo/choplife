import type { Aisle, Ingredient, ManualItem, PantryItem, PlanEntry, Recipe } from '../types'
import { normName, sameItem } from './pantry'

export interface ShoppingLine {
  key: string
  name: string
  unit: string
  amount: number | null
  aisle: Aisle
  /** dish names that need it */
  forDishes: string[]
  manualId?: string
  inPantry: boolean
}

export function formatAmount(amount: number | null, unit: string): string {
  if (amount == null) return ''
  let a = amount
  let u = unit
  if (u === 'g' && a >= 1000) {
    a /= 1000
    u = 'kg'
  }
  if (u === 'ml' && a >= 1000) {
    a /= 1000
    u = 'l'
  }
  if (!u) {
    const q = Math.round(a * 4) / 4
    const whole = Math.floor(q)
    const frac =
      ({ 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' } as Record<number, string>)[q - whole] ?? ''
    return `${whole > 0 || !frac ? whole : ''}${frac}`
  }
  const rounded = a >= 10 ? Math.round(a) : Math.round(a * 10) / 10
  const n = String(rounded)
  return u ? `${n} ${u}` : n
}

/**
 * Builds the shopping list for a set of plan entries.
 * `servingsFor` returns how many standard servings the household eats of a plan entry
 * (the sum of everyone's portion multipliers), because ingredient amounts are per one standard serving.
 */
export function buildShoppingList(
  entries: PlanEntry[],
  recipes: Recipe[],
  pantry: PantryItem[],
  manual: ManualItem[],
  servingsFor: (entry: PlanEntry, recipe: Recipe) => number,
): ShoppingLine[] {
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const lines = new Map<string, ShoppingLine>()
  for (const e of entries) {
    const r = byId.get(e.recipeId)
    if (!r || e.leftover) continue
    const servings = servingsFor(e, r)
    for (const ing of r.ingredients) {
      add(lines, ing, servings, r.name)
    }
  }
  for (const m of manual) {
    const key = `manual:${m.id}`
    lines.set(key, {
      key,
      name: m.name,
      unit: '',
      amount: null,
      aisle: m.aisle,
      forDishes: m.amount ? [m.amount] : [],
      manualId: m.id,
      inPantry: false,
    })
  }
  const out = [...lines.values()]
  for (const l of out) {
    l.inPantry = pantry.some((p) => sameItem(p.name, l.name))
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

function add(lines: Map<string, ShoppingLine>, ing: Ingredient, servings: number, dish: string) {
  const key = `${normName(ing.name)}|${ing.unit}`
  const amount = ing.amount == null ? null : ing.amount * servings
  const existing = lines.get(key)
  if (existing) {
    if (amount != null) existing.amount = (existing.amount ?? 0) + amount
    if (!existing.forDishes.includes(dish)) existing.forDishes.push(dish)
    return
  }
  lines.set(key, {
    key,
    name: ing.name,
    unit: ing.unit,
    amount,
    aisle: ing.aisle,
    forDishes: [dish],
    inPantry: false,
  })
}
