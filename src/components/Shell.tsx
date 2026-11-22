import type { ReactNode } from 'react'
import { navigate, useLocation } from '../lib/router'
import { useStore } from '../lib/store'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { Toasts } from './Toasts'
import { setTheme, useTheme } from '../lib/theme'

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '/today', label: 'Today', icon: 'today' },
  { path: '/week', label: 'Week', icon: 'week' },
  { path: '/recipes', label: 'Recipes', icon: 'recipes' },
  { path: '/kitchen', label: 'Kitchen', icon: 'kitchen' },
  { path: '/list', label: 'List', icon: 'list' },
  { path: '/train', label: 'Train', icon: 'dumbbell' },
]

function go(e: React.MouseEvent<HTMLAnchorElement>, to: string) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
  e.preventDefault()
  navigate(to)
}

export function Link({
  to,
  children,
  ...rest
}: { to: string; children: ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={to} onClick={(e) => go(e, to)} {...rest}>
      {children}
    </a>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const { path } = useLocation()
  const online = useStore((s) => s.online)
  const pending = useStore((s) => s.pending)
  const theme = useTheme()
  const isDark =
    theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  return (
    <div className="app">
      <a
        href="#main"
        className="sr-only"
        onFocus={(e) => e.currentTarget.classList.remove('sr-only')}
      >
        Skip to content
      </a>
      <header className="topbar">
        <Link to="/today" className="brand">
          <span className="dot" aria-hidden="true" />
          Choplife
        </Link>
        <div className="row">
          {(!online || pending > 0) && (
            <span className="pill warn" role="status">
              {!online ? 'Offline' : 'Saving'}
              {pending > 0 ? ` (${pending})` : ''}
            </span>
          )}
          <button
            type="button"
            className="icon-btn"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            <Icon name={isDark ? 'sun' : 'moon'} />
          </button>
          <Link to="/settings" className="icon-btn" aria-label="Settings">
            <Icon name="gear" />
          </Link>
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        {children}
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className="tab"
            aria-current={path.startsWith(t.path) ? 'page' : undefined}
          >
            <Icon name={t.icon} />
            {t.label}
          </Link>
        ))}
      </nav>
      <Toasts />
    </div>
  )
}
