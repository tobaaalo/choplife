import { bonusFor } from '../../shared/train/logic'
import { useState } from 'react'
import type { Recipe, Slot } from '../../shared/types'
import { SLOTS, SLOT_LABEL } from '../../shared/types'
import { dayTotals, eaters, entryServings } from '../../shared/logic/engine'
import { longDate, minutesOf, todayISO } from '../../shared/logic/dates'
import { portionFor } from '../../shared/logic/portions'
import { allergyUnverified, enabledSlots, useCtx } from '../lib/derive'
import {
  autoPlan,
  logSomethingElse,
  markAllEaten,
  markSkipped,
  removePlanned,
  toggleEaten,
  undoLogs,
} from '../lib/actions'
import { toast, useStore } from '../lib/store'
import { Stubs } from '../components/Portions'
import { Recommender } from '../components/Recommender'
import { RecipeView } from '../components/RecipeView'
import { Sheet } from '../components/Sheet'
import { Link } from '../components/Shell'
import { Icon } from '../components/Icon'

const TIP_KEY = 'cl_tip_seen'

export function Today() {
  const state = useStore((s) => s.state)!
  const ctx = useCtx(state)
  const today = todayISO()
  const slots = enabledSlots(state)
  const [pick, setPick] = useState<{ slot: Slot; replacing: boolean } | null>(null)
  const [view, setView] = useState<{ recipe: Recipe; servings: number } | null>(null)
  const [more, setMore] = useState<Slot | null>(null)
  const [other, setOther] = useState<Slot | null>(null)
  const [tipSeen, setTipSeen] = useState(() => {
    try {
      return localStorage.getItem(TIP_KEY) === '1'
    } catch {
      return true
    }
  })
  const byId = new Map(state.recipes.map((r) => [r.id, r]))
  const people = eaters(ctx)
  const totals = dayTotals(ctx, today)
  const anyKcal = state.recipes.some((r) => r.kcal)
  const me = state.members.find((m) => m.id === state.user.id)

  const eatenKcal = (userId: string) =>
    state.logs
      .filter((l) => l.date === today && l.userId === userId && l.status === 'eaten')
      .reduce((n, l) => n + l.kcal, 0)

  const hasLog = (slot: Slot) => state.logs.some((l) => l.date === today && l.slot === slot)
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const openSlots = SLOTS.filter((s) => slots.includes(s) && !hasLog(s))
  const nextSlot =
    openSlots.find((s) => minutesOf(state.household.settings.meals[s].time) + 90 >= nowMin) ??
    openSlots[0]

  function dismissTip() {
    setTipSeen(true)
    try {
      localStorage.setItem(TIP_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const moreEntry = more ? state.plan.find((e) => e.date === today && e.slot === more) : undefined
  const moreRecipe = moreEntry ? byId.get(moreEntry.recipeId) : undefined

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">{longDate(today)}</span>
          <h1>Hi {me?.name ?? state.user.name}</h1>
        </div>
        <button
          className="btn"
          onClick={() => {
            const r = autoPlan(ctx, [today], slots, false)
            if (r.reason) toast(r.reason)
          }}
        >
          <Icon name="dice" /> Choose my meals
        </button>
      </div>

      {!tipSeen && (
        <section className="card taped">
          <h2>How it works</h2>
          <ol className="steps-3">
            <li>Add calories to your dishes (we help you).</li>
            <li>
              Tap “Choose my meals”. We pick, and make each portion the right size for each of you.
            </li>
            <li>Cook it, eat it, then tap your ticket.</li>
          </ol>
          <button className="btn small" style={{ marginTop: 12 }} onClick={dismissTip}>
            Got it
          </button>
        </section>
      )}

      {people.length === 0 && (
        <p className="banner">
          Nobody has a calorie target yet, so portions cannot be sized.{' '}
          <Link to="/setup">Add your details</Link>.
        </p>
      )}
      {!anyKcal && (
        <div className="card taped stack tight">
          <h2>First, add calories to your dishes</h2>
          <p className="soft">
            We need them to make each portion the right size. It takes a minute or two for a few
            dishes.
          </p>
          <Link to="/recipes?fill=1" className="btn primary big-btn">
            Add calories
          </Link>
        </div>
      )}

      {people.length > 0 && (
        <section className="card" aria-label="Today so far">
          <div className="stack tight">
            {people.map((p, i) => {
              const t = totals.find((x) => x.userId === p.userId)
              const eaten = eatenKcal(p.userId)
              const bonus = bonusFor(state.train, p.userId, today)
              const target = p.targets!.kcal + bonus
              return (
                <div key={p.userId} className="stack tight">
                  <div className="row between">
                    <span className={`pill ${i % 2 ? 'b' : 'a'}`}>{p.name}</span>
                    <span className="small">
                      {eaten} eaten · {t?.planned ?? 0} planned · {target} goal
                      {bonus > 0 ? ` (includes +${bonus} for training)` : ''}
                    </span>
                  </div>
                  <div
                    className="meter"
                    role="progressbar"
                    aria-label={`${p.name}: ${eaten} of ${target} calories eaten`}
                    aria-valuemin={0}
                    aria-valuemax={target}
                    aria-valuenow={Math.min(eaten, target)}
                  >
                    <span
                      style={{
                        width: `${Math.min(100, (eaten / target) * 100)}%`,
                        background: i % 2 ? 'var(--person-b)' : 'var(--person-a)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="stack meal-grid">
        {SLOTS.filter((s) => slots.includes(s)).map((slot) => {
          const entry = state.plan.find((e) => e.date === today && e.slot === slot)
          const recipe = entry ? byId.get(entry.recipeId) : undefined
          const logs = state.logs.filter((l) => l.date === today && l.slot === slot)
          const eatenBy = new Set(logs.filter((l) => l.status === 'eaten').map((l) => l.userId))
          const allEaten = people.length > 0 && people.every((p) => eatenBy.has(p.userId))
          const anyEaten = eatenBy.size > 0
          const skipped = !anyEaten && logs.some((l) => l.status === 'skipped')
          const elsewhere = logs.find((l) => l.status === 'eaten' && l.recipeId === null)
          const time = state.household.settings.meals[slot].time
          const portions = recipe?.kcal
            ? people.map((p) => ({
                userId: p.userId,
                name: p.name,
                portion: portionFor(p.meals![slot], {
                  kcal: recipe.kcal!,
                  protein: recipe.protein,
                  carbs: recipe.carbs,
                  fat: recipe.fat,
                }),
              }))
            : []
          return (
            <section key={slot} className="card" aria-label={SLOT_LABEL[slot]}>
              <div className="card-head">
                <span className="label">
                  {SLOT_LABEL[slot]} · {time}
                </span>
                {slot === nextSlot && !anyEaten && <span className="pill ok">Next up</span>}
                {allEaten && <span className="stamp">Eaten</span>}
                {skipped && <span className="pill">Skipped</span>}
              </div>

              {elsewhere ? (
                <div className="stack tight">
                  <h2>{elsewhere.name}</h2>
                  <p className="small soft">
                    You had something different. {elsewhere.kcal} kcal each.
                  </p>
                  <button className="btn small" onClick={() => undoLogs(ctx, today, slot)}>
                    Undo
                  </button>
                </div>
              ) : entry && recipe ? (
                <div className="stack tight">
                  <h2>{recipe.name}</h2>
                  <p className="small soft">
                    {[
                      recipe.cookMinutes ? `${recipe.cookMinutes} min to cook` : null,
                      entry.leftover ? 'Leftovers' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {allergyUnverified(recipe, state.members) && (
                    <p className="pill warn" style={{ alignSelf: 'flex-start' }}>
                      Ingredients not listed: allergy check used the name only
                    </p>
                  )}
                  {!recipe.kcal && (
                    <p className="banner">
                      This dish has no calories yet.{' '}
                      <Link to={`/recipes/${recipe.id}`}>Add them</Link> to size portions.
                    </p>
                  )}
                  <Stubs
                    items={portions}
                    eaten={eatenBy}
                    onToggle={(uid) => toggleEaten(ctx, today, slot, recipe, uid)}
                  />
                  <div className="row wrap">
                    {!allEaten && (
                      <button
                        className="btn primary big-btn"
                        disabled={!recipe.kcal || people.length === 0}
                        onClick={() => markAllEaten(ctx, today, slot, recipe)}
                      >
                        <Icon name="check" /> We ate it
                      </button>
                    )}
                    <button
                      className="btn big-btn"
                      onClick={() =>
                        setView({ recipe, servings: entryServings(ctx, entry, recipe) })
                      }
                    >
                      How to cook it
                    </button>
                    <button className="btn big-btn" onClick={() => setMore(slot)}>
                      More
                    </button>
                  </div>
                </div>
              ) : (
                <div className="stack tight">
                  {skipped ? (
                    <>
                      <p className="soft">You skipped this one.</p>
                      <button className="btn" onClick={() => undoLogs(ctx, today, slot)}>
                        Undo skip
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="soft">Nothing chosen yet.</p>
                      <div className="row wrap">
                        <button
                          className="btn primary big-btn"
                          onClick={() => setPick({ slot, replacing: false })}
                        >
                          <Icon name="sparkle" /> What do you feel like?
                        </button>
                        <button
                          className="btn big-btn"
                          onClick={() => {
                            const r = autoPlan(ctx, [today], [slot], false)
                            if (r.reason) toast(r.reason)
                          }}
                        >
                          Pick for me
                        </button>
                        <button className="btn ghost" onClick={() => setOther(slot)}>
                          We ate something else
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {slots.length === 0 && (
        <div className="empty">
          <h3>No meals switched on</h3>
          <p className="soft">Choose which meals you cook for in Settings.</p>
          <Link to="/settings" className="btn">
            Open settings
          </Link>
        </div>
      )}

      {pick && (
        <Recommender
          open
          ctx={ctx}
          date={today}
          slot={pick.slot}
          replacing={pick.replacing}
          onClose={() => setPick(null)}
        />
      )}
      <RecipeView
        recipe={view?.recipe ?? null}
        servings={view?.servings ?? 0}
        onClose={() => setView(null)}
      />

      <Sheet open={more != null} onClose={() => setMore(null)} title={moreRecipe?.name ?? 'More'}>
        {more && moreEntry && moreRecipe && (
          <div className="stack tight">
            <button
              className="btn block big-btn"
              onClick={() => {
                setPick({ slot: more, replacing: true })
                setMore(null)
              }}
            >
              <Icon name="swap" /> Pick something else
            </button>
            <button
              className="btn block big-btn"
              onClick={() => {
                setOther(more)
                setMore(null)
              }}
            >
              We ate something else
            </button>
            <button
              className="btn block big-btn"
              onClick={() => {
                markSkipped(ctx, today, more)
                setMore(null)
              }}
            >
              Skip this meal
            </button>
            <button
              className="btn danger block big-btn"
              onClick={() => {
                removePlanned(ctx, moreEntry)
                setMore(null)
              }}
            >
              <Icon name="trash" /> Take it off the plan
            </button>
          </div>
        )}
      </Sheet>

      <SomethingElse
        key={other ?? 'none'}
        slot={other}
        onClose={() => setOther(null)}
        people={people.map((p) => ({ id: p.userId, name: p.name }))}
        onSave={(name, kcal, ids) => {
          if (other) logSomethingElse(ctx, today, other, name, kcal, ids)
          setOther(null)
        }}
      />
    </>
  )
}

function SomethingElse({
  slot,
  onClose,
  people,
  onSave,
}: {
  slot: Slot | null
  onClose: () => void
  people: { id: string; name: string }[]
  onSave: (name: string, kcal: number, ids: string[]) => void
}) {
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [who, setWho] = useState<string[] | null>(null)
  const chosen = who ?? people.map((p) => p.id)
  const k = Number(kcal)
  const valid = name.trim() !== '' && Number.isFinite(k) && k > 0 && k <= 5000 && chosen.length > 0
  return (
    <Sheet
      open={slot != null}
      onClose={onClose}
      title="What did you eat?"
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={!valid}
            onClick={() => onSave(name.trim().slice(0, 120), Math.round(k), chosen)}
          >
            Save
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="se-name">What was it?</label>
        <input
          id="se-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Takeaway pizza"
        />
      </div>
      <div className="field">
        <label htmlFor="se-kcal">Roughly how many calories?</label>
        <input
          id="se-kcal"
          className="input"
          inputMode="numeric"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          placeholder="600"
        />
        <span className="hint">A guess is fine.</span>
      </div>
      <div className="field">
        <span className="label-row" id="se-who">
          Who had it?
        </span>
        <div className="chips" role="group" aria-labelledby="se-who">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className="chip"
              aria-pressed={chosen.includes(p.id)}
              onClick={() =>
                setWho(chosen.includes(p.id) ? chosen.filter((x) => x !== p.id) : [...chosen, p.id])
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
