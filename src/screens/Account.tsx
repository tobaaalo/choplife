import { useState } from 'react'
import type { FormEvent } from 'react'
import { api, ApiError } from '../lib/api'
import { logout, refresh, toast, useStore } from '../lib/store'
import { Link } from '../components/Shell'
import { TextField } from '../components/Field'
import { Icon } from '../components/Icon'
import { Confirm } from '../components/Confirm'

export function Account() {
  const state = useStore((s) => s.state)!
  const [name, setName] = useState(state.user.name)
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailPw, setEmailPw] = useState('')
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [del, setDel] = useState(false)
  const [delEmail, setDelEmail] = useState('')
  const [delErr, setDelErr] = useState<string | null>(null)

  const fail = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server.')

  async function saveName(e: FormEvent) {
    e.preventDefault()
    try {
      await api('POST', '/api/auth/name', { name })
      await refresh()
      toast('Name saved')
    } catch (err) {
      toast(fail(err), { tone: 'error' })
    }
  }

  async function savePw(e: FormEvent) {
    e.preventDefault()
    setPwErr(null)
    try {
      await api('POST', '/api/auth/password', { current: cur, next })
      setCur('')
      setNext('')
      toast('Password changed. Other devices were logged out.')
    } catch (err) {
      setPwErr(fail(err))
    }
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault()
    setEmailErr(null)
    try {
      const r = await api<{ applied?: boolean; pending?: boolean }>('POST', '/api/auth/email', {
        newEmail,
        password: emailPw,
      })
      setNewEmail('')
      setEmailPw('')
      if (r.applied) {
        await refresh()
        toast('Email changed')
      } else toast('Check your new email for a confirmation link.')
    } catch (err) {
      setEmailErr(fail(err))
    }
  }

  async function exportData() {
    try {
      const data = await api('GET', '/api/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'choplife-export.json'
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      toast(fail(err), { tone: 'error' })
    }
  }

  async function deleteAccount() {
    setDelErr(null)
    try {
      await api('POST', '/api/auth/delete', { email: delEmail })
      await logout()
    } catch (err) {
      setDelErr(fail(err))
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="row">
          <Link to="/settings" className="icon-btn" aria-label="Back to settings">
            <Icon name="back" />
          </Link>
          <h1>Account</h1>
        </div>
      </div>

      <form className="card stack" onSubmit={saveName}>
        <h2>Your name</h2>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" disabled={!name.trim() || name === state.user.name}>
          Save name
        </button>
      </form>

      <form className="card stack" onSubmit={savePw}>
        <h2>Change password</h2>
        <TextField
          label="Current password"
          type="password"
          value={cur}
          onChange={(e) => setCur(e.target.value)}
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          hint="At least 8 characters."
          error={pwErr}
        />
        <button className="btn" disabled={!cur || !next}>
          Change password
        </button>
      </form>

      <form className="card stack" onSubmit={saveEmail}>
        <h2>Change email</h2>
        <p className="small soft">Now: {state.user.email}</p>
        <TextField
          label="New email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          autoComplete="email"
        />
        <TextField
          label="Your password"
          type="password"
          value={emailPw}
          onChange={(e) => setEmailPw(e.target.value)}
          autoComplete="current-password"
          error={emailErr}
        />
        <button className="btn" disabled={!newEmail || !emailPw}>
          Change email
        </button>
      </form>

      <section className="card stack tight">
        <h2>Your data</h2>
        <p className="small soft">Download everything in your household as a file.</p>
        <button className="btn" onClick={exportData}>
          <Icon name="share" /> Download my data
        </button>
        <button
          className="btn"
          onClick={async () => {
            try {
              await api('POST', '/api/auth/logout-others', {})
              toast('Logged out of other devices')
            } catch (err) {
              toast(fail(err), { tone: 'error' })
            }
          }}
        >
          Log out of other devices
        </button>
      </section>

      <section className="card stack tight">
        <h2>Delete account</h2>
        <p className="small soft">
          This removes your account and your meal history. If you are the last person in the
          household, its dishes and plan are deleted too.
        </p>
        <button className="btn danger" onClick={() => setDel(true)}>
          Delete my account
        </button>
      </section>

      <Confirm
        open={del}
        title="Delete your account?"
        body="This cannot be undone. Type your email to confirm."
        confirmLabel="Delete everything"
        onCancel={() => setDel(false)}
        onConfirm={() => void deleteAccount()}
      >
        <TextField
          label="Type your email to confirm"
          value={delEmail}
          onChange={(e) => setDelEmail(e.target.value)}
          error={delErr}
        />
      </Confirm>
    </>
  )
}
