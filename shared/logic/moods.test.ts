import { describe, expect, it } from 'vitest'
import { moodMatches, parseHint } from './moods'
import { recipe } from '../testkit'

describe('parseHint', () => {
  it('maps words to moods and keeps other keywords', () => {
    const h = parseHint('something with plantain, not too heavy')
    expect(h.moods).toContain('light')
    expect(h.moods).not.toContain('hearty')
    expect(h.include).toContain('plantain')
  })

  it('captures exclusions', () => {
    const h = parseHint('spicy but no fish and without beans')
    expect(h.moods).toContain('spicy')
    expect(h.exclude.sort()).toEqual(['beans', 'fish'])
  })

  it('understands quick and hearty', () => {
    expect(parseHint('in a hurry').moods).toContain('quick')
    expect(parseHint('really hungry, something filling').moods).toContain('hearty')
  })

  it('returns nothing for an empty hint', () => {
    expect(parseHint('  ')).toEqual({ moods: [], include: [], exclude: [] })
  })
})

describe('moodMatches', () => {
  const facts = { pantryRatio: 0.8, daysSince: 30 }
  it('checks heat, tags, time, calories, novelty and pantry', () => {
    expect(moodMatches('spicy', recipe({ name: 'a', heat: 'hot' }), facts)).toBe(true)
    expect(moodMatches('spicy', recipe({ name: 'a', heat: 'mild' }), facts)).toBe(false)
    expect(moodMatches('swallow', recipe({ name: 'a', tags: ['soup'] }), facts)).toBe(true)
    expect(moodMatches('quick', recipe({ name: 'a', cookMinutes: 25 }), facts)).toBe(true)
    expect(moodMatches('quick', recipe({ name: 'a', cookMinutes: null }), facts)).toBe(false)
    expect(moodMatches('light', recipe({ name: 'a', kcal: 400 }), facts)).toBe(true)
    expect(moodMatches('hearty', recipe({ name: 'a', kcal: 800 }), facts)).toBe(true)
    expect(moodMatches('new', recipe({ name: 'a' }), facts)).toBe(true)
    expect(moodMatches('new', recipe({ name: 'a' }), { ...facts, daysSince: 3 })).toBe(false)
    expect(moodMatches('pantry', recipe({ name: 'a' }), facts)).toBe(true)
  })
})
