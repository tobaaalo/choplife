import { describe, expect, it } from 'vitest'
import { clampMult, portionFor } from './portions'

const target = (kcal: number) => ({ kcal, protein: 30, carbs: 80, fat: 20 })
const r = (kcal: number) => ({ kcal, protein: 40, carbs: 100, fat: 20 })

describe('portionFor', () => {
  it('rounds to the nearest quarter', () => {
    expect(portionFor(target(1000), r(700)).mult).toBe(1.5)
    expect(portionFor(target(500), r(700)).mult).toBe(0.75)
  })

  it('clamps between 0.5x and 2.5x and reports the shortfall', () => {
    const p = portionFor(target(900), r(200))
    expect(p.mult).toBe(2.5)
    expect(p.status).toBe('under')
    expect(p.reach).toBeCloseTo(500 / 900)
    expect(portionFor(target(200), r(1000)).mult).toBe(0.5)
    expect(portionFor(target(200), r(1000)).status).toBe('over')
  })

  it('scales macros with the multiplier', () => {
    const p = portionFor(target(1400), r(700))
    expect(p.mult).toBe(2)
    expect(p.protein).toBe(80)
  })

  it('treats within 10 percent as ok', () => {
    expect(portionFor(target(700), r(700)).status).toBe('ok')
  })

  it('exposes the clamp helper', () => {
    expect(clampMult(0.1)).toBe(0.5)
    expect(clampMult(9)).toBe(2.5)
    expect(clampMult(1.13)).toBe(1.25)
  })
})
