import { PART_1 } from './part1'
import { PART_2 } from './part2'
import { PART_3 } from './part3'
import { PART_4 } from './part4'
import type { StarterRecipe } from './types'

export const STARTER_RECIPES: Record<string, StarterRecipe> = {
  ...PART_1,
  ...PART_2,
  ...PART_3,
  ...PART_4,
}
