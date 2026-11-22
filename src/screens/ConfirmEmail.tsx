import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { Link } from '../components/Shell'
import { refresh } from '../lib/store'
import { useLocation } from '../lib/router'

export function ConfirmEmail() {
  const { params } = useLocation()
  const token = params.get('token') ?? ''
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    api('POST', '/api/auth/email/confirm', { token })
      .then(() => refresh())
      .then(() => setMsg({ ok: true, text: 'Your email address is updated.' }))
      .catch((e) =>
        setMsg({
          ok: false,
          text: e instanceof ApiError ? e.message : 'Could not reach the server.',
        }),
      )
  }, [token])

  return (
    <div className="welcome">
      <h1>{msg ? (msg.ok ? 'Email confirmed' : 'That did not work') : 'Confirming…'}</h1>
      {msg && <p>{msg.text}</p>}
      <Link to="/settings" className="btn">
        Back to settings
      </Link>
    </div>
  )
}
