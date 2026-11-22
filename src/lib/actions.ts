import type { Feedback, MealLog, PlanEntry, Recipe, Slot } from '../../shared/types'
import { eaters, planWeek } from '../../shared/logic/engine'
import type { RankCtx } from '../../shared/logic/engine'
import { portionFor } from '../../shared/logic/portions'
import { addDays } from '../../shared/logic/dates'
import { uid } from './ids'
import { commit, toast } from './store'
import type { Op } from './store'

export function planMeal(
  date: string,
  slot: Slot,
  recipeId: string,
  extra: Partial<PlanEntry> = {},
): PlanEntry {
  const entry: PlanEntry = {
    id: uid(),
    date,
    slot,
    recipeId,
    locked: false,
    leftover: false,
    ...extra,
  }
  commit([{ op: 'put', entity: 'plan', id: entry.id, body: entry }])
  return entry
}

export function removePlanned(ctx: RankCtx, entry: PlanEntry): void {
  commit([{ op: 'delete', entity: 'plan', id: entry.id }])
  toast('Meal removed', {
    undo: () => commit([{ op: 'put', entity: 'plan', id: entry.id, body: entry }]),
  })
  void ctx
}

export function toggleLock(entry: PlanEntry): void {
  const next = { ...entry, locked: !entry.locked }
  commit([{ op: 'put', entity: 'plan', id: entry.id, body: next }])
}

const logId = (entryKey: string, userId: string) => `${entryKey}:${userId}`

/** Logs a portion for everyone who has a target. Safe to repeat: ids are stable. */
export function markEaten(ctx: RankCtx, date: string, slot: Slot, recipe: Recipe): void {
  const logs: MealLog[] = eaters(ctx).map((p) => {
    const portion = portionFor(p.meals![slot], {
      kcal: recipe.kcal ?? 0,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
    })
    return {
      id: logId(`${date}:${slot}`, p.userId),
      userId: p.userId,
      date,
      slot,
      recipeId: recipe.id,
      status: 'eaten',
      name: recipe.name,
      kcal: portion.kcal,
      protein: portion.protein,
      carbs: portion.carbs,
      fat: portion.fat,
      mult: portion.mult,
    }
  })
  commit(logs.map((l) => ({ op: 'put' as const, entity: 'logs' as const, id: l.id, body: l })))
  toast(`${recipe.name} marked as eaten`, {
    undo: () =>
      commit(logs.map((l) => ({ op: 'delete' as const, entity: 'logs' as const, id: l.id }))),
  })
}

export function markSkipped(ctx: RankCtx, date: string, slot: Slot): void {
  const logs: MealLog[] = ctx.people.map((p) => ({
    id: logId(`${date}:${slot}`, p.userId),
    userId: p.userId,
    date,
    slot,
    recipeId: null,
    status: 'skipped',
    name: '',
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mult: 0,
  }))
  commit(logs.map((l) => ({ op: 'put' as const, entity: 'logs' as const, id: l.id, body: l })))
  toast('Meal skipped', {
    undo: () =>
      commit(logs.map((l) => ({ op: 'delete' as const, entity: 'logs' as const, id: l.id }))),
  })
}

export function undoLogs(ctx: RankCtx, date: string, slot: Slot): void {
  const old = ctx.logs.filter((l) => l.date === date && l.slot === slot)
  commit(old.map((l) => ({ op: 'delete' as const, entity: 'logs' as const, id: l.id })))
  toast('Marked as not eaten', {
    undo: () =>
      commit(old.map((l) => ({ op: 'put' as const, entity: 'logs' as const, id: l.id, body: l }))),
  })
}

export function setFeedback(ctx: RankCtx, recipeId: string, patch: Partial<Feedback>): void {
  const cur = ctx.feedback.find((f) => f.recipeId === recipeId) ?? {
    recipeId,
    loved: false,
    hiddenUntil: null,
  }
  commit([{ op: 'put', entity: 'feedback', id: recipeId, body: { ...cur, ...patch, recipeId } }])
}

export function hideForTwoWeeks(ctx: RankCtx, recipe: Recipe): void {
  const prev = ctx.feedback.find((f) => f.recipeId === recipe.id)
  setFeedback(ctx, recipe.id, { hiddenUntil: addDays(ctx.today, 14) })
  toast(`${recipe.name} hidden for 14 days`, {
    undo: () =>
      commit([
        prev
          ? { op: 'put', entity: 'feedback', id: recipe.id, body: prev }
          : { op: 'delete', entity: 'feedback', id: recipe.id },
      ]),
  })
}

export function autoPlan(
  ctx: RankCtx,
  dates: string[],
  slots: Slot[],
  replaceUnlocked: boolean,
): { added: number; reason: string | null } {
  const protectedKeys = new Set(ctx.logs.map((l) => `${l.date}|${l.slot}`))
  const res = planWeek(ctx, {
    dates,
    slots,
    seed: Date.now() % 2_147_483_647,
    replaceUnlocked,
    protectedKeys,
  })
  const ops: Op[] = [
    ...res.removedIds.map((id) => ({ op: 'delete' as const, entity: 'plan' as const, id })),
    ...res.added.map((e) => ({ op: 'put' as const, entity: 'plan' as const, id: e.id, body: e })),
  ]
  const before = ctx.plan.filter((e) => res.removedIds.includes(e.id))
  commit(ops)
  if (res.added.length > 0) {
    toast(`Planned ${res.added.length} meal${res.added.length === 1 ? '' : 's'}`, {
      undo: () =>
        commit([
          ...res.added.map((e) => ({ op: 'delete' as const, entity: 'plan' as const, id: e.id })),
          ...before.map((e) => ({
            op: 'put' as const,
            entity: 'plan' as const,
            id: e.id,
            body: e,
          })),
        ]),
    })
    return { added: res.added.length, reason: null }
  }
  const full = dates.every((d) =>
    slots.every((s) => ctx.plan.some((e) => e.date === d && e.slot === s)),
  )
  return {
    added: 0,
    reason: full
      ? 'Everything is already planned. Use Reshuffle to change meals that are not locked.'
      : 'Not enough dishes with calories to fill the gaps. Add calories to more dishes.',
  }
}

function portionLog(
  ctx: RankCtx,
  date: string,
  slot: Slot,
  recipe: Recipe,
  userId: string,
): MealLog | null {
  const p = eaters(ctx).find((x) => x.userId === userId)
  if (!p) return null
  const portion = portionFor(p.meals![slot], {
    kcal: recipe.kcal ?? 0,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
  })
  return {
    id: logId(`${date}:${slot}`, userId),
    userId,
    date,
    slot,
    recipeId: recipe.id,
    status: 'eaten',
    name: recipe.name,
    kcal: portion.kcal,
    protein: portion.protein,
    carbs: portion.carbs,
    fat: portion.fat,
    mult: portion.mult,
  }
}

/** One person ticks or unticks that they ate the planned meal. */
export function toggleEaten(
  ctx: RankCtx,
  date: string,
  slot: Slot,
  recipe: Recipe,
  userId: string,
): void {
  const existing = ctx.logs.find((l) => l.date === date && l.slot === slot && l.userId === userId)
  if (existing) {
    commit([{ op: 'delete', entity: 'logs', id: existing.id }])
    return
  }
  const log = portionLog(ctx, date, slot, recipe, userId)
  if (log) commit([{ op: 'put', entity: 'logs', id: log.id, body: log }])
}

/** Everyone who has not yet ticked gets ticked. */
export function markAllEaten(ctx: RankCtx, date: string, slot: Slot, recipe: Recipe): void {
  const done = new Set(
    ctx.logs.filter((l) => l.date === date && l.slot === slot).map((l) => l.userId),
  )
  const logs = eaters(ctx)
    .filter((p) => !done.has(p.userId))
    .map((p) => portionLog(ctx, date, slot, recipe, p.userId))
    .filter((l): l is MealLog => l !== null)
  commit(logs.map((l) => ({ op: 'put' as const, entity: 'logs' as const, id: l.id, body: l })))
  toast(`Lovely! ${recipe.name} is ticked off`, {
    undo: () =>
      commit(logs.map((l) => ({ op: 'delete' as const, entity: 'logs' as const, id: l.id }))),
  })
}

/** Logs something that was not on the plan. */
export function logSomethingElse(
  ctx: RankCtx,
  date: string,
  slot: Slot,
  name: string,
  kcal: number,
  userIds: string[],
): void {
  const logs: MealLog[] = userIds.map((userId) => ({
    id: logId(`${date}:${slot}`, userId),
    userId,
    date,
    slot,
    recipeId: null,
    status: 'eaten',
    name,
    kcal,
    protein: 0,
    carbs: 0,
    fat: 0,
    mult: 1,
  }))
  commit(logs.map((l) => ({ op: 'put' as const, entity: 'logs' as const, id: l.id, body: l })))
  toast(`Saved: ${name}`, {
    undo: () =>
      commit(logs.map((l) => ({ op: 'delete' as const, entity: 'logs' as const, id: l.id }))),
  })
  void ctx
}
