import { useEffect, useMemo, useRef, useState } from 'react'
import { EXERCISES, GROUPS } from '../../shared/train/exercises'
import type { Group } from '../../shared/train/exercises'
import { lastSets, trainingKcal } from '../../shared/train/logic'
import type { Workout } from '../../shared/train/types'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { TextField } from '../components/Field'
import { Link } from '../components/Shell'
import { navigate } from '../lib/router'
import { toast, useStore } from '../lib/store'
import { removeTrain, saveTrain } from '../lib/train'

export function WorkoutEditor({ id }: { id: string }) {
  const state = useStore((s) => s.state)!
  const me = state.user.id
  const saved = state.train.find((t): t is Workout => t.kind === 'workout' && t.id === id)
  const [draft, setDraft] = useState<Workout | null>(saved ?? null)
  const [picking, setPicking] = useState(false)
  const first = useRef(true)

  // Save a moment after the last change.
  useEffect(() => {
    if (!draft) return
    if (first.current) {
      first.current = false
      return
    }
    const t = setTimeout(() => saveTrain(draft), 500)
    return () => clearTimeout(t)
  }, [draft])

  if (!draft || draft.userId !== me) {
    return (
      <div className="empty">
        <h3>Workout not found</h3>
        <Link to="/train" className="btn">
          Back to Gym
        </Link>
      </div>
    )
  }
  const w = draft
  const change = (patch: Partial<Workout>) => setDraft({ ...w, ...patch })
  const setEx = (i: number, sets: Workout['exercises'][number]['sets']) =>
    change({ exercises: w.exercises.map((e, j) => (j === i ? { ...e, sets } : e)) })

  const finish = () => {
    const clean = {
      ...w,
      done: true,
      exercises: w.exercises
        .map((e) => ({ ...e, sets: e.sets.filter((s) => s.reps > 0) }))
        .filter((e) => e.sets.length > 0),
    }
    saveTrain(clean)
    toast(`Workout saved. Today's goal is ${trainingKcal(state.train, me)} kcal higher.`)
    navigate('/train')
  }

  const remove = () => {
    removeTrain(w, 'Workout')
    navigate('/train')
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <Link to="/train" className="label">
            ← Gym
          </Link>
          <h1>{w.done ? 'Edit workout' : 'Workout'}</h1>
        </div>
      </div>

      <section className="card stack tight">
        <div className="row">
          <TextField
            label="Name"
            value={w.name}
            maxLength={60}
            onChange={(e) => change({ name: e.target.value })}
          />
          <TextField
            label="Date"
            type="date"
            value={w.date}
            onChange={(e) => e.target.value && change({ date: e.target.value })}
          />
        </div>
      </section>

      {w.exercises.length === 0 && <p className="soft small">No exercises yet. Add one below.</p>}

      {w.exercises.map((ex, i) => {
        const last = lastSets(state.train, me, ex.name, w.id)
        const meta = EXERCISES.find((x) => x.name === ex.name)
        return (
          <section key={ex.name + i} className="card stack tight" aria-label={ex.name}>
            <div className="row between">
              <h3>{ex.name}</h3>
              <button
                className="btn small ghost"
                onClick={() => change({ exercises: w.exercises.filter((_, j) => j !== i) })}
              >
                Remove
              </button>
            </div>
            {meta?.note && <p className="soft small">{meta.note}</p>}
            {last && (
              <p className="soft small">
                Last time: {last.sets.map((s) => `${s.reps} x ${s.kg} kg`).join(', ')}
              </p>
            )}
            <div className="setrow head" aria-hidden="true">
              <span>Set</span>
              <span>Reps</span>
              <span>Kg</span>
              <span />
            </div>
            {ex.sets.map((s, k) => (
              <div key={k} className="setrow">
                <span>{k + 1}</span>
                <input
                  className="input"
                  aria-label={`${ex.name} set ${k + 1} reps`}
                  inputMode="numeric"
                  value={s.reps || ''}
                  onChange={(e) =>
                    setEx(
                      i,
                      ex.sets.map((x, j) =>
                        j === k
                          ? {
                              ...x,
                              reps: Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0),
                            }
                          : x,
                      ),
                    )
                  }
                />
                <input
                  className="input"
                  aria-label={`${ex.name} set ${k + 1} kilograms`}
                  inputMode="decimal"
                  value={s.kg || ''}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(',', '.'))
                    if (e.target.value !== '' && !Number.isFinite(n)) return
                    setEx(
                      i,
                      ex.sets.map((x, j) => (j === k ? { ...x, kg: Math.max(0, n || 0) } : x)),
                    )
                  }}
                />
                <button
                  className="icon-btn"
                  aria-label={`Remove set ${k + 1} of ${ex.name}`}
                  onClick={() =>
                    setEx(
                      i,
                      ex.sets.filter((_, j) => j !== k),
                    )
                  }
                >
                  <Icon name="x" />
                </button>
              </div>
            ))}
            <div>
              <button
                className="btn small"
                onClick={() =>
                  setEx(i, [
                    ...ex.sets,
                    ex.sets[ex.sets.length - 1]
                      ? { ...ex.sets[ex.sets.length - 1] }
                      : { reps: 8, kg: 0 },
                  ])
                }
              >
                <Icon name="plus" /> Add set
              </button>
            </div>
          </section>
        )
      })}

      <div className="row wrap">
        <button className="btn" onClick={() => setPicking(true)}>
          <Icon name="plus" /> Add exercise
        </button>
      </div>

      <section className="card stack tight">
        <label htmlFor="wk-notes" className="label">
          Notes
        </label>
        <textarea
          id="wk-notes"
          className="textarea"
          rows={2}
          maxLength={500}
          value={w.notes}
          onChange={(e) => change({ notes: e.target.value })}
        />
      </section>

      <div className="row wrap">
        <button
          className="btn primary"
          onClick={finish}
          disabled={w.exercises.every((e) => e.sets.every((s) => s.reps === 0))}
        >
          <Icon name="check" /> {w.done ? 'Save changes' : 'Finish workout'}
        </button>
        <button className="btn ghost" onClick={remove}>
          Delete workout
        </button>
      </div>

      <ExercisePicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(name) => {
          const last = lastSets(state.train, me, name, w.id)
          change({
            exercises: [
              ...w.exercises,
              { name, sets: last ? last.sets.map((s) => ({ ...s })) : [{ reps: 8, kg: 0 }] },
            ],
          })
          setPicking(false)
        }}
      />
    </div>
  )
}

function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (name: string) => void
}) {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const list = useMemo(
    () =>
      EXERCISES.filter(
        (e) =>
          (!group || e.group === group) && e.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [q, group],
  )
  const custom =
    q.trim().length > 1 && !EXERCISES.some((e) => e.name.toLowerCase() === q.trim().toLowerCase())
  return (
    <Sheet open={open} title="Add an exercise" onClose={onClose}>
      <div className="stack tight">
        <TextField
          label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Squat, curl, run..."
        />
        <div className="chips" role="group" aria-label="Muscle group">
          <button className="chip" aria-pressed={group === null} onClick={() => setGroup(null)}>
            All
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              className="chip"
              aria-pressed={group === g}
              onClick={() => setGroup(group === g ? null : g)}
            >
              {g}
            </button>
          ))}
        </div>
        <ul className="list">
          {custom && (
            <li>
              <button className="item-row" onClick={() => onPick(q.trim())}>
                Add “{q.trim()}” as your own exercise
              </button>
            </li>
          )}
          {list.map((e) => (
            <li key={e.name}>
              <button className="item-row" onClick={() => onPick(e.name)}>
                <span>{e.name}</span>
                <span className="soft small">{e.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
