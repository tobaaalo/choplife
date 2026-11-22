import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../lib/api'
import { Link } from '../components/Shell'
import { TextField } from '../components/Field'
import { afterLogin, useStore } from '../lib/store'
import { navigate, useLocation } from '../lib/router'

function tz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London'
  } catch {
    return 'Europe/London'
  }
}

export function Welcome() {
  return (
    <div className="welcome">
      <div className="stack tight">
        <span className="label">Cook once. Eat right.</span>
        <h1>Choplife</h1>
        <p>One meal on the table, a portion that fits each of you. No more “what should we eat?”</p>
      </div>
      <div className="stack tight">
        <Link to="/signup" className="btn primary block">
          Create an account
        </Link>
        <Link to="/signup?join=1" className="btn block">
          I have an invite code
        </Link>
        <Link to="/login" className="btn ghost block">
          Log in
        </Link>
      </div>
      <p className="small soft">
        <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
      </p>
    </div>
  )
}

export function Signup() {
  const { params } = useLocation()
  const [mode, setMode] = useState<'create' | 'join'>(
    params.get('join') || params.get('code') ? 'join' : 'create',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState(params.get('code') ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('POST', '/api/auth/signup', { name, email, password, mode, code, tz: tz() })
      await afterLogin()
      navigate('/today', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not reach the server. Check your connection and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="welcome" onSubmit={submit} noValidate>
      <h1>Create your account</h1>
      <div className="seg" role="group" aria-label="Account type">
        <button type="button" aria-pressed={mode === 'create'} onClick={() => setMode('create')}>
          Start a household
        </button>
        <button type="button" aria-pressed={mode === 'join'} onClick={() => setMode('join')}>
          Join with a code
        </button>
      </div>
      <TextField
        label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="given-name"
        required
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        hint="At least 8 characters."
        required
      />
      {mode === 'join' && (
        <TextField
          label="Invite code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          hint="Your partner finds this in Settings."
          autoCapitalize="characters"
          required
        />
      )}
      {error && (
        <p className="banner err" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary block" disabled={busy}>
        {busy ? 'Creating…' : mode === 'join' ? 'Join household' : 'Create account'}
      </button>
      <p className="small">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  )
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api('POST', '/api/auth/login', { email, password })
      await afterLogin()
      navigate('/today', { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'We could not reach the server. Check your connection and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="welcome" onSubmit={submit} noValidate>
      <h1>Welcome back</h1>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {error && (
        <p className="banner err" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary block" disabled={busy}>
        {busy ? 'Logging in…' : 'Log in'}
      </button>
      <p className="small">
        <Link to="/forgot">Forgot your password?</Link>
      </p>
      <p className="small">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </form>
  )
}

export function Forgot() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState<null | boolean>(null)
  const [error, setError] = useState<string | null>(null)
  const configured = useStore((s) => s.emailConfigured)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const r = await api<{ emailConfigured: boolean }>('POST', '/api/auth/forgot', { email })
      setDone(r.emailConfigured)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not reach the server.')
    }
  }

  if (done !== null) {
    return (
      <div className="welcome">
        <h1>{done ? 'Check your email' : 'Reset is not set up yet'}</h1>
        <p>
          {done
            ? 'If that email has an account, a reset link is on its way. It works for 30 minutes.'
            : 'This site cannot send email yet. Ask the person who runs it to turn on email, or ask your partner to help you get back in.'}
        </p>
        <Link to="/login" className="btn block">
          Back to log in
        </Link>
      </div>
    )
  }
  return (
    <form className="welcome" onSubmit={submit} noValidate>
      <h1>Reset your password</h1>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      {!configured && (
        <p className="banner">
          Email is not set up on this site yet, so a reset link cannot be sent.
        </p>
      )}
      {error && (
        <p className="banner err" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary block">Send reset link</button>
      <Link to="/login" className="btn ghost block">
        Back to log in
      </Link>
    </form>
  )
}

export function Reset() {
  const { params } = useLocation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api('POST', '/api/auth/reset', { token: params.get('token') ?? '', password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not reach the server.')
    }
  }

  if (done) {
    return (
      <div className="welcome">
        <h1>Password changed</h1>
        <p>You can log in with your new password.</p>
        <Link to="/login" className="btn primary block">
          Log in
        </Link>
      </div>
    )
  }
  return (
    <form className="welcome" onSubmit={submit} noValidate>
      <h1>Choose a new password</h1>
      <TextField
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        hint="At least 8 characters."
        required
      />
      {error && (
        <p className="banner err" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary block">Save password</button>
    </form>
  )
}

export function NoHousehold() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(path: string, body: unknown) {
    setBusy(true)
    setError(null)
    try {
      await api('POST', path, body)
      await afterLogin()
      navigate('/today', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="welcome">
      <h1>Set up your kitchen</h1>
      <p>You are not part of a household right now. Start a new one, or join your partner’s.</p>
      <button
        className="btn primary block"
        disabled={busy}
        onClick={() => run('/api/household/create', { tz: tz() })}
      >
        Start a new household
      </button>
      <hr className="divider" />
      <TextField
        label="Invite code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        autoCapitalize="characters"
      />
      {error && (
        <p className="banner err" role="alert">
          {error}
        </p>
      )}
      <button
        className="btn block"
        disabled={busy || !code.trim()}
        onClick={() => run('/api/household/join', { code })}
      >
        Join with code
      </button>
    </div>
  )
}
