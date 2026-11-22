import type { ReactElement } from 'react'

const PATHS = {
  today: 'M4 5h16v14H4z M4 9h16 M8 3v4 M16 3v4 M9 14l2 2 4-4',
  week: 'M3 6h18 M3 12h18 M3 18h18 M7 3v18',
  recipes: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z M5 17a3 3 0 013-3h11 M9 8h6',
  kitchen: 'M6 9h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2z M5 9V6h14v3 M10 13v4 M14 13v4',
  list: 'M9 6h11 M9 12h11 M9 18h11 M4 6l1 1 2-2 M4 12l1 1 2-2 M4 18l1 1 2-2',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19 12l2-1-2-4-2 1a7 7 0 00-2-1l-1-2h-4l-1 2a7 7 0 00-2 1l-2-1-2 4 2 1v2l-2 1 2 4 2-1a7 7 0 002 1l1 2h4l1-2a7 7 0 002-1l2 1 2-4-2-1z',
  plus: 'M12 5v14 M5 12h14',
  x: 'M6 6l12 12 M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  swap: 'M4 8h14l-3-3 M20 16H6l3 3',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 018 0v3',
  unlock: 'M6 11h12v9H6z M8 11V8a4 4 0 017-2',
  dice: 'M5 5h14v14H5z M9 9h.01 M15 9h.01 M12 12h.01 M9 15h.01 M15 15h.01',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  trash: 'M5 7h14 M9 7V4h6v3 M7 7l1 13h8l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.500-7 10-7 10z',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 7v5l3 2',
  eyeoff: 'M4 4l16 16 M10 6a9 9 0 0110 6 9 9 0 01-3 3 M6 8a9 9 0 00-3 4 9 9 0 009 6',
  share: 'M12 4v12 M7 9l5-5 5 5 M5 14v6h14v-6',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8z M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.600 5.600l1.400 1.400 M17 17l1.400 1.400 M5.600 18.400L7 17 M17 7l1.400-1.400',
  moon: 'M20 14.500A8 8 0 019.500 4 8 8 0 1020 14.500z',
  cart: 'M4 5h2l2 11h10l2-8H7 M9 20h.01 M17 20h.01',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name }: { name: IconName }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
