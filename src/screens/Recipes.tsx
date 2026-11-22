import { useMemo, useState } from 'react'
import type { Recipe, Slot } from '../../shared/types'
import { SLOTS, SLOT_LABEL } from '../../shared/types'
import { commit, toast, useStore } from '../lib/store'
import { uid } from '../lib/ids'
import { blank } from '../lib/recipes'
import { sameItem } from '../../shared/logic/pantry'
import { Link } from '../components/Shell'
import { Sheet } from '../components/Sheet'
import { Icon } from '../components/Icon'
import { navigate, useLocation } from '../lib/router'

export function Recipes() {
  const state = useStore((s) => s.state)!
  const { params } = useLocation()
  const fill = params.get('fill') === '1'
  const [q, setQ] = useState('')
  const [slot, setSlot] = useState<Slot | null>(null)
  const [addMany, setAddMany] = useState(false)
  const [quick, setQuick] = useState(false)
  const [mine, setMine] = useState(false)

  const needing = state.recipes.filter((r) => !r.kcal).length
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return state.recipes
      .filter((r) => (fill ? !r.kcal : true))
      .filter((r) => (slot ? r.mealTypes.includes(slot) : true))
      .filter((r) => (quick ? r.cookMinutes != null && r.cookMinutes <= 30 : true))
      .filter((r) =>
        mine ? r.ingredients.some((i) => state.pantry.some((p) => sameItem(p.name, i.name))) : true,
      )
      .filter((r) =>
        t ? r.name.toLowerCase().includes(t) || r.tags.some((x) => x.includes(t)) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [state.recipes, state.pantry, q, slot, fill, quick, mine])

  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">{state.recipes.length} dishes</span>
          <h1>{fill ? 'Fill in calories' : 'Recipes'}</h1>
        </div>
        <div className="row">
          {fill ? (
            <Link to="/recipes" className="btn">
              Done
            </Link>
          ) : (
            <>
              <button className="btn" onClick={() => setAddMany(true)}>
                Add many
              </button>
              <Link to="/recipes/new" className="btn primary">
                <Icon name="plus" /> New dish
              </Link>
            </>
          )}
        </div>
      </div>

      {!fill && needing > 0 && (
        <div className="card taped row between wrap">
          <p className="grow">
            <strong>{needing}</strong> dish{needing === 1 ? '' : 'es'} need calories before we can
            plan with them.
          </p>
          <Link to="/recipes?fill=1" className="btn primary">
            Fill in calories
          </Link>
        </div>
      )}
      {fill && (
        <p className="soft">
          Type calories for one standard serving and press Enter or move on. They save as you go.
          Look on the packet, in your programme, or estimate.
        </p>
      )}

      <div className="stack tight">
        <div className="field">
          <label htmlFor="rq" className="sr-only">
            Search dishes
          </label>
          <input
            id="rq"
            className="input"
            type="search"
            placeholder="Search dishes or tags"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="chips" role="group" aria-label="Filter by meal">
          <button className="chip" aria-pressed={slot === null} onClick={() => setSlot(null)}>
            All
          </button>
          {SLOTS.map((s) => (
            <button
              key={s}
              className="chip"
              aria-pressed={slot === s}
              onClick={() => setSlot(slot === s ? null : s)}
            >
              {SLOT_LABEL[s]}
            </button>
          ))}
          <button className="chip" aria-pressed={quick} onClick={() => setQuick(!quick)}>
            Quick (30 min or less)
          </button>
          <button className="chip" aria-pressed={mine} onClick={() => setMine(!mine)}>
            Uses what I have
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h3>{fill ? 'Every dish has calories' : 'No dishes match'}</h3>
          <p className="soft">
            {fill ? 'You are ready to plan.' : 'Try a different search, or add a new dish.'}
          </p>
          {fill && (
            <Link to="/week" className="btn primary">
              Plan the week
            </Link>
          )}
        </div>
      ) : (
        <ul className="list card">
          {list.map((r) => (
            <li key={r.id}>{fill ? <FillRow recipe={r} /> : <Row recipe={r} />}</li>
          ))}
        </ul>
      )}
      <AddMany open={addMany} onClose={() => setAddMany(false)} />
    </>
  )
}

function Row({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="item-row"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <span className="grow">
        <strong>{recipe.name}</strong>
        <br />
        <span className="small soft">
          {recipe.mealTypes.map((m) => SLOT_LABEL[m]).join(', ') || 'No meal chosen'}
        </span>
      </span>
      {recipe.kcal ? (
        <span className="pill">{recipe.kcal} kcal</span>
      ) : (
        <span className="pill warn">Needs calories</span>
      )}
      <Icon name="chevron" />
    </Link>
  )
}

function FillRow({ recipe }: { recipe: Recipe }) {
  const [v, setV] = useState('')
  const [saved, setSaved] = useState(false)
  function save() {
    const n = Number(v)
    if (!v.trim()) return
    if (!Number.isFinite(n) || n < 1 || n > 5000) {
      toast('Enter calories between 1 and 5000.', { tone: 'error' })
      return
    }
    commit([
      { op: 'put', entity: 'recipes', id: recipe.id, body: { ...recipe, kcal: Math.round(n) } },
    ])
    setSaved(true)
  }
  if (saved) return null
  return (
    <div className="item-row">
      <label htmlFor={`k-${recipe.id}`} className="grow">
        <strong>{recipe.name}</strong>
      </label>
      <input
        id={`k-${recipe.id}`}
        className="input"
        style={{ width: 110 }}
        inputMode="numeric"
        placeholder="kcal"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          }
        }}
      />
    </div>
  )
}

function AddMany({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('')
  const [meals, setMeals] = useState<Slot[]>(['lunch', 'dinner'])
  const names = text
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 100)
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add many dishes"
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            disabled={names.length === 0 || meals.length === 0}
            onClick={() => {
              commit(
                names.map((n) => ({
                  op: 'put' as const,
                  entity: 'recipes' as const,
                  id: uid(),
                  body: blank(n.slice(0, 120), meals),
                })),
              )
              toast(`Added ${names.length} dish${names.length === 1 ? '' : 'es'}`)
              setText('')
              onClose()
              navigate('/recipes?fill=1')
            }}
          >
            Add {names.length || ''}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="many">One dish per line</label>
        <textarea
          id="many"
          className="textarea"
          style={{ minHeight: 160 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="field">
        <span className="label-row" id="many-m">
          Which meals are they for?
        </span>
        <div className="chips" role="group" aria-labelledby="many-m">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              aria-pressed={meals.includes(s)}
              onClick={() =>
                setMeals(meals.includes(s) ? meals.filter((x) => x !== s) : [...meals, s])
              }
            >
              {SLOT_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
