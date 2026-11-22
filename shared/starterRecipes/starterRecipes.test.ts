import { describe, expect, it } from 'vitest'
import { STARTER_DISHES } from '../starterDishes'
import { UNITS } from '../types'
import { STARTER_RECIPES } from './index'

describe('starter recipes', () => {
  it('has a recipe for every starter dish and no strays', () => {
    const keys = STARTER_DISHES.map((d) => d.key).sort()
    expect(Object.keys(STARTER_RECIPES).sort()).toEqual(keys)
  })

  it('has real ingredients and steps for each', () => {
    for (const d of STARTER_DISHES) {
      const r = STARTER_RECIPES[d.key]
      expect(r.ingredients.length, d.name).toBeGreaterThanOrEqual(
        d.mealTypes.includes('snack') ? 1 : 4,
      )
      expect(r.steps.split('\n').length, d.name).toBeGreaterThanOrEqual(
        d.mealTypes.includes('snack') ? 2 : 4,
      )
      for (const [name, amount, unit] of r.ingredients) {
        expect(name.trim(), d.name).not.toBe('')
        expect((UNITS as readonly string[]).includes(unit), `${d.name}: ${name} unit ${unit}`).toBe(
          true,
        )
        if (amount != null) expect(amount, `${d.name}: ${name}`).toBeGreaterThan(0)
      }
    }
  })
})
