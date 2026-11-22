import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  window.addEventListener('popstate', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('popstate', cb)
  }
}

const snapshot = () => window.location.pathname + window.location.search

export function useLocation(): { path: string; params: URLSearchParams } {
  const s = useSyncExternalStore(subscribe, snapshot)
  const i = s.indexOf('?')
  return {
    path: i === -1 ? s : s.slice(0, i),
    params: new URLSearchParams(i === -1 ? '' : s.slice(i)),
  }
}

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  if (to === snapshot()) return
  if (opts.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  listeners.forEach((l) => l())
  window.scrollTo(0, 0)
}
