import type { Feedback, MealLog, PlanEntry, Profile, Recipe, Slot } from '../types'
import { SLOTS } from '../types'
import { addDays, daysBetween } from './dates'
import { hintTermHit, moodMatches, parseHint } from './moods'
import type { MoodId } from './moods'
import type { MealTarget, Targets } from './nutrition'
import { mealTargets } from './nutrition'
import { pantryMatch } from './pantry'
import type { PantryMatch } from './pantry'
import { portionFor } from './portions'
import type { Portion } from './portions'
import { rng } from './random'
import { violations } from './rules'

export interface Person {
  userId: string
  name: string
  profile: Profile
  targets: Targets | null
  meals: Record<Slot, MealTarget> | null
}

export interface RankCtx {
  recipes: Recipe[]
  /** everyone in the household, for allergy and dislike rules */
  people: Person[]
  pantry: string[]
  feedback: Feedback[]
  plan: PlanEntry[]
  logs: MealLog[]
  today: string
}

export function buildPeople(
  members: { id: string; name: string; profile: Profile }[],
  calc: (p: Profile) => Targets | null,
  enabled: Slot[],
): Person[] {
  return members.map((m) => {
    const targets = calc(m.profile)
    return {
      userId: m.id,
      name: m.name,
      profile: m.profile,
      targets,
      meals: targets ? mealTargets(targets, m.profile.shares, enabled) : null,
    }
  })
}

export interface Rec {
  recipe: Recipe
  portions: { userId: string; name: string; portion: Portion }[]
  score: number
  reasons: string[]
  exact: boolean
  pantry: PantryMatch
}

export interface RecInput {
  slot: Slot
  date: string
  moods?: MoodId[]
  hint?: string
  /** ignore plan entries and logs on this date and slot when judging repeats */
  replacing?: { date: string; slot: Slot }
  minGapDays?: number
  jitter?: { rand: () => number; amount: number }
  extraExcludeIds?: Set<string>
  neighbourTags?: string[]
}

const MAIN_TAGS = [
  'rice',
  'beans',
  'yam',
  'plantain',
  'pasta',
  'noodles',
  'swallow',
  'bread',
  'egg',
  'potato',
]

/** Days between the date and the nearest time each dish was planned or eaten. */
export function distances(ctx: RankCtx, date: string, replacing?: { date: string; slot: Slot }) {
  const out = new Map<string, number>()
  const touch = (id: string | null, d: string) => {
    if (!id) return
    const gap = Math.abs(daysBetween(d, date))
    const cur = out.get(id)
    if (cur == null || gap < cur) out.set(id, gap)
  }
  for (const e of ctx.plan) {
    if (e.leftover) continue
    if (replacing && e.date === replacing.date && e.slot === replacing.slot) continue
    touch(e.recipeId, e.date)
  }
  for (const l of ctx.logs) {
    if (l.status !== 'eaten') continue
    if (replacing && l.date === replacing.date && l.slot === replacing.slot) continue
    touch(l.recipeId, l.date)
  }
  return out
}

export function isHidden(fb: Feedback | undefined, today: string): boolean {
  return !!fb?.hiddenUntil && fb.hiddenUntil >= today
}

/** Who gets a portion: everyone who has a calorie target. */
export function eaters(ctx: RankCtx): Person[] {
  return ctx.people.filter((p) => p.meals && p.targets)
}

export function evaluate(
  r: Recipe,
  ctx: RankCtx,
  input: RecInput,
  dist: Map<string, number>,
): Rec | null {
  if (!r.kcal || r.kcal <= 0) return null
  if (!r.mealTypes.includes(input.slot)) return null
  if (input.extraExcludeIds?.has(r.id)) return null
  const fb = ctx.feedback.find((f) => f.recipeId === r.id)
  if (isHidden(fb, ctx.today)) return null
  for (const p of ctx.people) if (violations(r, p.profile).length) return null

  const parsed = parseHint(input.hint ?? '')
  const hay = [r.name, ...r.tags, ...r.ingredients.map((i) => i.name)].join(' ').toLowerCase()
  const noHeat = parsed.exclude.some((x) => /^(spic(y|e)|pepper(y)?|hot|fiery)$/.test(x))
  if (noHeat && (r.heat === 'hot' || r.heat === 'medium')) return null
  for (const ex of parsed.exclude) {
    if (hintTermHit(r, ex) || hay.includes(ex)) return null
  }

  const gap = dist.get(r.id) ?? Infinity
  if (input.minGapDays != null && gap < input.minGapDays) return null

  const who = eaters(ctx)
  const portions = who.map((p) => ({
    userId: p.userId,
    name: p.name,
    portion: portionFor(p.meals![input.slot], {
      kcal: r.kcal!,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
    }),
  }))
  const fit = portions.length
    ? portions.reduce((s, x) => s + (1 - Math.min(1, Math.abs(1 - x.portion.reach))), 0) /
      portions.length
    : 1

  const pm = pantryMatch(r, ctx.pantry)
  const facts = { pantryRatio: pm.ratio, daysSince: gap }
  const moods = new Set<MoodId>([...(input.moods ?? []), ...parsed.moods])
  const matched: MoodId[] = []
  for (const m of moods) if (moodMatches(m, r, facts)) matched.push(m)
  const includeHits = parsed.include.filter((t) => hintTermHit(r, t))
  const wants = moods.size + parsed.include.length
  const got = matched.length + includeHits.length
  const moodMatch = wants === 0 ? 1 : got / wants

  const recency = gap === Infinity ? 10 : (Math.min(gap, 14) / 14) * 10
  const loved = fb?.loved ? 8 : 0
  let score = fit * 30 + moodMatch * 50 + (pm.ratio ?? 0) * 10 + recency + loved
  if (input.neighbourTags?.some((t) => r.tags.includes(t) && MAIN_TAGS.includes(t))) score -= 20
  if (input.jitter) score += input.jitter.rand() * input.jitter.amount

  const reasons: string[] = []
  if (r.heat === 'hot') reasons.push('Spicy')
  else if (r.heat === 'medium') reasons.push('Medium heat')
  if (r.cookMinutes != null) reasons.push(`${r.cookMinutes} min`)
  if (pm.ratio != null && pm.have.length > 0) {
    reasons.push(`${pm.have.length} of ${r.ingredients.length} ingredients at home`)
  }
  if (gap === Infinity || gap >= 21) reasons.push('Not had for a while')
  if (fb?.loved) reasons.push('You loved it')
  if (portions.length > 1 && portions.every((x) => x.portion.status === 'ok')) {
    reasons.push('Fits both of you')
  } else if (portions.length === 1 && portions[0].portion.status === 'ok') {
    reasons.push('Fits your target')
  }
  return { recipe: r, portions, score, reasons, exact: moodMatch === 1, pantry: pm }
}

/** Ranked meals for a slot. Exact mood matches come first, then the closest others. */
export function recommend(ctx: RankCtx, input: RecInput, limit = 40): Rec[] {
  const dist = distances(ctx, input.date, input.replacing)
  const all: Rec[] = []
  for (const r of ctx.recipes) {
    const rec = evaluate(r, ctx, input, dist)
    if (rec) all.push(rec)
  }
  all.sort((a, b) => b.score - a.score)
  const wantsSomething = (input.moods?.length ?? 0) > 0 || (input.hint ?? '').trim() !== ''
  if (!wantsSomething) return all.slice(0, limit)
  const exact = all.filter((x) => x.exact)
  const near = all.filter((x) => !x.exact)
  return [...exact, ...near].slice(0, limit)
}

export function entryServings(ctx: RankCtx, entry: PlanEntry, recipe: Recipe): number {
  if (!recipe.kcal) return 0
  return eaters(ctx).reduce(
    (s, p) =>
      s +
      portionFor(p.meals![entry.slot], {
        kcal: recipe.kcal!,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
      }).mult,
    0,
  )
}

export function newId(): string {
  return crypto.randomUUID()
}

export interface PlanInput {
  dates: string[]
  slots: Slot[]
  seed: number
  /** replace meals that are not locked and not protected */
  replaceUnlocked?: boolean
  /** "date|slot" keys that must not change, for example meals already eaten */
  protectedKeys?: Set<string>
}

export interface PlanResult {
  /** the full set of entries for the given dates after planning */
  entries: PlanEntry[]
  removedIds: string[]
  added: PlanEntry[]
}

/** Fills the week. Deterministic for a given seed. */
export function planWeek(ctx: RankCtx, input: PlanInput): PlanResult {
  const rand = rng(input.seed)
  const dateSet = new Set(input.dates)
  const prot = input.protectedKeys ?? new Set<string>()
  const removedIds: string[] = []
  let working = ctx.plan.filter((e) => {
    if (!dateSet.has(e.date)) return true
    if (input.replaceUnlocked && !e.locked && !prot.has(`${e.date}|${e.slot}`)) {
      removedIds.push(e.id)
      return false
    }
    return true
  })
  const added: PlanEntry[] = []
  const byId = new Map(ctx.recipes.map((r) => [r.id, r]))
  const sorted = [...input.dates].sort()
  for (const date of sorted) {
    for (const slot of SLOTS) {
      if (!input.slots.includes(slot)) continue
      if (working.some((e) => e.date === date && e.slot === slot)) continue
      const local: RankCtx = { ...ctx, plan: working }
      const prevSlotEntry = prevEntry(working, date, slot, input.slots, byId)
      const neighbourTags = prevSlotEntry?.tags ?? []
      let pick: Rec | undefined
      for (const gapDays of [4, 2, 1, 0]) {
        const dist = distances(local, date)
        const cands: Rec[] = []
        for (const r of ctx.recipes) {
          const rec = evaluate(
            r,
            local,
            { slot, date, minGapDays: gapDays, neighbourTags, jitter: { rand, amount: 12 } },
            dist,
          )
          if (rec) cands.push(rec)
        }
        cands.sort((a, b) => b.score - a.score)
        if (cands.length) {
          pick = cands[0]
          break
        }
      }
      if (!pick) continue
      const entry: PlanEntry = {
        id: newId(),
        date,
        slot,
        recipeId: pick.recipe.id,
        locked: false,
        leftover: false,
      }
      working = [...working, entry]
      added.push(entry)
      if (pick.recipe.makesExtra && slot === 'dinner') {
        const next = addDays(date, 1)
        if (
          dateSet.has(next) &&
          input.slots.includes('lunch') &&
          pick.recipe.mealTypes.includes('lunch') &&
          !working.some((e) => e.date === next && e.slot === 'lunch')
        ) {
          const left: PlanEntry = {
            id: newId(),
            date: next,
            slot: 'lunch',
            recipeId: pick.recipe.id,
            locked: false,
            leftover: true,
          }
          working = [...working, left]
          added.push(left)
        }
      }
    }
  }
  return { entries: working, removedIds, added }
}

function prevEntry(
  plan: PlanEntry[],
  date: string,
  slot: Slot,
  slots: Slot[],
  byId: Map<string, Recipe>,
): Recipe | undefined {
  const order = SLOTS.filter((s) => slots.includes(s))
  const i = order.indexOf(slot)
  if (i > 0) {
    const e = plan.find((x) => x.date === date && x.slot === order[i - 1])
    return e ? byId.get(e.recipeId) : undefined
  }
  const prevDay = addDays(date, -1)
  const last = order[order.length - 1]
  const e = plan.find((x) => x.date === prevDay && x.slot === last)
  return e ? byId.get(e.recipeId) : undefined
}

export interface DayTotal {
  userId: string
  planned: number
  target: number
  status: 'ok' | 'under' | 'over'
}

/** Planned calories for each person on a date, compared with their target. */
export function dayTotals(ctx: RankCtx, date: string): DayTotal[] {
  const byId = new Map(ctx.recipes.map((r) => [r.id, r]))
  return eaters(ctx).map((p) => {
    let planned = 0
    for (const e of ctx.plan.filter((x) => x.date === date)) {
      const r = byId.get(e.recipeId)
      if (!r?.kcal) continue
      planned += portionFor(p.meals![e.slot], {
        kcal: r.kcal,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
      }).kcal
    }
    const target = p.targets!.kcal
    const ratio = planned / target
    return {
      userId: p.userId,
      planned,
      target,
      status: planned === 0 ? 'under' : ratio < 0.9 ? 'under' : ratio > 1.1 ? 'over' : 'ok',
    }
  })
}
