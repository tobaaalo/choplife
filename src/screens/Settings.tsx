import { useEffect, useState } from 'react'
import { SLOTS, SLOT_LABEL } from '../../shared/types'
import type { Slot } from '../../shared/types'
import { calcTargets } from '../../shared/logic/nutrition'
import { api, ApiError } from '../lib/api'
import { logout, refresh, saveProfile, saveSettings, toast, useStore } from '../lib/store'
import { Link } from '../components/Shell'
import { SelectField, TextField } from '../components/Field'
import { Confirm } from '../components/Confirm'
import { setTheme, useTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'
import { disablePush, currentSubscription, enablePush, pushSupported } from '../lib/push'

export function Settings() {
  const state = useStore((s) => s.state)!
  const vapid = useStore((s) => s.vapidKey)
  const s = state.household.settings
  const me = state.members.find((m) => m.id === state.user.id)!
  const partner = state.members.find((m) => m.id !== state.user.id)
  const isOwner = state.household.createdBy === state.user.id
  const targets = calcTargets(me.profile)
  const theme = useTheme()
  const [pushOn, setPushOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ask, setAsk] = useState<{
    path: string
    ok: string
    title: string
    body: string
    label: string
  } | null>(null)

  useEffect(() => {
    void currentSubscription().then((x) => setPushOn(!!x))
  }, [])

  async function run(path: string, okMsg: string) {
    setBusy(true)
    try {
      await api('POST', path, {})
      toast(okMsg)
      await refresh()
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Could not reach the server.', { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function togglePush() {
    try {
      if (pushOn) {
        await disablePush()
        setPushOn(false)
        toast('Reminders are off on this device')
      } else if (vapid) {
        const r = await enablePush(vapid)
        if (r === 'denied')
          toast('Notifications are blocked. Allow them in your browser settings, then try again.', {
            tone: 'error',
          })
        else {
          setPushOn(true)
          toast('Reminders are on for this device')
        }
      }
    } catch {
      toast('Could not turn reminders on. Please try again.', { tone: 'error' })
    }
  }

  async function copyInvite() {
    const link = `${window.location.origin}/signup?code=${state.household.inviteCode}`
    try {
      if (navigator.share) await navigator.share({ title: 'Join my Choplife household', url: link })
      else {
        await navigator.clipboard.writeText(link)
        toast('Invite link copied')
      }
    } catch {
      /* cancelled */
    }
  }

  const setMeal = (slot: Slot, patch: Partial<{ on: boolean; time: string }>) =>
    saveSettings({ ...s, meals: { ...s.meals, [slot]: { ...s.meals[slot], ...patch } } })

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
      </div>

      <div className="masonry">
        <section className="card stack tight">
          <h2>Look</h2>
          <div className="chips" role="group" aria-label="Theme">
            {(['auto', 'light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                className="chip"
                aria-pressed={theme === t}
                onClick={() => setTheme(t)}
              >
                {t === 'auto' ? 'Match my phone' : t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </section>

        <section className="card stack tight">
          <h2>Your portions</h2>
          <p>
            {targets ? (
              <>
                <strong>{targets.kcal.toLocaleString()} kcal</strong> a day · protein{' '}
                {targets.protein} g · carbs {targets.carbs} g · fat {targets.fat} g
              </>
            ) : (
              'No calorie target yet.'
            )}
          </p>
          <p className="small soft">
            Allergies: {me.profile.allergies.length ? me.profile.allergies.join(', ') : 'none'} ·
            Will not eat:{' '}
            {me.profile.wontEat.length ? me.profile.wontEat.join(', ') : 'nothing listed'}
          </p>
          <TextField
            label="Calories above or below your usual needs, each day"
            hint="Leave empty to use our default for your goal. Use a minus number to eat less, like -500."
            inputMode="numeric"
            defaultValue={me.profile.adjustKcal ?? ''}
            onBlur={(e) => {
              const v = e.target.value.trim()
              const n = v === '' ? null : Number(v)
              if (n !== null && (!Number.isFinite(n) || Math.abs(n) > 2000)) {
                toast('Enter a number between -2000 and 2000.', { tone: 'error' })
                return
              }
              if (n !== me.profile.adjustKcal) saveProfile({ ...me.profile, adjustKcal: n })
            }}
          />
          <Link to="/setup" className="btn">
            Change my details
          </Link>
          <p className="small soft">
            Calorie targets are general food guidance, not medical advice.
          </p>
        </section>

        <section className="card stack">
          <h2>Meals and reminders</h2>
          {SLOTS.map((slot) => (
            <div key={slot} className="row between wrap">
              <label className="check">
                <input
                  type="checkbox"
                  checked={s.meals[slot].on}
                  onChange={(e) => setMeal(slot, { on: e.target.checked })}
                />
                {SLOT_LABEL[slot]}
              </label>
              <div className="field" style={{ width: 130 }}>
                <label htmlFor={`t-${slot}`} className="sr-only">
                  {SLOT_LABEL[slot]} time
                </label>
                <input
                  id={`t-${slot}`}
                  type="time"
                  className="input"
                  value={s.meals[slot].time}
                  disabled={!s.meals[slot].on}
                  onChange={(e) => e.target.value && setMeal(slot, { time: e.target.value })}
                />
              </div>
            </div>
          ))}
          <hr className="divider" />
          <label className="check">
            <input
              type="checkbox"
              checked={s.remindersOn}
              onChange={(e) => saveSettings({ ...s, remindersOn: e.target.checked })}
            />
            Remind us when it is time to cook
          </label>
          <SelectField
            label="How early?"
            value={s.leadMinutes}
            onChange={(e) => saveSettings({ ...s, leadMinutes: Number(e.target.value) })}
          >
            {[0, 30, 60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m === 0 ? 'At meal time' : `${m} minutes before`}
              </option>
            ))}
          </SelectField>
          <div className="grid2">
            <div className="field">
              <label htmlFor="qf">Quiet from</label>
              <input
                id="qf"
                type="time"
                className="input"
                value={s.quietFrom ?? ''}
                onChange={(e) => saveSettings({ ...s, quietFrom: e.target.value || null })}
              />
            </div>
            <div className="field">
              <label htmlFor="qt">Quiet until</label>
              <input
                id="qt"
                type="time"
                className="input"
                value={s.quietTo ?? ''}
                onChange={(e) => saveSettings({ ...s, quietTo: e.target.value || null })}
              />
            </div>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={s.shoppingNudge}
              onChange={(e) => saveSettings({ ...s, shoppingNudge: e.target.checked })}
            />
            Remind us to shop the evening before
          </label>
          {!pushSupported() ? (
            <p className="banner">
              This browser cannot show reminders. On iPhone, add Choplife to your home screen first,
              then come back here.
            </p>
          ) : !vapid ? (
            <p className="banner">Reminders are not switched on for this site yet.</p>
          ) : (
            <button className="btn" onClick={togglePush} aria-pressed={pushOn}>
              {pushOn ? 'Turn off reminders on this device' : 'Turn on reminders on this device'}
            </button>
          )}
        </section>

        <section className="card stack">
          <h2>Household</h2>
          <ul className="list">
            {state.members.map((m, i) => (
              <li key={m.id} className="item-row">
                <span className={`pill ${i % 2 ? 'b' : 'a'}`}>{m.name}</span>
                <span className="grow small soft">
                  {m.id === state.user.id ? 'You' : ''}
                  {m.id === state.household.createdBy ? ' · Owner' : ''}
                </span>
              </li>
            ))}
          </ul>
          {!partner && (
            <div className="stack tight">
              <span className="label">Invite code for your partner</span>
              <p
                style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: 'var(--t28)',
                  letterSpacing: '0.2em',
                }}
              >
                {state.household.inviteCode}
              </p>
              <div className="row wrap">
                <button className="btn" onClick={copyInvite}>
                  Share invite link
                </button>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() => run('/api/household/invite/regenerate', 'New code created')}
                >
                  New code
                </button>
              </div>
            </div>
          )}
          <div className="row wrap">
            {partner && isOwner && (
              <>
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    setAsk({
                      path: '/api/household/transfer',
                      ok: 'Ownership handed over',
                      title: 'Hand over ownership?',
                      body: `${partner.name} becomes the owner of this household.`,
                      label: 'Hand over',
                    })
                  }
                >
                  Hand over ownership
                </button>
                <button
                  className="btn danger"
                  disabled={busy}
                  onClick={() =>
                    setAsk({
                      path: '/api/household/remove-partner',
                      ok: `${partner.name} was removed`,
                      title: `Remove ${partner.name}?`,
                      body: 'They keep their account but lose access to your shared dishes and plan.',
                      label: 'Remove',
                    })
                  }
                >
                  Remove {partner.name}
                </button>
              </>
            )}
            <button
              className="btn danger"
              disabled={busy}
              onClick={() =>
                setAsk({
                  path: '/api/household/leave',
                  ok: 'You left the household',
                  title: 'Leave this household?',
                  body: 'You will lose access to its dishes and plan.',
                  label: 'Leave',
                })
              }
            >
              Leave household
            </button>
          </div>
        </section>

        <section className="card stack tight">
          <h2>Account</h2>
          <p className="small soft">{state.user.email}</p>
          <div className="row wrap">
            <Link to="/account" className="btn">
              Account and security
            </Link>
            <button className="btn" onClick={() => void logout()}>
              Log out
            </button>
          </div>
          <p className="small soft">
            <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link>
          </p>
        </section>
      </div>
      <Confirm
        open={ask != null}
        title={ask?.title ?? ''}
        body={ask?.body ?? ''}
        confirmLabel={ask?.label ?? ''}
        onCancel={() => setAsk(null)}
        onConfirm={() => {
          const a = ask
          setAsk(null)
          if (a) void run(a.path, a.ok)
        }}
      />
    </>
  )
}
