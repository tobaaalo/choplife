import { useMemo } from 'react'
import type { AppState, Slot } from '../../shared/types'
import { SLOTS } from '../../shared/types'
import { buildPeople } from '../../shared/logic/engine'
import type { RankCtx } from '../../shared/logic/engine'
import { calcTargets } from '../../shared/logic/nutrition'
import { todayISO } from '../../shared/logic/dates'

export function enabledSlots(s: AppState): Slot[] {
  return SLOTS.filter((slot) => s.household.settings.meals[slot].on)
}

export function buildCtx(s: AppState, today: string = todayISO()): RankCtx {
  return {
    recipes: s.recipes,
    people: buildPeople(s.members, (p) => calcTargets(p), enabledSlots(s)),
    pantry: s.pantry.map((p) => p.name),
    feedback: s.feedback,
    plan: s.plan,
    logs: s.logs,
    today,
  }
}

export function useCtx(s: AppState): RankCtx {
  const today = todayISO()
  return useMemo(() => buildCtx(s, today), [s, today])
}

/** True when someone has an allergy but the dish has no ingredient list, so only its name was checked. */
export function allergyUnverified(
  recipe: { ingredients: unknown[] },
  members: { profile: { allergies: string[] } }[],
): boolean {
  return recipe.ingredients.length === 0 && members.some((m) => m.profile.allergies.length > 0)
}
