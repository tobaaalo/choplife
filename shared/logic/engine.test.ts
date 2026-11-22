import { describe, expect, it } from 'vitest'
import { dayTotals, entryServings, planWeek, recommend } from './engine'
import { ctxFor, people, profile, recipe } from '../testkit'
import { weekDays } from './dates'

const toba = profile('toba', { goal: 'gain', overrideKcal: 3000 })
const wife = profile('wife', { sex: 'female', goal: 'lose', overrideKcal: 1600, weightKg: 70 })

function library() {
  const out = []
  const mains = ['rice', 'beans', 'yam', 'pasta', 'swallow', 'plantain', 'potato', 'noodles']
  for (let i = 0; i < 24; i++) {
    out.push(
      recipe({
        name: `Dish ${i}`,
        mealTypes:
          i % 3 === 0
            ? ['breakfast']
            : i % 3 === 1
              ? ['lunch', 'dinner']
              : ['lunch', 'dinner', 'breakfast'],
        kcal: 500 + (i % 5) * 80,
        tags: [mains[i % mains.length]],
        heat: i % 4 === 0 ? 'hot' : 'mild',
        cookMinutes: 20 + i,
      }),
    )
  }
  return out
}

describe('recommend', () => {
  const ppl = people(toba, wife)
  const ctx = ctxFor(
    [
      recipe({ name: 'Hot rice', tags: ['rice'], heat: 'hot' }),
      recipe({ name: 'Mild yam', tags: ['yam'], heat: 'mild' }),
      recipe({ name: 'No calories', kcal: null }),
      recipe({ name: 'Breakfast only', mealTypes: ['breakfast'] }),
    ],
    ppl,
  )

  it('skips dishes without calories or for another meal', () => {
    const names = recommend(ctx, { slot: 'dinner', date: '2026-11-22' }).map((r) => r.recipe.name)
    expect(names).toEqual(expect.arrayContaining(['Hot rice', 'Mild yam']))
    expect(names).not.toContain('No calories')
    expect(names).not.toContain('Breakfast only')
  })

  it('puts exact mood matches first and still offers near matches', () => {
    const recs = recommend(ctx, { slot: 'dinner', date: '2026-11-22', moods: ['spicy'] })
    expect(recs[0].recipe.name).toBe('Hot rice')
    expect(recs[0].exact).toBe(true)
    expect(recs[1].exact).toBe(false)
  })

  it('gives each person their own portion', () => {
    const rec = recommend(ctx, { slot: 'dinner', date: '2026-11-22' })[0]
    const t = rec.portions.find((p) => p.userId === 'toba')!.portion.mult
    const w = rec.portions.find((p) => p.userId === 'wife')!.portion.mult
    expect(t).toBeGreaterThan(w)
  })

  it('applies hints and exclusions', () => {
    const recs = recommend(ctx, { slot: 'dinner', date: '2026-11-22', hint: 'yam, no rice' })
    expect(recs.map((r) => r.recipe.name)).toEqual(['Mild yam'])
  })

  it('never recommends what breaks any member rules', () => {
    const allergic = people(toba, profile('wife', { allergies: ['dairy'], overrideKcal: 1600 }))
    const c = ctxFor([recipe({ name: 'Cheese pasta' }), recipe({ name: 'Plain rice' })], allergic)
    expect(recommend(c, { slot: 'dinner', date: '2026-11-22' }).map((r) => r.recipe.name)).toEqual([
      'Plain rice',
    ])
  })

  it('hides dishes marked Not this until the date passes', () => {
    const c = ctxFor([recipe({ name: 'A' }), recipe({ name: 'B' })], ppl, {
      feedback: [{ recipeId: 'a', loved: false, hiddenUntil: '2026-11-30' }],
    })
    expect(recommend(c, { slot: 'dinner', date: '2026-11-22' }).map((r) => r.recipe.name)).toEqual([
      'B',
    ])
    const later = { ...c, today: '2026-12-05' }
    expect(recommend(later, { slot: 'dinner', date: '2026-12-06' }).length).toBe(2)
  })

  it('ranks loved dishes higher', () => {
    const c = ctxFor([recipe({ name: 'A' }), recipe({ name: 'B' })], ppl, {
      feedback: [{ recipeId: 'b', loved: true, hiddenUntil: null }],
    })
    expect(recommend(c, { slot: 'dinner', date: '2026-11-22' })[0].recipe.name).toBe('B')
  })

  it('prefers dishes that use the pantry', () => {
    const c = ctxFor(
      [
        recipe({
          name: 'A',
          ingredients: [{ name: 'Rice', amount: 100, unit: 'g', aisle: 'grains' }],
        }),
        recipe({
          name: 'B',
          ingredients: [{ name: 'Yam', amount: 100, unit: 'g', aisle: 'tubers' }],
        }),
      ],
      ppl,
      { pantry: ['yam'] },
    )
    expect(recommend(c, { slot: 'dinner', date: '2026-11-22' })[0].recipe.name).toBe('B')
  })
})

describe('planWeek', () => {
  const ppl = people(toba, wife)
  const dates = weekDays('2026-11-23')
  const ctx = ctxFor(library(), ppl)

  it('fills every slot with eligible dishes for that meal', () => {
    const res = planWeek(ctx, { dates, slots: ['breakfast', 'lunch', 'dinner'], seed: 1 })
    expect(res.added.length).toBe(21)
    for (const e of res.added) {
      const r = ctx.recipes.find((x) => x.id === e.recipeId)!
      expect(r.mealTypes).toContain(e.slot)
    }
  })

  it('does not repeat a dish within 4 days when the library is big enough', () => {
    const res = planWeek(ctx, { dates, slots: ['breakfast', 'lunch', 'dinner'], seed: 7 })
    const byDish = new Map<string, string[]>()
    for (const e of res.added) byDish.set(e.recipeId, [...(byDish.get(e.recipeId) ?? []), e.date])
    for (const days of byDish.values()) {
      const s = [...days].sort()
      for (let i = 1; i < s.length; i++) {
        const gap = (Date.parse(s[i]) - Date.parse(s[i - 1])) / 86_400_000
        expect(gap).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('is deterministic for a seed and different for another', () => {
    const a = planWeek(ctx, { dates, slots: ['lunch', 'dinner'], seed: 3 }).added.map(
      (e) => e.recipeId,
    )
    const b = planWeek(ctx, { dates, slots: ['lunch', 'dinner'], seed: 3 }).added.map(
      (e) => e.recipeId,
    )
    const c = planWeek(ctx, { dates, slots: ['lunch', 'dinner'], seed: 99 }).added.map(
      (e) => e.recipeId,
    )
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
  })

  it('keeps existing and locked meals, and only replaces unlocked ones when asked', () => {
    const first = planWeek(ctx, { dates, slots: ['lunch', 'dinner'], seed: 1 })
    const locked = { ...first.entries[0], locked: true }
    const planned = [locked, ...first.entries.slice(1)]
    const again = planWeek(
      { ...ctx, plan: planned },
      { dates, slots: ['lunch', 'dinner'], seed: 5, replaceUnlocked: true },
    )
    expect(again.entries.find((e) => e.id === locked.id)).toBeTruthy()
    expect(again.removedIds).not.toContain(locked.id)
    expect(again.removedIds.length).toBe(planned.length - 1)
    const fill = planWeek({ ...ctx, plan: planned }, { dates, slots: ['lunch', 'dinner'], seed: 5 })
    expect(fill.added.length).toBe(0)
  })

  it('protects meals that were already eaten', () => {
    const first = planWeek(ctx, { dates, slots: ['lunch'], seed: 1 })
    const eaten = first.entries[0]
    const res = planWeek(
      { ...ctx, plan: first.entries },
      {
        dates,
        slots: ['lunch'],
        seed: 2,
        replaceUnlocked: true,
        protectedKeys: new Set([`${eaten.date}|${eaten.slot}`]),
      },
    )
    expect(res.removedIds).not.toContain(eaten.id)
  })

  it('never plans a dish that breaks a members rules', () => {
    const picky = people(toba, profile('wife', { allergies: ['gluten'], overrideKcal: 1600 }))
    const lib = [
      ...library()
        .map((r) => ({ ...r, name: r.name + ' with bread' }))
        .slice(0, 6),
      recipe({ name: 'Safe rice', mealTypes: ['lunch', 'dinner'] }),
    ]
    const res = planWeek(ctxFor(lib, picky), { dates, slots: ['lunch'], seed: 1 })
    for (const e of res.added) expect(e.recipeId).toBe('safe-rice')
  })

  it('creates a leftover lunch when a dinner makes extra', () => {
    const lib = [recipe({ name: 'Big pot', makesExtra: true, mealTypes: ['dinner', 'lunch'] })]
    const res = planWeek(ctxFor(lib, ppl), {
      dates: ['2026-11-23', '2026-11-24'],
      slots: ['lunch', 'dinner'],
      seed: 1,
    })
    expect(res.added.some((e) => e.leftover && e.date === '2026-11-24' && e.slot === 'lunch')).toBe(
      true,
    )
  })

  it('skips a slot rather than crash when nothing is eligible', () => {
    const res = planWeek(ctxFor([], ppl), { dates, slots: ['lunch'], seed: 1 })
    expect(res.added).toEqual([])
  })
})

describe('dayTotals and servings', () => {
  it('sums portions per person against their targets', () => {
    const ppl = people(toba, wife)
    const lib = library()
    const plan = [
      {
        id: '1',
        date: '2026-11-23',
        slot: 'lunch' as const,
        recipeId: lib[1].id,
        locked: false,
        leftover: false,
      },
    ]
    const ctx = ctxFor(lib, ppl, { plan })
    const totals = dayTotals(ctx, '2026-11-23')
    expect(totals.map((t) => t.userId)).toEqual(['toba', 'wife'])
    expect(totals[0].planned).toBeGreaterThan(totals[1].planned)
    expect(entryServings(ctx, plan[0], lib[1])).toBeGreaterThan(1)
  })
})
