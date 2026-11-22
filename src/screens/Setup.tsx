import { useState } from 'react'
import type { Activity, Goal, Profile, Slot } from '../../shared/types'
import { SLOTS, SLOT_LABEL } from '../../shared/types'
import { ACTIVITY_LABEL, calcTargets, lowTargetNote } from '../../shared/logic/nutrition'
import { SelectField, TextField } from '../components/Field'
import { saveProfile, saveSettings, myProfile, useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { RulePicker } from '../components/RulePicker'

const GOALS: { id: Goal; label: string }[] = [
  { id: 'lose', label: 'Lose weight' },
  { id: 'maintain', label: 'Stay the same' },
  { id: 'gain', label: 'Gain weight' },
]

const numOrNull = (v: string): number | null =>
  v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v)

export function Setup() {
  const state = useStore((s) => s.state)!
  const [step, setStep] = useState(0)
  const [p, setP] = useState<Profile>(() => myProfile(state))
  const [meals, setMeals] = useState(() => state.household.settings.meals)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const targets = calcTargets(p)
  const lowNote = lowTargetNote(targets)
  const set = (patch: Partial<Profile>) => setP((cur) => ({ ...cur, ...patch }))

  function next() {
    if (step === 0) {
      const e: Record<string, string> = {}
      if (p.overrideKcal == null) {
        if (!p.sex) e.sex = 'Choose one so we can work out your needs.'
        if (!p.birthYear || p.birthYear < 1920 || p.birthYear > new Date().getFullYear() - 10)
          e.birthYear = 'Enter the year you were born, like 1990.'
        if (!p.heightCm || p.heightCm < 100 || p.heightCm > 230)
          e.heightCm = 'Enter your height in centimetres, like 175.'
        if (!p.weightKg || p.weightKg < 30 || p.weightKg > 300)
          e.weightKg = 'Enter your weight in kilograms, like 72.'
      } else if (p.overrideKcal < 800 || p.overrideKcal > 6000) {
        e.overrideKcal = 'Enter a daily calorie target between 800 and 6000.'
      }
      setErrors(e)
      if (Object.keys(e).length) return
    }
    setStep(step + 1)
  }

  function finish() {
    saveProfile({ ...p, setupDone: true })
    const prev = state.household.settings
    if (SLOTS.some((s) => prev.meals[s].on !== meals[s].on)) saveSettings({ ...prev, meals })
    navigate('/today', { replace: true })
  }

  const enabled = SLOTS.filter((s) => meals[s].on)
  const shareTotal = enabled.reduce((n, s) => n + (p.shares[s] ?? 0), 0)

  return (
    <div className="welcome">
      <div className="stack tight">
        <span className="label">Step {step + 1} of 3</span>
        <h1>{['About you', 'Your meals', 'What you avoid'][step]}</h1>
      </div>

      {step === 0 && (
        <div className="stack">
          <p className="soft">
            This only sets how big your portion is. You can change it any time.
          </p>
          <div className="field">
            <span className="label-row" id="sex-l">
              Sex
            </span>
            <div className="seg" role="group" aria-labelledby="sex-l">
              {(['female', 'male'] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  aria-pressed={p.sex === x}
                  onClick={() => set({ sex: x })}
                >
                  {x === 'female' ? 'Female' : 'Male'}
                </button>
              ))}
            </div>
            {errors.sex && <span className="err">{errors.sex}</span>}
          </div>
          <div className="grid2">
            <TextField
              label="Birth year"
              inputMode="numeric"
              value={p.birthYear ?? ''}
              onChange={(e) => set({ birthYear: numOrNull(e.target.value) })}
              error={errors.birthYear}
            />
            <TextField
              label="Height (cm)"
              inputMode="decimal"
              value={p.heightCm ?? ''}
              onChange={(e) => set({ heightCm: numOrNull(e.target.value) })}
              error={errors.heightCm}
            />
          </div>
          <TextField
            label="Weight (kg)"
            inputMode="decimal"
            value={p.weightKg ?? ''}
            onChange={(e) => set({ weightKg: numOrNull(e.target.value) })}
            error={errors.weightKg}
          />
          <SelectField
            label="How active are you?"
            value={p.activity}
            onChange={(e) => set({ activity: e.target.value as Activity })}
          >
            {(Object.keys(ACTIVITY_LABEL) as Activity[]).map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABEL[a]}
              </option>
            ))}
          </SelectField>
          <div className="field">
            <span className="label-row" id="goal-l">
              Your goal
            </span>
            <div className="chips" role="group" aria-labelledby="goal-l">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="chip"
                  aria-pressed={p.goal === g.id}
                  onClick={() => set({ goal: g.id })}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <TextField
            label="On a programme with a set calorie target? (optional)"
            inputMode="numeric"
            hint="If you enter calories a day here, we use it instead of our estimate."
            value={p.overrideKcal ?? ''}
            onChange={(e) => set({ overrideKcal: numOrNull(e.target.value) })}
            error={errors.overrideKcal}
          />
          <div className="card flat" aria-live="polite">
            <span className="label">Your daily target</span>
            <p
              className="amt"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t28)' }}
            >
              {targets ? `${targets.kcal.toLocaleString()} kcal` : 'Fill in the boxes above'}
            </p>
            {targets && (
              <p className="small soft">
                {targets.source === 'programme'
                  ? 'From your programme.'
                  : 'Estimated from your details.'}{' '}
                Protein {targets.protein} g, carbs {targets.carbs} g, fat {targets.fat} g.
              </p>
            )}
            {lowNote && <p className="err">{lowNote}</p>}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="stack">
          <p className="soft">
            Which meals do you cook for? Everyone in the household shares this.
          </p>
          <div className="stack tight">
            {SLOTS.map((s) => (
              <label key={s} className="check">
                <input
                  type="checkbox"
                  checked={meals[s].on}
                  onChange={(e) =>
                    setMeals({ ...meals, [s]: { ...meals[s], on: e.target.checked } })
                  }
                />
                {SLOT_LABEL[s]}
              </label>
            ))}
          </div>
          {enabled.length === 0 && <p className="err">Choose at least one meal.</p>}
          <div className="stack tight">
            <span className="label">Share of your day in each meal (%)</span>
            <div className="grid2">
              {enabled.map((s: Slot) => (
                <TextField
                  key={s}
                  label={SLOT_LABEL[s]}
                  inputMode="numeric"
                  value={p.shares[s]}
                  onChange={(e) =>
                    set({ shares: { ...p.shares, [s]: numOrNull(e.target.value) ?? 0 } })
                  }
                />
              ))}
            </div>
            <p className="hint">
              We scale these to add up to 100%, so they do not have to match exactly
              {shareTotal !== 100 ? ` (now ${shareTotal}%)` : ''}.
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <p className="soft">
            We will never suggest a dish with these. We check dish names and the ingredients you
            list, so double-check anything serious.
          </p>
          <RulePicker
            title="Allergies"
            kind="allergy"
            selected={p.allergies}
            onChange={(allergies) => set({ allergies })}
          />
          <RulePicker
            title="Foods you will not eat"
            kind="wont"
            selected={p.wontEat}
            onChange={(wontEat) => set({ wontEat })}
          />
        </div>
      )}

      <div className="row between">
        {step > 0 ? (
          <button className="btn" type="button" onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button
            className="btn primary"
            type="button"
            onClick={next}
            disabled={step === 1 && enabled.length === 0}
          >
            Next
          </button>
        ) : (
          <button className="btn primary" type="button" onClick={finish}>
            Finish
          </button>
        )}
      </div>
    </div>
  )
}
