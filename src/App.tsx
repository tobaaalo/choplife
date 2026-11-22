import { useEffect } from 'react'
import { Shell } from './components/Shell'
import { Toasts } from './components/Toasts'
import { boot, useStore } from './lib/store'
import { navigate, useLocation } from './lib/router'
import { myProfile } from './lib/store'
import { Forgot, Login, NoHousehold, Reset, Signup, Welcome } from './screens/Auth'
import { Setup } from './screens/Setup'
import { Today } from './screens/Today'
import { Week } from './screens/Week'
import { Recipes } from './screens/Recipes'
import { RecipeEditor } from './screens/RecipeEditor'
import { Kitchen } from './screens/Kitchen'
import { List } from './screens/List'
import { Train } from './screens/Train'
import { Settings } from './screens/Settings'
import { Account } from './screens/Account'
import { Privacy, Terms } from './screens/Legal'
import { ConfirmEmail } from './screens/ConfirmEmail'

const PUBLIC = ['/', '/login', '/signup', '/forgot', '/reset', '/privacy', '/terms']

export default function App() {
  const status = useStore((s) => s.status)
  const state = useStore((s) => s.state)
  const { path } = useLocation()

  useEffect(() => {
    void boot()
  }, [])

  useEffect(() => {
    if (status === 'signedout' && !PUBLIC.includes(path)) navigate('/login', { replace: true })
    if (status === 'ready' && (path === '/' || path === '/login' || path === '/signup'))
      navigate('/today', { replace: true })
  }, [status, path])

  if (path === '/privacy') return <Privacy />
  if (path === '/terms') return <Terms />

  if (status === 'loading') {
    return (
      <div className="welcome" aria-busy="true">
        <h1>Choplife</h1>
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="welcome">
        <h1>We could not load Choplife</h1>
        <p>Check your connection and try again.</p>
        <button className="btn primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }
  if (status === 'signedout') {
    return (
      <>
        {path === '/login' ? (
          <Login />
        ) : path === '/signup' ? (
          <Signup />
        ) : path === '/forgot' ? (
          <Forgot />
        ) : path === '/reset' ? (
          <Reset />
        ) : (
          <Welcome />
        )}
        <Toasts />
      </>
    )
  }
  if (status === 'nohousehold' || !state) {
    return (
      <>
        <NoHousehold />
        <Toasts />
      </>
    )
  }

  if (!myProfile(state).setupDone || path === '/setup') {
    return (
      <>
        <Setup />
        <Toasts />
      </>
    )
  }

  if (path === '/confirm-email') {
    return (
      <>
        <ConfirmEmail />
        <Toasts />
      </>
    )
  }

  const recipeMatch = /^\/recipes\/([^/]+)$/.exec(path)
  return (
    <Shell>
      {path === '/week' ? (
        <Week />
      ) : path === '/recipes' ? (
        <Recipes />
      ) : recipeMatch ? (
        <RecipeEditor id={recipeMatch[1] === 'new' ? null : recipeMatch[1]} />
      ) : path === '/kitchen' ? (
        <Kitchen />
      ) : path === '/list' ? (
        <List />
      ) : path === '/train' || path.startsWith('/train/') ? (
        <Train />
      ) : path === '/settings' ? (
        <Settings />
      ) : path === '/account' ? (
        <Account />
      ) : (
        <Today />
      )}
    </Shell>
  )
}
