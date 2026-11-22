import { useSyncExternalStore } from 'react'
import type { AppState, Feedback, HouseholdSettings, Profile } from '../../shared/types'
import { emptyProfile } from '../../shared/types'
import { api, ApiError, isNetworkError } from './api'

export type Entity = 'recipes' | 'plan' | 'logs' | 'pantry' | 'manual' | 'feedback' | 'train'
export interface Op {
  op: 'put' | 'delete'
  entity: Entity
  id: string
  body?: unknown
}

type QueueItem =
  | { kind: 'batch'; ops: Op[] }
  | { kind: 'profile'; body: Profile }
  | { kind: 'settings'; body: HouseholdSettings }

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'error'
  undo?: () => void
}

export type Status = 'loading' | 'signedout' | 'nohousehold' | 'ready' | 'error'

interface Store {
  status: Status
  state: AppState | null
  online: boolean
  pending: number
  syncing: boolean
  toasts: Toast[]
  emailConfigured: boolean
  vapidKey: string | null
}

let store: Store = {
  status: 'loading',
  state: null,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pending: 0,
  syncing: false,
  toasts: [],
  emailConfigured: false,
  vapidKey: null,
}
const subs = new Set<() => void>()
let queue: QueueItem[] = []
let toastId = 1

const QUEUE_KEY = 'cl_queue'
const SNAP_KEY = 'cl_snapshot'

function set(patch: Partial<Store>): void {
  store = { ...store, ...patch }
  subs.forEach((s) => s())
}

export function useStore<T>(select: (s: Store) => T): T {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => select(store),
  )
}

export function getState(): AppState {
  if (!store.state) throw new Error('Not loaded')
  return store.state
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage may be full or blocked */
  }
}

function persist(): void {
  safeSet(QUEUE_KEY, queue.length ? JSON.stringify(queue) : null)
  set({ pending: queue.length })
}

function snapshot(): void {
  if (store.state) safeSet(SNAP_KEY, JSON.stringify({ at: Date.now(), state: store.state }))
}

// ---------- toasts ----------

export function toast(
  message: string,
  opts: { tone?: 'info' | 'error'; undo?: () => void } = {},
): void {
  const t: Toast = { id: toastId++, message, tone: opts.tone ?? 'info', undo: opts.undo }
  // Repeating the same message replaces it instead of stacking.
  set({ toasts: [...store.toasts.filter((x) => x.message !== message), t].slice(-3) })
  setTimeout(() => dismissToast(t.id), opts.undo ? 6000 : 4500)
}

export function dismissToast(id: number): void {
  set({ toasts: store.toasts.filter((t) => t.id !== id) })
}

// ---------- optimistic application ----------

export function applyOp(s: AppState, o: Op): AppState {
  const put = o.op === 'put'
  const body = o.body as Record<string, unknown>
  switch (o.entity) {
    case 'recipes':
      return {
        ...s,
        recipes: put
          ? upsert(s.recipes, o.id, body as never)
          : s.recipes.filter((r) => r.id !== o.id),
        plan: put ? s.plan : s.plan.filter((p) => p.recipeId !== o.id),
        feedback: put ? s.feedback : s.feedback.filter((f) => f.recipeId !== o.id),
      }
    case 'plan': {
      if (!put) return { ...s, plan: s.plan.filter((p) => p.id !== o.id) }
      const e = body as unknown as { date: string; slot: string }
      const rest = s.plan.filter((p) => !(p.date === e.date && p.slot === e.slot && p.id !== o.id))
      return { ...s, plan: upsert(rest, o.id, body as never) }
    }
    case 'logs':
      return {
        ...s,
        logs: put ? upsert(s.logs, o.id, body as never) : s.logs.filter((l) => l.id !== o.id),
      }
    case 'pantry':
      return {
        ...s,
        pantry: put ? upsert(s.pantry, o.id, body as never) : s.pantry.filter((p) => p.id !== o.id),
      }
    case 'manual':
      return {
        ...s,
        manual: put ? upsert(s.manual, o.id, body as never) : s.manual.filter((p) => p.id !== o.id),
      }
    case 'train':
      return {
        ...s,
        train: put ? upsert(s.train, o.id, body as never) : s.train.filter((t) => t.id !== o.id),
      }
    case 'feedback': {
      const fb = s.feedback.filter((f) => f.recipeId !== o.id)
      return { ...s, feedback: put ? [...fb, body as unknown as Feedback] : fb }
    }
  }
}

function upsert<T extends { id: string }>(list: T[], id: string, item: T): T[] {
  const i = list.findIndex((x) => x.id === id)
  if (i === -1) return [...list, item]
  const copy = list.slice()
  copy[i] = item
  return copy
}

// ---------- writes ----------

export function commit(ops: Op[]): void {
  if (!store.state || ops.length === 0) return
  let next = store.state
  for (const o of ops) next = applyOp(next, o)
  set({ state: next })
  snapshot()
  const last = queue[queue.length - 1]
  if (last && last.kind === 'batch' && last.ops.length + ops.length <= 400) last.ops.push(...ops)
  else queue.push({ kind: 'batch', ops: [...ops] })
  persist()
  void flush()
}

export function saveProfile(p: Profile): void {
  if (!store.state) return
  const members = store.state.members.map((m) => (m.id === p.userId ? { ...m, profile: p } : m))
  set({ state: { ...store.state, members } })
  snapshot()
  queue = queue.filter((q) => !(q.kind === 'profile' && q.body.userId === p.userId))
  queue.push({ kind: 'profile', body: p })
  persist()
  void flush()
}

export function saveSettings(s: HouseholdSettings): void {
  if (!store.state) return
  set({ state: { ...store.state, household: { ...store.state.household, settings: s } } })
  snapshot()
  queue = queue.filter((q) => q.kind !== 'settings')
  queue.push({ kind: 'settings', body: s })
  persist()
  void flush()
}

let flushing = false

export async function flush(): Promise<void> {
  if (flushing || queue.length === 0 || store.status !== 'ready') return
  flushing = true
  set({ syncing: true })
  try {
    while (queue.length > 0) {
      const item = queue[0]
      try {
        if (item.kind === 'batch') await api('POST', '/api/batch', { ops: item.ops })
        else if (item.kind === 'profile') await api('PUT', '/api/profile', item.body)
        else await api('PUT', '/api/household/settings', item.body)
        queue.shift()
        persist()
        set({ online: true })
      } catch (e) {
        if (isNetworkError(e) || (e as ApiError).status >= 500) {
          // Keep the queue and try again later; a server hiccup must not lose changes.
          if (isNetworkError(e)) set({ online: false })
          return
        }
        const err = e as ApiError
        if (err.status === 401) {
          queue = []
          persist()
          safeSet(SNAP_KEY, null)
          set({ status: 'signedout', state: null })
          return
        }
        queue.shift()
        persist()
        toast(err.message || 'One change could not be saved, so we refreshed.', { tone: 'error' })
        await refresh()
      }
    }
  } finally {
    flushing = false
    set({ syncing: false })
  }
}

// ---------- loading ----------

export async function refresh(): Promise<void> {
  try {
    const s = await api<AppState>('GET', '/api/state')
    // Re-apply anything still waiting so a refresh never undoes unsent work.
    let next = s
    for (const item of queue) {
      if (item.kind === 'batch') for (const o of item.ops) next = applyOp(next, o)
      else if (item.kind === 'profile')
        next = {
          ...next,
          members: next.members.map((m) =>
            m.id === item.body.userId ? { ...m, profile: item.body } : m,
          ),
        }
      else next = { ...next, household: { ...next.household, settings: item.body } }
    }
    set({ state: next, status: 'ready', online: true })
    snapshot()
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) set({ status: 'signedout', state: null })
      else if (e.code === 'no_household') set({ status: 'nohousehold', state: null })
      else if (!store.state) set({ status: 'error' })
      return
    }
    // Offline: fall back to the last copy on this device.
    set({ online: false })
    if (!store.state) {
      try {
        const raw = localStorage.getItem(SNAP_KEY)
        if (raw) {
          const snap = JSON.parse(raw) as { state: AppState }
          set({ state: snap.state, status: 'ready' })
          return
        }
      } catch {
        /* ignore */
      }
      set({ status: 'error' })
    }
  }
}

export async function boot(): Promise<void> {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (raw) queue = JSON.parse(raw) as QueueItem[]
  } catch {
    queue = []
  }
  set({ pending: queue.length })
  window.addEventListener('online', () => {
    set({ online: true })
    void flush().then(refresh)
  })
  window.addEventListener('offline', () => set({ online: false }))
  // Keep two phones in step: refresh every 20 seconds while the app is open and nothing is waiting to send.
  setInterval(() => {
    if (
      document.visibilityState === 'visible' &&
      store.status === 'ready' &&
      queue.length === 0 &&
      navigator.onLine
    ) {
      void refresh()
    }
  }, 20_000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && store.status === 'ready')
      void flush().then(refresh)
  })
  try {
    const c = await api<{ emailConfigured: boolean; vapidPublicKey: string | null }>(
      'GET',
      '/api/auth/config',
    )
    set({ emailConfigured: c.emailConfigured, vapidKey: c.vapidPublicKey })
  } catch {
    /* offline */
  }
  try {
    const me = await api<{ user: unknown; hasHousehold?: boolean }>('GET', '/api/auth/me')
    if (!me.user) {
      set({ status: 'signedout' })
      return
    }
    await refresh()
    void flush()
  } catch {
    await refresh()
  }
}

export async function afterLogin(): Promise<void> {
  set({ status: 'loading' })
  await refresh()
  void flush()
}

export async function logout(): Promise<void> {
  try {
    await api('POST', '/api/auth/logout', {})
  } catch {
    /* ignore */
  }
  queue = []
  safeSet(QUEUE_KEY, null)
  safeSet(SNAP_KEY, null)
  set({ status: 'signedout', state: null, pending: 0 })
}

export function myProfile(s: AppState): Profile {
  return s.members.find((m) => m.id === s.user.id)?.profile ?? emptyProfile(s.user.id)
}
