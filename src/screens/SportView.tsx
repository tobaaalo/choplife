import { useState } from 'react'
import { coachPlan, drillsFor } from '../../shared/train/sports'
import type { Drill } from '../../shared/train/sports'
import { goalsOf, levelOf, sessionsOf } from '../../shared/train/logic'
import { LEVELS, LEVEL_LABEL } from '../../shared/train/types'
import type { Sport, SportSession } from '../../shared/train/types'
import { shortDay, todayISO } from '../../shared/logic/dates'
import { Goals } from '../components/Goals'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { TextField } from '../components/Field'
import { uid } from '../lib/ids'
import { toast, useStore } from '../lib/store'
import { removeTrain, saveTrain } from '../lib/train'

const EXAMPLES: Record<Sport, string> = {
  tennis: 'Land 7 of 10 first serves',
  badminton: 'Play 3 times a week',
  swimming: 'Swim 1000 metres without stopping',
}

export function SportView({ sport }: { sport: Sport }) {
  const state = useStore((s) => s.state)!
  const me = state.user.id
  const today = todayISO()
  const items = state.train
  const level = levelOf(items, me, sport)
  const sessions = sessionsOf(items, me, sport)
  const goals = goalsOf(items, me, sport)
  const plan = coachPlan(sport, level, sessions, goals, today)
  const [drill, setDrill] = useState<Drill | null>(null)
  const [logging, setLogging] = useState<{ drills: string[]; minutes: number } | null>(null)
  const [focus, setFocus] = useState<string | null>(null)

  const library = drillsFor(sport)
  const focuses = [...new Set(library.map((d) => d.focus))]
  const month = sessions.filter((s) => s.date >= `${today.slice(0, 8)}01`)
  const minutes = month.reduce((n, s) => n + s.minutes, 0)
  const metres = month.reduce((n, s) => n + (s.distance ?? 0), 0)

  return (
    <div className="stack masonry">
      <section className="card stack tight" aria-label="Your level">
        <h2>Your level</h2>
        <div className="chips" role="group" aria-label="Level">
          {LEVELS.map((l) => (
            <button
              key={l}
              className="chip"
              aria-pressed={level === l}
              onClick={() =>
                saveTrain({
                  id: `level-${sport}-${me}`,
                  userId: me,
                  kind: 'level',
                  sport,
                  level: l,
                })
              }
            >
              {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
        <p className="soft small">
          This month: {month.length} sessions, {minutes} minutes
          {sport === 'swimming' ? `, ${metres.toLocaleString()} metres` : ''}.
        </p>
      </section>

      <section className="card taped stack tight" aria-label="Today's plan">
        <h2>Today&apos;s plan · about {plan.minutes} min</h2>
        <p className="soft small">{plan.why}</p>
        <p className="label">Warm up</p>
        <ul className="plain">
          {plan.warmup.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <p className="label">Drills</p>
        <ul className="list">
          {plan.drills.map((d) => (
            <li key={d.id}>
              <button className="item-row" onClick={() => setDrill(d)}>
                <span>
                  <strong>{d.name}</strong>
                  <span className="soft small">
                    {' '}
                    · {d.focus} · {d.minutes} min
                  </span>
                </span>
                <Icon name="chevron" />
              </button>
            </li>
          ))}
        </ul>
        <p className="label">Cool down</p>
        <ul className="plain">
          {plan.cooldown.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <div>
          <button
            className="btn primary"
            onClick={() =>
              setLogging({ drills: plan.drills.map((d) => d.id), minutes: plan.minutes })
            }
          >
            <Icon name="check" /> I did this
          </button>
        </div>
      </section>

      <section className="card stack tight" aria-label="Log a session">
        <h2>Log a session</h2>
        <p className="soft small">
          Played or swam something different? Log it so your progress stays right.
        </p>
        <div>
          <button className="btn" onClick={() => setLogging({ drills: [], minutes: 45 })}>
            <Icon name="plus" /> Log session
          </button>
        </div>
      </section>

      <Goals area={sport} userId={me} goals={goals} examples={EXAMPLES[sport]} />

      <section className="card stack tight" aria-label="Drill library">
        <h2>Drill library</h2>
        <div className="chips" role="group" aria-label="Skill">
          <button className="chip" aria-pressed={focus === null} onClick={() => setFocus(null)}>
            All
          </button>
          {focuses.map((f) => (
            <button
              key={f}
              className="chip"
              aria-pressed={focus === f}
              onClick={() => setFocus(focus === f ? null : f)}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="list cols">
          {library
            .filter((d) => !focus || d.focus === focus)
            .map((d) => (
              <li key={d.id}>
                <button className="item-row" onClick={() => setDrill(d)}>
                  <span>
                    <strong>{d.name}</strong>
                    <span className="soft small">
                      {' '}
                      · {LEVEL_LABEL[d.level]} · {d.minutes} min
                    </span>
                  </span>
                  <Icon name="chevron" />
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="card stack tight" aria-label="History">
        <h2>History</h2>
        {sessions.length === 0 ? (
          <p className="soft small">No sessions yet.</p>
        ) : (
          <ul className="list">
            {sessions.slice(0, 15).map((s) => (
              <li key={s.id} className="item-row">
                <span>
                  <strong>{shortDay(s.date)}</strong>
                  <span className="soft small">
                    {' '}
                    · {s.minutes} min{s.distance ? ` · ${s.distance} m` : ''} ·{' '}
                    {'★'.repeat(s.rating)}
                    {s.notes ? ` · ${s.notes}` : ''}
                  </span>
                </span>
                <button className="btn small ghost" onClick={() => removeTrain(s, 'Session')}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={!!drill} title={drill?.name ?? ''} onClose={() => setDrill(null)}>
        {drill && (
          <div className="stack tight">
            <p className="soft small">
              {drill.focus} · {LEVEL_LABEL[drill.level]} · {drill.minutes} min
            </p>
            <ol className="steps">
              {drill.steps.map((st) => (
                <li key={st}>{st}</li>
              ))}
            </ol>
            <p>
              <strong>Tip:</strong> {drill.tip}
            </p>
          </div>
        )}
      </Sheet>

      <LogSheet
        key={logging ? logging.drills.join() + logging.minutes : 'closed'}
        sport={sport}
        init={logging}
        drills={library}
        userId={me}
        onClose={() => setLogging(null)}
      />
    </div>
  )
}

function LogSheet({
  sport,
  init,
  drills,
  userId,
  onClose,
}: {
  sport: Sport
  init: { drills: string[]; minutes: number } | null
  drills: Drill[]
  userId: string
  onClose: () => void
}) {
  const [minutes, setMinutes] = useState(String(init?.minutes ?? 45))
  const [distance, setDistance] = useState('')
  const [picked, setPicked] = useState<string[]>(init?.drills ?? [])
  const [rating, setRating] = useState(3)
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(todayISO())

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const m = Number(minutes)
    if (!Number.isFinite(m) || m < 1) return
    const s: SportSession = {
      id: uid(),
      userId,
      kind: 'session',
      date,
      sport,
      minutes: Math.round(m),
      distance: sport === 'swimming' && distance ? Number(distance) || null : null,
      drills: picked,
      rating,
      notes: notes.trim(),
    }
    saveTrain(s)
    toast('Session saved')
    onClose()
  }

  return (
    <Sheet open={!!init} title="Log a session" onClose={onClose}>
      <form className="stack tight" onSubmit={save}>
        <div className="row">
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
          <TextField
            label="Minutes"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
          />
          {sport === 'swimming' && (
            <TextField
              label="Metres"
              inputMode="numeric"
              value={distance}
              onChange={(e) => setDistance(e.target.value.replace(/\D/g, ''))}
            />
          )}
        </div>
        <p className="label">Drills you did</p>
        <div className="chips" role="group" aria-label="Drills you did">
          {drills.map((d) => (
            <button
              type="button"
              key={d.id}
              className="chip"
              aria-pressed={picked.includes(d.id)}
              onClick={() =>
                setPicked(
                  picked.includes(d.id) ? picked.filter((x) => x !== d.id) : [...picked, d.id],
                )
              }
            >
              {d.name}
            </button>
          ))}
        </div>
        <p className="label">How did it go?</p>
        <div className="chips" role="group" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              className="chip"
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
            >
              {n} {n === 1 ? 'star' : 'stars'}
            </button>
          ))}
        </div>
        <TextField
          label="Notes (optional)"
          value={notes}
          maxLength={500}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="row">
          <button className="btn primary" type="submit">
            Save session
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Sheet>
  )
}
