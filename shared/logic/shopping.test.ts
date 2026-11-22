import { describe, expect, it } from 'vitest'
import { buildShoppingList, formatAmount } from './shopping'
import { pantryMatch, sameItem, whatCanICook } from './pantry'
import { recipe } from '../testkit'

const ing = (name: string, amount: number | null, unit = 'g') => ({
  name,
  amount,
  unit,
  aisle: 'pantry' as const,
})

describe('buildShoppingList', () => {
  const a = recipe({ name: 'Egusi', ingredients: [ing('Yam flour', 90), ing('Stock cube', 5)] })
  const b = recipe({ name: 'Fried rice', ingredients: [ing('Stock cube', 5), ing('Carrots', 80)] })
  const entries = [
    {
      id: '1',
      date: '2026-11-23',
      slot: 'lunch' as const,
      recipeId: a.id,
      locked: false,
      leftover: false,
    },
    {
      id: '2',
      date: '2026-11-23',
      slot: 'dinner' as const,
      recipeId: b.id,
      locked: false,
      leftover: false,
    },
    {
      id: '3',
      date: '2026-11-24',
      slot: 'lunch' as const,
      recipeId: b.id,
      locked: false,
      leftover: true,
    },
  ]

  it('sums amounts across dishes and scales by servings', () => {
    const lines = buildShoppingList(entries, [a, b], [], [], () => 2)
    const cube = lines.find((l) => l.name === 'Stock cube')!
    expect(cube.amount).toBe(20)
    expect(cube.forDishes.sort()).toEqual(['Egusi', 'Fried rice'])
    expect(lines.find((l) => l.name === 'Carrots')!.amount).toBe(160)
  })

  it('ignores leftover entries', () => {
    const lines = buildShoppingList(entries, [a, b], [], [], () => 1)
    expect(lines.find((l) => l.name === 'Carrots')!.amount).toBe(80)
  })

  it('marks items already in the pantry and includes manual items', () => {
    const lines = buildShoppingList(
      entries,
      [a, b],
      [{ id: 'p', name: 'carrot', quantity: '' }],
      [{ id: 'm', name: 'Washing up liquid', aisle: 'other', amount: '' }],
      () => 1,
    )
    expect(lines.find((l) => l.name === 'Carrots')!.inPantry).toBe(true)
    expect(lines.find((l) => l.name === 'Yam flour')!.inPantry).toBe(false)
    expect(lines.find((l) => l.manualId === 'm')).toBeTruthy()
  })

  it('formats amounts', () => {
    expect(formatAmount(1500, 'g')).toBe('1.5 kg')
    expect(formatAmount(2, '')).toBe('2')
    expect(formatAmount(null, 'g')).toBe('')
    expect(formatAmount(12.4, 'tsp')).toBe('12 tsp')
  })
})

describe('pantry', () => {
  it('matches plurals and partial names', () => {
    expect(sameItem('Tomatoes', 'tomato')).toBe(true)
    expect(sameItem('Ground egusi', 'egusi')).toBe(true)
    expect(sameItem('Rice', 'Rice flour')).toBe(true)
    expect(sameItem('Egg', 'Eggplant')).toBe(false)
    expect(sameItem('', 'rice')).toBe(false)
  })

  it('reports have, missing and ratio', () => {
    const r = recipe({
      name: 'x',
      ingredients: [ing('Rice', 1), ing('Beans', 1), ing('Oil', 1), ing('Salt', 1)],
    })
    const m = pantryMatch(r, ['rice', 'salt'])
    expect(m.have.length).toBe(2)
    expect(m.missing.map((i) => i.name)).toEqual(['Beans', 'Oil'])
    expect(m.ratio).toBe(0.5)
    expect(pantryMatch(recipe({ name: 'empty' }), ['rice']).ratio).toBeNull()
  })

  it('ranks what you can cook now', () => {
    const a = recipe({ name: 'A', ingredients: [ing('Rice', 1), ing('Beans', 1)] })
    const b = recipe({ name: 'B', ingredients: [ing('Rice', 1)] })
    const c = recipe({ name: 'C', ingredients: [ing('Yam', 1)] })
    expect(whatCanICook([a, b, c], ['rice']).map((x) => x.recipe.name)).toEqual(['B', 'A'])
  })
})
