import { useState } from 'react'
import type { PlanEntry, Recipe, Slot } from '../../shared/types'
import { SLOTS, SLOT_LABEL } from '../../shared/types'
import { addDays, shortDay, startOfWeek, todayISO, weekDays } from '../../shared/logic/dates'
import { dayTotals, entryServings } from '../../shared/logic/engine'
import { enabledSlots, useCtx } from '../lib/derive'
import { autoPlan, removePlanned, toggleLock } from '../lib/actions'
import { toast, useStore } from '../lib/store'
import { Icon } from '../components/Icon'
import { Link } from '../components/Shell'
import { Recommender } from '../components/Recommender'
import { RecipeView } from '../components/RecipeView'
import { Sheet } from '../components/Sheet'

export function Week() {
  const state = useStore((s) => s.state)!
  const ctx = useCtx(state)
  const today = todayISO()
  const [start, setStart] = useState(startOfWeek(today))
  const days = weekDays(start)
  const slots = enabledSlots(state)
  const byId = new Map(state.recipes.map((r) => [r.id, r]))
  const [pick, setPick] = useState<{ date: string; slot: Slot; replacing: boolean } | null>(null)
  const [menu, setMenu] = useState<{ entry: PlanEntry; recipe: Recipe } | null>(null)
  const [view, setView] = useState<{ recipe: Recipe; servings: number } | null>(null)
  const anyKcal = state.recipes.some((r) => r.kcal)
  const futureDays = days.filter((d) => d >= today)
  const planned = state.plan.filter((e) => days.includes(e.date)).length

  function plan(replace: boolean) {
    const r = autoPlan(ctx, futureDays, slots, replace)
    if (r.reason) toast(r.reason)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">
            {shortDay(days[0])} to {shortDay(days[6])}
          </span>
          <h1>Your week</h1>
        </div>
        <div className="row">
          <button
            className="icon-btn"
            aria-label="Previous week"
            onClick={() => setStart(addDays(start, -7))}
          >
            <Icon name="back" />
          </button>
          <button
            className="btn small"
            onClick={() => setStart(startOfWeek(today))}
            disabled={start === startOfWeek(today)}
          >
            This week
          </button>
          <button
            className="icon-btn"
            aria-label="Next week"
            onClick={() => setStart(addDays(start, 7))}
          >
            <Icon name="chevron" />
          </button>
        </div>
      </div>

      {!anyKcal ? (
        <div className="empty">
          <h3>Add calories first</h3>
          <p className="soft">
            Planning needs calories on your dishes so portions fit each of you.
          </p>
          <Link to="/recipes?fill=1" className="btn primary">
            Fill in calories
          </Link>
        </div>
      ) : (
        <div className="row wrap">
          <button
            className="btn primary"
            disabled={futureDays.length === 0}
            onClick={() => plan(false)}
          >
            <Icon name="dice" /> Plan the week
          </button>
          {planned > 0 && (
            <button className="btn" onClick={() => plan(true)}>
              Reshuffle unlocked
            </button>
          )}
          <Link to="/list" className="btn">
            <Icon name="cart" /> Shopping list
          </Link>
        </div>
      )}

      <div className="stack">
        {days.map((d) => {
          const totals = dayTotals(ctx, d)
          return (
            <section key={d} className="card" aria-label={shortDay(d)}>
              <div className="card-head">
                <h3>
                  {shortDay(d)}
                  {d === today && (
                    <span className="pill ok" style={{ marginLeft: 8 }}>
                      Today
                    </span>
                  )}
                </h3>
                <div className="row">
                  {totals.map((t, i) =>
                    t.planned > 0 ? (
                      <span
                        key={t.userId}
                        className={`pill ${i % 2 ? 'b' : 'a'}`}
                        title={`${t.planned} of ${t.target} kcal planned`}
                      >
                        {ctx.people.find((x) => x.userId === t.userId)?.name.slice(0, 1)}:{' '}
                        {t.status === 'ok' ? 'On target' : t.status === 'under' ? 'Under' : 'Over'}
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
              <ul className="list">
                {SLOTS.filter((s) => slots.includes(s)).map((slot) => {
                  const entry = state.plan.find((e) => e.date === d && e.slot === slot)
                  const recipe = entry ? byId.get(entry.recipeId) : undefined
                  const eaten = state.logs.some(
                    (l) => l.date === d && l.slot === slot && l.status === 'eaten',
                  )
                  const open = () =>
                    entry && recipe
                      ? setMenu({ entry, recipe })
                      : setPick({ date: d, slot, replacing: false })
                  return (
                    <li key={slot}>
                      <button
                        type="button"
                        className="item-row"
                        style={{ width: '100%', background: 'none', border: 0, textAlign: 'left' }}
                        onClick={open}
                        aria-label={`${SLOT_LABEL[slot]} on ${shortDay(d)}: ${recipe ? recipe.name : 'nothing planned'}. ${recipe ? 'Open options' : 'Choose a meal'}`}
                      >
                        <span className="label" style={{ width: 84 }}>
                          {SLOT_LABEL[slot]}
                        </span>
                        <span className="grow">
                          {recipe ? recipe.name : <span className="soft">Add a meal</span>}
                        </span>
                        {entry?.leftover && <span className="pill">Leftovers</span>}
                        {entry?.locked && <Icon name="lock" />}
                        {eaten && <span className="pill ok">Eaten</span>}
                        {!recipe && <Icon name="plus" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {pick && (
        <Recommender
          open
          ctx={ctx}
          date={pick.date}
          slot={pick.slot}
          replacing={pick.replacing}
          onClose={() => setPick(null)}
        />
      )}
      <Sheet open={menu != null} onClose={() => setMenu(null)} title={menu?.recipe.name ?? ''}>
        {menu && (
          <div className="stack tight">
            <p className="small soft">
              {SLOT_LABEL[menu.entry.slot]} · {shortDay(menu.entry.date)}
            </p>
            <button
              className="btn block"
              onClick={() => {
                setView({
                  recipe: menu.recipe,
                  servings: entryServings(ctx, menu.entry, menu.recipe),
                })
                setMenu(null)
              }}
            >
              Cook view
            </button>
            <button
              className="btn block"
              onClick={() => {
                setPick({ date: menu.entry.date, slot: menu.entry.slot, replacing: true })
                setMenu(null)
              }}
            >
              <Icon name="swap" /> Swap for something else
            </button>
            <button
              className="btn block"
              aria-pressed={menu.entry.locked}
              onClick={() => {
                toggleLock(menu.entry)
                setMenu(null)
              }}
            >
              <Icon name={menu.entry.locked ? 'unlock' : 'lock'} />{' '}
              {menu.entry.locked ? 'Unlock' : 'Lock so reshuffle keeps it'}
            </button>
            <button
              className="btn danger block"
              onClick={() => {
                removePlanned(ctx, menu.entry)
                setMenu(null)
              }}
            >
              <Icon name="trash" /> Remove from plan
            </button>
          </div>
        )}
      </Sheet>
      <RecipeView
        recipe={view?.recipe ?? null}
        servings={view?.servings ?? 0}
        onClose={() => setView(null)}
      />
    </>
  )
}
