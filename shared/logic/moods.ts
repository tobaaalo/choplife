import type { Recipe } from '../types'
import { recipeHaystack, termMatches } from './rules'

export type MoodId =
  | 'spicy'
  | 'swallow'
  | 'rice'
  | 'beans'
  | 'yamplantain'
  | 'pasta'
  | 'quick'
  | 'light'
  | 'hearty'
  | 'new'
  | 'pantry'

export interface MoodDef {
  id: MoodId
  label: string
}

export const MOODS: MoodDef[] = [
  { id: 'spicy', label: 'Spicy' },
  { id: 'swallow', label: 'Swallow and soup' },
  { id: 'rice', label: 'Rice' },
  { id: 'beans', label: 'Beans' },
  { id: 'yamplantain', label: 'Yam or plantain' },
  { id: 'pasta', label: 'Pasta or noodles' },
  { id: 'quick', label: 'Quick (under 30 min)' },
  { id: 'light', label: 'Light' },
  { id: 'hearty', label: 'Hearty' },
  { id: 'new', label: 'Something new' },
  { id: 'pantry', label: 'Use what I have' },
]

export interface MoodFacts {
  pantryRatio: number | null
  /** days since this dish was last planned or eaten, Infinity if never */
  daysSince: number
}

export function moodMatches(id: MoodId, r: Recipe, f: MoodFacts): boolean {
  const has = (tag: string) => r.tags.includes(tag)
  switch (id) {
    case 'spicy':
      return r.heat === 'medium' || r.heat === 'hot'
    case 'swallow':
      return has('swallow') || has('soup')
    case 'rice':
      return has('rice')
    case 'beans':
      return has('beans')
    case 'yamplantain':
      return has('yam') || has('plantain')
    case 'pasta':
      return has('pasta') || has('noodles')
    case 'quick':
      return r.cookMinutes != null && r.cookMinutes <= 30
    case 'light':
      return r.kcal != null && r.kcal <= 450
    case 'hearty':
      return r.kcal != null && r.kcal >= 650
    case 'new':
      return f.daysSince >= 21
    case 'pantry':
      return f.pantryRatio != null && f.pantryRatio >= 0.6
  }
}

export interface ParsedHint {
  moods: MoodId[]
  include: string[]
  exclude: string[]
}

const STOP = new Set(
  `i a an the with and or something feel feeling like want some for of to my me in on have having eat meal today tonight really kind little bit very too not no is it that this just please maybe anything dish food`.split(
    ' ',
  ),
)

const MOOD_WORDS: [MoodId, RegExp][] = [
  ['spicy', /^(spic(y|e)|pepper(y|ed)?|hot|fiery)$/],
  ['quick', /^(quick|fast|easy|hurry|rushed)$/],
  ['light', /^(light|small|lighter)$/],
  ['hearty', /^(hearty|filling|heavy|big)$/],
  ['swallow', /^(swallow|soup|soups)$/],
  ['rice', /^rice$/],
  ['beans', /^(beans?|ewa)$/],
  ['yamplantain', /^(yam|plantain|dodo)$/],
  ['pasta', /^(pasta|spaghetti|noodles?|macaroni)$/],
  ['new', /^(new|different)$/],
]

/** Turns a typed hint such as "something with plantain, not too heavy, no fish" into filters. */
export function parseHint(text: string): ParsedHint {
  const lower = text.toLowerCase()
  const exclude: string[] = []
  let rest = lower
  const notTooHeavy = /not too (heavy|filling|big)/.test(rest)
  rest = rest.replace(/not too (heavy|filling|big)/g, ' light ')
  const neg = /\b(?:no|without|except|avoid|not)\s+(?!too\b)([a-z]+)/g
  let m: RegExpExecArray | null
  while ((m = neg.exec(rest))) exclude.push(m[1])
  rest = rest.replace(neg, ' ')
  const moods = new Set<MoodId>()
  const include: string[] = []
  for (const tok of rest.split(/[^a-z]+/).filter(Boolean)) {
    let mapped = false
    for (const [id, re] of MOOD_WORDS) {
      if (re.test(tok)) {
        moods.add(id)
        mapped = true
      }
    }
    if (!STOP.has(tok) && tok.length > 2 && (!mapped || tok === 'plantain' || tok === 'yam')) {
      include.push(tok)
    }
  }
  if (notTooHeavy) moods.delete('hearty')
  return { moods: [...moods], include, exclude }
}

export function hintTermHit(r: Recipe, term: string): boolean {
  return termMatches(recipeHaystack(r), term)
}
