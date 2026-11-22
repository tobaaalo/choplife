import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AISLES, AISLE_LABEL } from '../../shared/types'
import type { Aisle } from '../../shared/types'
import { addDays, startOfWeek, todayISO } from '../../shared/logic/dates'
import { entryServings } from '../../shared/logic/engine'
import { buildShoppingList, formatAmount } from '../../shared/logic/shopping'
import type { ShoppingLine } from '../../shared/logic/shopping'
import { sameItem } from '../../shared/logic/pantry'
import { useCtx } from '../lib/derive'
import { commit, toast, useStore } from '../lib/store'
import { uid } from '../lib/ids'
import { Link } from '../components/Shell'
import { Icon } from '../components/Icon'

type RangeId = 'today' | 'three' | 'week' | 'next'
const RANGES: { id: RangeId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'three', label: 'Next 3 days' },
  { id: 'week', label: 'Rest of week' },
  { id: 'next', label: 'Next week' },
]

function range(id: RangeId, today: string): [string, string] {
  if (id === 'today') return [today, today]
  if (id === 'three') return [today, addDays(today, 2)]
  const mon = startOfWeek(today)
  if (id === 'week') return [today, addDays(mon, 6)]
  return [addDays(mon, 7), addDays(mon, 13)]
}

export function List() {
  const state = useStore((s) => s.state)!
  const ctx = useCtx(state)
  const today = todayISO()
  const [rid, setRid] = useState<RangeId>('week')
  const [name, setName] = useState('')
  const [aisle, setAisle] = useState<Aisle>('other')
  const [from, to] = range(rid, today)

  const lines = useMemo(() => {
    const entries = state.plan.filter((e) => e.date >= from && e.date <= to)
    const logged = new Set(
      state.logs.filter((l) => l.status === 'eaten').map((l) => `${l.date}|${l.slot}`),
    )
    const open = entries.filter((e) => !logged.has(`${e.date}|${e.slot}`))
    return buildShoppingList(open, state.recipes, state.pantry, state.manual, (e, r) =>
      entryServings(ctx, e, r),
    )
  }, [state, ctx, from, to])

  const need = lines.filter((l) => !l.inPantry)
  const have = lines.filter((l) => l.inPantry)
  const byAisle = AISLES.map((a) => ({
    aisle: a,
    items: need.filter((l) => l.aisle === a),
  })).filter((g) => g.items.length)

  function addManual(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    const id = uid()
    commit([
      {
        op: 'put',
        entity: 'manual',
        id,
        body: { id, name: n.slice(0, 80), aisle, amount: '' },
      },
    ])
    setName('')
  }

  function bought(l: ShoppingLine) {
    const ops = [] as Parameters<typeof commit>[0]
    const pid = uid()
    ops.push({
      op: 'put',
      entity: 'pantry',
      id: pid,
      body: { id: pid, name: l.name, quantity: '' },
    })
    if (l.manualId) ops.push({ op: 'delete', entity: 'manual', id: l.manualId })
    commit(ops)
    toast(`${l.name} is in your kitchen`)
  }

  function notBought(l: ShoppingLine) {
    const found = state.pantry.filter((p) => sameItem(p.name, l.name))
    commit(found.map((p) => ({ op: 'delete' as const, entity: 'pantry' as const, id: p.id })))
  }

  const inRange = state.plan.filter((e) => e.date >= from && e.date <= to)
  async function shareList() {
    const text = [
      'Shopping list',
      ...byAisle.flatMap((g) => [
        '',
        AISLE_LABEL[g.aisle],
        ...g.items.map(
          (l) => `- ${l.name}${l.amount != null ? ` (${formatAmount(l.amount, l.unit)})` : ''}`,
        ),
      ]),
    ].join('\n')
    try {
      if (navigator.share) await navigator.share({ title: 'Shopping list', text })
      else {
        await navigator.clipboard.writeText(text)
        toast('List copied. Paste it into WhatsApp or a note.')
      }
    } catch {
      /* cancelled */
    }
  }

  const noPlan = inRange.length === 0
  const plannedWithIngredients = inRange.some(
    (e) => (state.recipes.find((r) => r.id === e.recipeId)?.ingredients.length ?? 0) > 0,
  )

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">Quantities cover both of you</span>
          <h1>Shopping list</h1>
        </div>
      </div>

      {need.length > 0 && (
        <button className="btn" onClick={shareList}>
          <Icon name="share" /> Share or copy the list
        </button>
      )}

      <div className="chips" role="group" aria-label="Which days">
        {RANGES.map((r) => (
          <button
            key={r.id}
            className="chip"
            aria-pressed={rid === r.id}
            onClick={() => setRid(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {noPlan && state.manual.length === 0 && (
        <div className="empty">
          <h3>Nothing planned for these days</h3>
          <p className="soft">Plan some meals and the ingredients will appear here.</p>
          <Link to="/week" className="btn primary">
            Plan the week
          </Link>
        </div>
      )}

      {byAisle.map((g) => (
        <section key={g.aisle} className="card" aria-label={AISLE_LABEL[g.aisle]}>
          <div className="card-head">
            <h3>{AISLE_LABEL[g.aisle]}</h3>
          </div>
          <ul className="list">
            {g.items.map((l) => (
              <li key={l.key} className="item-row">
                <label className="check grow">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => bought(l)}
                    aria-label={`Got ${l.name}`}
                  />
                  <span>
                    {l.name}
                    {l.forDishes.length > 0 && (
                      <span className="small soft"> · {l.forDishes.join(', ')}</span>
                    )}
                  </span>
                </label>
                <span className="small">{formatAmount(l.amount, l.unit)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!noPlan && need.length === 0 && (
        <div className="empty">
          <h3>{plannedWithIngredients ? 'You have everything' : 'No ingredients to list yet'}</h3>
          <p className="soft">
            {plannedWithIngredients
              ? 'Everything for these days is already in your kitchen.'
              : 'The planned dishes have no ingredients listed. Add ingredients to a dish and the shopping list fills itself in.'}
          </p>
          {!plannedWithIngredients && (
            <Link to="/recipes" className="btn">
              Open recipes
            </Link>
          )}
        </div>
      )}

      <form className="card stack tight" onSubmit={addManual}>
        <h3>Add something else</h3>
        <div className="row wrap" style={{ alignItems: 'flex-end' }}>
          <div className="field grow" style={{ minWidth: 160 }}>
            <label htmlFor="mn">Item</label>
            <input
              id="mn"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ma">Aisle</label>
            <select
              id="ma"
              className="select"
              value={aisle}
              onChange={(e) => setAisle(e.target.value as Aisle)}
            >
              {AISLES.map((a) => (
                <option key={a} value={a}>
                  {AISLE_LABEL[a]}
                </option>
              ))}
            </select>
          </div>
          <button className="btn primary" disabled={!name.trim()}>
            <Icon name="plus" /> Add
          </button>
        </div>
      </form>

      {have.length > 0 && (
        <details className="card">
          <summary
            style={{
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Already at home ({have.length})
          </summary>
          <ul className="list">
            {have.map((l) => (
              <li key={l.key} className="item-row">
                <label className="check grow">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => notBought(l)}
                    aria-label={`${l.name} is at home. Untick to add back to the list`}
                  />
                  <span>{l.name}</span>
                </label>
                <span className="small soft">{formatAmount(l.amount, l.unit)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
