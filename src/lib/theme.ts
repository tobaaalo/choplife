import { useSyncExternalStore } from 'react'

export type Theme = 'auto' | 'light' | 'dark'
const KEY = 'cl_theme'
const listeners = new Set<() => void>()

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : 'auto'
  } catch {
    return 'auto'
  }
}

function paint(theme: Theme) {
  const root = document.documentElement
  if (theme === 'auto') delete root.dataset.theme
  else root.dataset.theme = theme
  const dark =
    theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document
    .querySelector('meta[name=theme-color]')
    ?.setAttribute('content', dark ? '#1e1913' : '#f4ecdb')
}

export function setTheme(theme: Theme) {
  try {
    if (theme === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    /* storage can be blocked; the choice then lasts until reload */
  }
  paint(theme)
  listeners.forEach((l) => l())
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getTheme,
    () => 'auto',
  )
}
