import { useState } from 'react'
import type { Goal } from '../../shared/train/types'
import { uid } from '../lib/ids'
import { removeTrain, saveTrain } from '../lib/train'
import { TextField } from './Field'
import { Icon } from './Icon'

interface Props {
  area: Goal['area']
  userId: string
  goals: Goal[]
  examples: string
}

export function Goals({ area, userId, goals, examples }: Props) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const t = Number(target)
    if (!text.trim() || !Number.isFinite(t) || t <= 0) return
    saveTrain({
      id: uid(),
      userId,
      kind: 'goal',
      area,
      text: text.trim(),
      target: t,
      progress: 0,
      unit: unit.trim(),
      done: false,
    })
    setText('')
    setTarget('')
    setUnit('')
    setAdding(false)
  }

  const bump = (g: Goal, by: number) => {
    const progress = Math.max(0, g.progress + by)
    saveTrain({ ...g, progress, done: progress >= g.target })
  }

  return (
    <section className="card stack tight" aria-label="Goals">
      <div className="row between">
        <h2>Goals</h2>
        {!adding && (
          <button className="btn small" onClick={() => setAdding(true)}>
            <Icon name="plus" /> Add goal
          </button>
        )}
      </div>
      {goals.length === 0 && !adding && <p className="soft small">No goals yet. Try: {examples}</p>}
      {goals.map((g) => (
        <div key={g.id} className="goal">
          <div className="row between">
            <strong>{g.text}</strong>
            {g.done && <span className="pill ok">Done</span>}
          </div>
          <div className="row">
            <button
              className="btn small"
              aria-label={`Less progress on ${g.text}`}
              onClick={() => bump(g, -1)}
            >
              −
            </button>
            <span className="small">
              {g.progress} of {g.target} {g.unit}
            </span>
            <button
              className="btn small"
              aria-label={`More progress on ${g.text}`}
              onClick={() => bump(g, 1)}
            >
              +
            </button>
            <button className="btn small ghost" onClick={() => removeTrain(g, 'Goal')}>
              Delete
            </button>
          </div>
          <div
            className="meter"
            role="progressbar"
            aria-label={g.text}
            aria-valuemin={0}
            aria-valuemax={g.target}
            aria-valuenow={Math.min(g.progress, g.target)}
          >
            <span style={{ width: `${Math.min(100, (g.progress / g.target) * 100)}%` }} />
          </div>
        </div>
      ))}
      {adding && (
        <form className="stack tight" onSubmit={add}>
          <TextField
            label="What do you want to do?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={120}
            placeholder={examples}
          />
          <div className="row">
            <TextField
              label="Target"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <TextField
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxLength={20}
              placeholder="sessions, km, kg"
            />
          </div>
          <div className="row">
            <button className="btn primary" type="submit">
              Save goal
            </button>
            <button className="btn ghost" type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
