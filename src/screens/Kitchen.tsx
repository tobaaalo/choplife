import { useState } from 'react'
import type { FormEvent } from 'react'
import { SLOTS, SLOT_LABEL } from '../../shared/types'
import type { Recipe } from '../../shared/types'
import { whatCanICook } from '../../shared/logic/pantry'
import { violations } from '../../shared/logic/rules'
import { todayISO } from '../../shared/logic/dates'
import { commit, toast, useStore } from '../lib/store'
import { uid } from '../lib/ids'
import { planMeal } from '../lib/actions'
import { enabledSlots } from '../lib/derive'
import { Icon } from '../components/Icon'
import { Link } from '../components/Shell'
import { Sheet } from '../components/Sheet'

const QUICK = [
  'Rice',
  'Beans',
  'Garri',
  'Yam',
  'Plantain',
  'Palm oil',
  'Vegetable oil',
  'Egusi',
  'Eggs',
  'Onions',
  'Tomatoes',
  'Pepper',
  'Pasta',
  'Bread',
  'Chicken',
  'Fish',
  'Milk',
]

export function Kitchen() {
  const state = useStore((s) => s.state)!
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [cook, setCook] = useState<Recipe | null>(null)
  const names = state.pantry.map((p) => p.name)
  const results = whatCanICook(state.recipes, names)
    .filter((x) => state.members.every((m) => violations(x.recipe, m.profile).length === 0))
    .slice(0, 8)
  const today = todayISO()
  const slots = enabledSlots(state)

  function add(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    if (state.pantry.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
      toast(`${n} is already in your kitchen`)
      return
    }
    const id = uid()
    commit([
      {
        op: 'put',
        entity: 'pantry',
        id,
        body: { id, name: n.slice(0, 80), quantity: qty.trim().slice(0, 40) },
      },
    ])
    setName('')
    setQty('')
  }

  function quickAdd(n: string) {
    if (state.pantry.some((p) => p.name.toLowerCase() === n.toLowerCase())) return
    const id = uid()
    commit([{ op: 'put', entity: 'pantry', id, body: { id, name: n, quantity: '' } }])
  }

  function remove(id: string) {
    const item = state.pantry.find((p) => p.id === id)
    if (!item) return
    commit([{ op: 'delete', entity: 'pantry', id }])
    toast(`${item.name} removed`, {
      undo: () => commit([{ op: 'put', entity: 'pantry', id, body: item }]),
    })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">What you have at home</span>
          <h1>Kitchen</h1>
        </div>
      </div>

      <section className="card stack tight" aria-label="Quick add">
        <span className="label">Tap to add</span>
        <div className="chips">
          {QUICK.map((n) => {
            const have = state.pantry.some((p) => p.name.toLowerCase() === n.toLowerCase())
            return (
              <button
                key={n}
                type="button"
                className="chip"
                aria-pressed={have}
                onClick={() => quickAdd(n)}
                disabled={have}
              >
                {have ? '✓ ' : '+ '}
                {n}
              </button>
            )
          })}
        </div>
      </section>

      <form className="card stack tight" onSubmit={add}>
        <div className="row wrap" style={{ alignItems: 'flex-end' }}>
          <div className="field grow" style={{ minWidth: 160 }}>
            <label htmlFor="pn">Add something</label>
            <input
              id="pn"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rice, palm oil, eggs…"
            />
          </div>
          <div className="field" style={{ width: 120 }}>
            <label htmlFor="pq">How much</label>
            <input
              id="pq"
              className="input"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="optional"
            />
          </div>
          <button className="btn primary" disabled={!name.trim()}>
            <Icon name="plus" /> Add
          </button>
        </div>
      </form>

      {state.pantry.length === 0 ? (
        <div className="empty">
          <h3>Your kitchen is empty</h3>
          <p className="soft">Add what you have and we will show what you can cook right now.</p>
        </div>
      ) : (
        <ul className="list card" aria-label="Kitchen items">
          {[...state.pantry]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
              <li key={p.id} className="item-row">
                <span className="grow">{p.name}</span>
                {p.quantity && <span className="small soft">{p.quantity}</span>}
                <button
                  className="icon-btn"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => remove(p.id)}
                >
                  <Icon name="x" />
                </button>
              </li>
            ))}
        </ul>
      )}

      <section className="stack">
        <h2>What can I cook now?</h2>
        {state.pantry.length === 0 ? (
          <p className="soft">Add a few items above first.</p>
        ) : results.length === 0 ? (
          <div className="empty">
            <p className="soft">
              Nothing matches yet. Dishes need ingredients listed to be matched.
            </p>
            <Link to="/recipes" className="btn">
              Add ingredients to dishes
            </Link>
          </div>
        ) : (
          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.map(({ recipe, match }) => (
              <li key={recipe.id} className="card stack tight">
                <div className="row between">
                  <h3>{recipe.name}</h3>
                  <span className={`pill ${match.missing.length === 0 ? 'ok' : 'warn'}`}>
                    {match.have.length} of {recipe.ingredients.length} at home
                  </span>
                </div>
                {match.missing.length > 0 && (
                  <p className="small soft">
                    Missing: {match.missing.map((m) => m.name).join(', ')}
                  </p>
                )}
                <div className="row wrap">
                  <button
                    className="btn primary small"
                    onClick={() => setCook(recipe)}
                    disabled={!recipe.kcal}
                  >
                    Cook this today
                  </button>
                  {!recipe.kcal && <span className="small soft">Add calories first</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet
        open={cook != null}
        onClose={() => setCook(null)}
        title={cook ? `Which meal is ${cook.name}?` : ''}
      >
        <div className="stack tight">
          {SLOTS.filter((s) => slots.includes(s)).map((s) => (
            <button
              key={s}
              className="btn block"
              onClick={() => {
                if (cook) {
                  planMeal(today, s, cook.id)
                  toast(`${cook.name} planned for ${SLOT_LABEL[s].toLowerCase()} today`)
                }
                setCook(null)
              }}
            >
              {SLOT_LABEL[s]}
              {state.plan.some((e) => e.date === today && e.slot === s)
                ? ' (replaces current)'
                : ''}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
