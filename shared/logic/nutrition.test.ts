import { describe, expect, it } from 'vitest'
import { emptyProfile } from '../types'
import { bmr, calcTargets, lowTargetNote, mealTargets } from './nutrition'
import { profile } from '../testkit'

const NOW = new Date('2026-11-21T12:00:00Z')

describe('calcTargets', () => {
  it('uses Mifflin-St Jeor with activity and goal adjustment', () => {
    const p = profile('a', { goal: 'gain' })
    const b = bmr('male', 86, 181, 38)
    expect(b).toBeCloseTo(10 * 86 + 6.25 * 181 - 5 * 38 + 5)
    const t = calcTargets(p, NOW)!
    expect(t.source).toBe('calculated')
    expect(t.kcal).toBe(Math.round((b * 1.375 + 400) / 10) * 10)
  })

  it('applies a deficit for losing weight and lets the adjustment be edited', () => {
    const lose = calcTargets(
      profile('w', { sex: 'female', weightKg: 70, heightCm: 165, goal: 'lose' }),
      NOW,
    )!
    const custom = calcTargets(
      profile('w', { sex: 'female', weightKg: 70, heightCm: 165, goal: 'lose', adjustKcal: -300 }),
      NOW,
    )!
    expect(custom.kcal - lose.kcal).toBe(200)
  })

  it('lets a programme override win and labels it', () => {
    const t = calcTargets(profile('w', { overrideKcal: 1800, overrideProtein: 120 }), NOW)!
    expect(t.kcal).toBe(1800)
    expect(t.protein).toBe(120)
    expect(t.source).toBe('programme')
  })

  it('returns null without stats or an override', () => {
    expect(calcTargets(emptyProfile('x'), NOW)).toBeNull()
  })

  it('derives macros: protein 1.6 g/kg, fat 25 percent of calories', () => {
    const t = calcTargets(profile('a', { overrideKcal: 2000 }), NOW)!
    expect(t.protein).toBe(Math.round(1.6 * 86))
    expect(t.fat).toBe(Math.round((2000 * 0.25) / 9))
    expect(t.carbs).toBe(Math.round((2000 - t.protein * 4 - t.fat * 9) / 4))
  })

  it('flags targets under 1,200 kcal without blocking', () => {
    const t = calcTargets(profile('w', { overrideKcal: 1100 }), NOW)
    expect(lowTargetNote(t)).toMatch(/1,200/)
    expect(lowTargetNote(calcTargets(profile('w', { overrideKcal: 1500 }), NOW))).toBeNull()
  })
})

describe('mealTargets', () => {
  it('splits by share among enabled slots only', () => {
    const t = calcTargets(profile('a', { overrideKcal: 2000 }), NOW)!
    const m = mealTargets(t, { breakfast: 25, lunch: 35, dinner: 40, snack: 10 }, [
      'breakfast',
      'lunch',
      'dinner',
    ])
    expect(m.breakfast.kcal).toBe(500)
    expect(m.lunch.kcal).toBe(700)
    expect(m.dinner.kcal).toBe(800)
    expect(m.snack.kcal).toBe(0)
  })
})
