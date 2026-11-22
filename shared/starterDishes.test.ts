import { describe, expect, it } from 'vitest'
import { STARTER_DISHES } from './starterDishes'
import { SLOTS } from './types'

describe('starter dishes', () => {
  it('has unique keys and names', () => {
    expect(new Set(STARTER_DISHES.map((d) => d.key)).size).toBe(STARTER_DISHES.length)
    expect(new Set(STARTER_DISHES.map((d) => d.name.toLowerCase())).size).toBe(
      STARTER_DISHES.length,
    )
  })

  it('has valid meal types, tags and times, and covers every main meal', () => {
    for (const d of STARTER_DISHES) {
      expect(d.mealTypes.length).toBeGreaterThan(0)
      for (const m of d.mealTypes) expect(SLOTS).toContain(m)
      expect(d.tags.length).toBeGreaterThan(0)
      expect(d.cookMinutes).toBeGreaterThan(0)
    }
    for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
      expect(STARTER_DISHES.filter((d) => d.mealTypes.includes(slot)).length).toBeGreaterThan(15)
    }
  })
})
