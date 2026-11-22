import { dismissToast, useStore } from '../lib/store'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone === 'error' ? 'error' : ''}`}>
          <span>{t.message}</span>
          {t.undo && (
            <button
              type="button"
              className="btn small"
              onClick={() => {
                t.undo?.()
                dismissToast(t.id)
              }}
            >
              Undo
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
