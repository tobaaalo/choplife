import { describe, expect, it } from 'vitest'
import { termMatches, violations } from './rules'
import { recipe } from '../testkit'

const noRules = { allergies: [], wontEat: [] }

describe('violations', () => {
  it('flags allergies from the dish name, tags and ingredients', () => {
    const r = recipe({
      name: 'Jollof pasta with boiled egg',
      tags: ['pasta'],
      ingredients: [{ name: 'Ground crayfish', amount: 5, unit: 'g', aisle: 'protein' }],
    })
    expect(violations(r, { allergies: ['egg'], wontEat: [] })).toEqual(['Contains eggs'])
    expect(violations(r, { allergies: ['gluten'], wontEat: [] }).length).toBe(1)
    expect(violations(r, { allergies: ['shellfish'], wontEat: [] }).length).toBe(1)
    expect(violations(r, { allergies: ['peanut'], wontEat: [] })).toEqual([])
    expect(violations(r, noRules)).toEqual([])
  })

  it('matches whole words so "pea" does not hit peanut or pepper', () => {
    const r = recipe({ name: 'Peanut pepper soup' })
    expect(violations(r, { allergies: [], wontEat: ['peas'] })).toEqual([])
    expect(
      violations(recipe({ name: 'Rice with green peas' }), { allergies: [], wontEat: ['peas'] })
        .length,
    ).toBe(1)
  })

  it('handles preset synonyms and custom words', () => {
    expect(
      violations(recipe({ name: 'Okro soup and eba' }), { allergies: [], wontEat: ['okra'] })
        .length,
    ).toBe(1)
    expect(
      violations(recipe({ name: 'Moi moi' }), { allergies: [], wontEat: ['beans'] }).length,
    ).toBe(1)
    expect(
      violations(recipe({ name: 'Rice with goat stew' }), { allergies: [], wontEat: ['goat'] })
        .length,
    ).toBe(1)
    expect(
      violations(recipe({ name: 'Rice with turkey' }), { allergies: [], wontEat: ['turkey'] })
        .length,
    ).toBe(1)
  })
})

describe('typed rules match singular and plural both ways', () => {
  it('matches shrimps, tomatoes and mushrooms against singular dish names', () => {
    expect(termMatches('shrimp stew', 'shrimps')).toBe(true)
    expect(termMatches('tomato stew', 'tomatoes')).toBe(true)
    expect(termMatches('mushroom omelette', 'mushrooms')).toBe(true)
    expect(termMatches('grass fed beef', 'glass')).toBe(false)
  })
})
