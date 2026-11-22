import type { Profile, Recipe } from '../types'

export interface RuleOption {
  key: string
  label: string
  terms: string[]
}

/** Terms are matched as whole words (plural-tolerant) against the dish name, tags and ingredients. */
export const ALLERGY_OPTIONS: RuleOption[] = [
  { key: 'peanut', label: 'Peanuts / groundnuts', terms: ['peanut', 'groundnut', 'kuli kuli'] },
  {
    key: 'treenut',
    label: 'Tree nuts',
    terms: ['almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'brazil nut'],
  },
  {
    key: 'dairy',
    label: 'Milk / dairy',
    terms: [
      'milk',
      'cheese',
      'butter',
      'yoghurt',
      'yogurt',
      'cream',
      'custard',
      'ghee',
      'evaporated',
    ],
  },
  { key: 'egg', label: 'Eggs', terms: ['egg', 'omelette', 'mayonnaise'] },
  {
    key: 'gluten',
    label: 'Gluten / wheat',
    terms: [
      'bread',
      'toast',
      'pasta',
      'spaghetti',
      'noodle',
      'macaroni',
      'penne',
      'flour',
      'wheat',
      'semolina',
      'cereal',
      'oat',
      'bulgur',
      'barley',
      'pancake',
      'tortilla',
      'wrap',
      'sharwarma',
      'couscous',
      'cornflake',
    ],
  },
  {
    key: 'fish',
    label: 'Fish',
    terms: [
      'fish',
      'mackerel',
      'titus',
      'croaker',
      'catfish',
      'tilapia',
      'salmon',
      'tuna',
      'cod',
      'panla',
      'stockfish',
      'sardine',
    ],
  },
  {
    key: 'shellfish',
    label: 'Shellfish (incl. crayfish)',
    terms: [
      'crayfish',
      'prawn',
      'shrimp',
      'crab',
      'lobster',
      'snail',
      'periwinkle',
      'oyster',
      'mussel',
    ],
  },
  { key: 'soy', label: 'Soy', terms: ['soy', 'soya', 'tofu', 'edamame'] },
  { key: 'sesame', label: 'Sesame', terms: ['sesame', 'tahini', 'benne'] },
]

export const WONT_EAT_OPTIONS: RuleOption[] = [
  { key: 'okra', label: 'Okra', terms: ['okra', 'okro'] },
  {
    key: 'beans',
    label: 'Beans',
    terms: ['bean', 'agoyin', 'ewa', 'moi moi', 'moimoi', 'akara'],
  },
  { key: 'egusi', label: 'Egusi', terms: ['egusi'] },
  { key: 'ogbono', label: 'Ogbono', terms: ['ogbono'] },
  { key: 'plantain', label: 'Plantain', terms: ['plantain', 'dodo', 'boli', 'gizdodo'] },
  { key: 'yam', label: 'Yam', terms: ['yam', 'poundo', 'yamaritta', 'asaro'] },
  { key: 'goat', label: 'Goat meat', terms: ['goat'] },
  { key: 'mushroom', label: 'Mushrooms', terms: ['mushroom'] },
  { key: 'bacon', label: 'Bacon', terms: ['bacon'] },
  { key: 'peas', label: 'Peas', terms: ['pea'] },
  {
    key: 'fish',
    label: 'Fish',
    terms: ALLERGY_OPTIONS.find((o) => o.key === 'fish')?.terms ?? ['fish'],
  },
  { key: 'pork', label: 'Pork', terms: ['pork', 'bacon', 'ham', 'sausage'] },
  { key: 'beef', label: 'Beef', terms: ['beef', 'suya', 'minced meat'] },
  { key: 'chicken', label: 'Chicken', terms: ['chicken'] },
]

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function termMatches(haystack: string, term: string): boolean {
  const t = term.trim().toLowerCase()
  if (!t) return false
  const stems = new Set([t])
  if (t.length > 3 && t.endsWith('es')) stems.add(t.slice(0, -2))
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) stems.add(t.slice(0, -1))
  const alt = [...stems].map(escapeRe).join('|')
  return new RegExp(`\\b(?:${alt})(s|es)?\\b`).test(haystack)
}

export function recipeHaystack(r: Pick<Recipe, 'name' | 'tags' | 'ingredients'>): string {
  return [r.name, ...r.tags, ...r.ingredients.map((i) => i.name)].join(' | ').toLowerCase()
}

function termsFor(key: string, options: RuleOption[]): string[] {
  const preset = options.find((o) => o.key === key)
  return preset ? preset.terms : [key]
}

/** Returns the reasons a recipe breaks a person's rules. Empty when it is fine for them. */
export function violations(
  r: Pick<Recipe, 'name' | 'tags' | 'ingredients'>,
  profile: Pick<Profile, 'allergies' | 'wontEat'>,
): string[] {
  const hay = recipeHaystack(r)
  const out: string[] = []
  for (const key of profile.allergies) {
    if (termsFor(key, ALLERGY_OPTIONS).some((t) => termMatches(hay, t))) {
      const label = ALLERGY_OPTIONS.find((o) => o.key === key)?.label ?? key
      out.push(`Contains ${label.toLowerCase()}`)
    }
  }
  for (const key of profile.wontEat) {
    if (termsFor(key, WONT_EAT_OPTIONS).some((t) => termMatches(hay, t))) {
      const label = WONT_EAT_OPTIONS.find((o) => o.key === key)?.label ?? key
      out.push(`Has ${label.toLowerCase()}`)
    }
  }
  return out
}
