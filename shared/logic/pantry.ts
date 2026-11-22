import type { Ingredient, Recipe } from '../types'

export function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(ies)$/, 'y')
    .replace(/(oes)$/, 'o')
    .replace(/(?<!s)s$/, '')
}

export function sameItem(a: string, b: string): boolean {
  const x = normName(a)
  const y = normName(b)
  if (!x || !y) return false
  if (x === y) return true
  if (Math.min(x.length, y.length) < 3) return false
  const wordsX = x.split(' ')
  const wordsY = y.split(' ')
  return wordsX.includes(y) || wordsY.includes(x) || x.includes(` ${y}`) || y.includes(` ${x}`)
}

export interface PantryMatch {
  have: Ingredient[]
  missing: Ingredient[]
  /** null when the recipe has no ingredient list yet */
  ratio: number | null
}

export function pantryMatch(
  recipe: Pick<Recipe, 'ingredients'>,
  pantryNames: string[],
): PantryMatch {
  const have: Ingredient[] = []
  const missing: Ingredient[] = []
  for (const ing of recipe.ingredients) {
    if (pantryNames.some((p) => sameItem(p, ing.name))) have.push(ing)
    else missing.push(ing)
  }
  const n = recipe.ingredients.length
  return { have, missing, ratio: n === 0 ? null : have.length / n }
}

/** Recipes you can make now, best match first. Recipes without ingredients are left out. */
export function whatCanICook(
  recipes: Recipe[],
  pantryNames: string[],
): { recipe: Recipe; match: PantryMatch }[] {
  return recipes
    .filter((r) => r.kcal != null || r.ingredients.length > 0)
    .map((recipe) => ({ recipe, match: pantryMatch(recipe, pantryNames) }))
    .filter((x) => x.match.ratio != null && x.match.have.length > 0)
    .sort(
      (a, b) =>
        (b.match.ratio ?? 0) - (a.match.ratio ?? 0) ||
        a.match.missing.length - b.match.missing.length,
    )
}
