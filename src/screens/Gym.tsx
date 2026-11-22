import { useState } from 'react'
import { TEMPLATES } from '../../shared/train/exercises'
import {
  exercisesDone,
  goalsOf,
  lastSets,
  progressSeries,
  sessionsThisWeek,
  trainingKcal,
  volumeOf,
  weekStreak,
  workoutsOf,
} from '../../shared/train/logic'
import type { Workout } from '../../shared/train/types'
import { shortDay } from '../../shared/logic/dates'
import { todayISO } from '../../shared/logic/dates'
import { Goals } from '../components/Goals'
import { ProgressChart } from '../components/ProgressChart'
import { SelectField } from '../components/Field'
import { Link } from '../components/Shell'
import { uid } from '../lib/ids'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'
import { saveTrain } from '../lib/train'

export function Gym() {
  const state = useStore((s) => s.state)!
  const me = state.user.id
  const today = todayISO()
  const items = state.train
  const all = workoutsOf(items, me)
  const open = all.filter((w) => !w.done)
  const finished = all.filter((w) => w.done)
  const [pick, setPick] = useState('')
  const done = exercisesDone(items, me)
  const exercise = pick || done[0] || ''

  const start = (name: string, exercises: string[]) => {
    const w: Workout = {
      id: uid(),
      userId: me,
      kind: 'workout',
      date: today,
      name,
      notes: '',
      done: false,
      exercises: exercises.map((n) => {
        const last = lastSets(items, me, n)
        return { name: n, sets: last ? last.sets.map((s) => ({ ...s })) : [{ reps: 8, kg: 0 }] }
      }),
    }
    saveTrain(w)
    navigate(`/train/workout/${w.id}`)
  }

  const last = finished[0]
  return (
    <div className="stack masonry">
      <section className="card stack tight" aria-label="This week">
        <h2>This week</h2>
        <p className="small">
          {sessionsThisWeek(items, me, today)}{' '}
          {sessionsThisWeek(items, me, today) === 1 ? 'session' : 'sessions'} ·{' '}
          {weekStreak(items, me, today)} week streak
        </p>
        <p className="soft small">
          Training days add {trainingKcal(items, me)} kcal to your daily goal on Today. Change it in
          Settings.
        </p>
      </section>

      <section className="card stack tight" aria-label="Start a workout">
        <h2>Start a workout</h2>
        <div className="chips">
          {TEMPLATES.map((t) => (
            <button key={t.name} className="chip" onClick={() => start(t.name, t.exercises)}>
              {t.name}
            </button>
          ))}
          <button className="chip" onClick={() => start('My workout', [])}>
            Empty
          </button>
          {last && (
            <button
              className="chip"
              onClick={() =>
                start(
                  last.name,
                  last.exercises.map((e) => e.name),
                )
              }
            >
              Repeat {last.name}
            </button>
          )}
        </div>
      </section>

      {open.length > 0 && (
        <section className="card stack tight" aria-label="In progress">
          <h2>In progress</h2>
          <ul className="list">
            {open.map((w) => (
              <li key={w.id}>
                <Link to={`/train/workout/${w.id}`} className="item-row">
                  <span>
                    <strong>{w.name}</strong>
                    <span className="soft small"> · {shortDay(w.date)}</span>
                  </span>
                  <span className="pill warn">Continue</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack tight" aria-label="Progress">
        <h2>Progress</h2>
        {done.length === 0 ? (
          <p className="soft small">Finish a workout and your lifts will be charted here.</p>
        ) : (
          <>
            <SelectField
              label="Exercise"
              value={exercise}
              onChange={(e) => setPick(e.target.value)}
            >
              {done.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </SelectField>
            <ProgressChart points={progressSeries(items, me, exercise)} />
          </>
        )}
      </section>

      <Goals
        area="gym"
        userId={me}
        goals={goalsOf(items, me, 'gym')}
        examples="Bench press 80 kg, or 3 workouts a week"
      />

      <section className="card stack tight" aria-label="History">
        <h2>History</h2>
        {finished.length === 0 ? (
          <p className="soft small">Nothing yet. Start a workout above.</p>
        ) : (
          <ul className="list cols">
            {finished.slice(0, 20).map((w) => (
              <li key={w.id}>
                <Link to={`/train/workout/${w.id}`} className="item-row">
                  <span>
                    <strong>{w.name}</strong>
                    <span className="soft small">
                      {' '}
                      · {shortDay(w.date)} · {w.exercises.length} exercises ·{' '}
                      {Math.round(volumeOf(w)).toLocaleString()} kg lifted
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
