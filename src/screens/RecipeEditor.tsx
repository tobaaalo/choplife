import { useEffect, useRef, useState } from 'react'
import type { Aisle, Heat, Ingredient, Recipe, Slot } from '../../shared/types'
import { AISLES, AISLE_LABEL, SLOTS, SLOT_LABEL, UNITS } from '../../shared/types'
import { commit, toast, useStore } from '../lib/store'
import { navigate } from '../lib/router'
import { Link } from '../components/Shell'
import { SelectField, TextArea, TextField } from '../components/Field'
import { Icon } from '../components/Icon'
import { blank } from '../lib/recipes'

const numOrNull = (v: string): number | null =>
  v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v)

export function RecipeEditor({ id }: { id: string | null }) {
  const state = useStore((s) => s.state)!
  const existing = id ? state.recipes.find((r) => r.id === id) : undefined
  if (id && !existing) {
    return (
      <div className="empty">
        <h3>That dish is gone</h3>
        <Link to="/recipes" className="btn">
          Back to recipes
        </Link>
      </div>
    )
  }
  return (
    <Form
      key={existing?.id ?? 'new'}
      initial={existing ?? blank('', ['lunch', 'dinner'])}
      isNew={!existing}
    />
  )
}

function Form({ initial, isNew }: { initial: Recipe; isNew: boolean }) {
  const [r, setR] = useState<Recipe>(initial)
  const [tags, setTags] = useState(initial.tags.join(', '))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const nameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (isNew) nameRef.current?.focus()
  }, [isNew])
  const set = (patch: Partial<Recipe>) => setR((c) => ({ ...c, ...patch }))
  const setIng = (i: number, patch: Partial<Ingredient>) =>
    set({ ingredients: r.ingredients.map((x, n) => (n === i ? { ...x, ...patch } : x)) })

  function save() {
    const e: Record<string, string> = {}
    if (!r.name.trim()) e.name = 'Give the dish a name.'
    if (r.mealTypes.length === 0) e.meals = 'Choose at least one meal.'
    if (r.kcal != null && (r.kcal < 1 || r.kcal > 5000))
      e.kcal = 'Enter calories between 1 and 5000.'
    setErrors(e)
    if (Object.keys(e).length) return
    const clean: Recipe = {
      ...r,
      name: r.name.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      ingredients: r.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ ...i, name: i.name.trim() })),
    }
    commit([{ op: 'put', entity: 'recipes', id: clean.id, body: clean }])
    toast(isNew ? 'Dish added' : 'Dish saved')
    navigate('/recipes')
  }

  function remove() {
    commit([{ op: 'delete', entity: 'recipes', id: r.id }])
    toast(`${r.name} deleted`, {
      undo: () => commit([{ op: 'put', entity: 'recipes', id: r.id, body: initial }]),
    })
    navigate('/recipes')
  }

  return (
    <form
      className="stack"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className="page-head">
        <div className="row">
          <Link to="/recipes" className="icon-btn" aria-label="Back to recipes">
            <Icon name="back" />
          </Link>
          <h1>{isNew ? 'New dish' : 'Edit dish'}</h1>
        </div>
      </div>

      <TextField
        ref={nameRef}
        label="Name"
        value={r.name}
        onChange={(e) => set({ name: e.target.value })}
        error={errors.name}
      />

      <div className="field">
        <span className="label-row" id="meals-l">
          Meals
        </span>
        <div className="chips" role="group" aria-labelledby="meals-l">
          {SLOTS.map((s: Slot) => (
            <button
              key={s}
              type="button"
              className="chip"
              aria-pressed={r.mealTypes.includes(s)}
              onClick={() =>
                set({
                  mealTypes: r.mealTypes.includes(s)
                    ? r.mealTypes.filter((x) => x !== s)
                    : [...r.mealTypes, s],
                })
              }
            >
              {SLOT_LABEL[s]}
            </button>
          ))}
        </div>
        {errors.meals && <span className="err">{errors.meals}</span>}
      </div>

      <section className="card stack">
        <h2>Nutrition per serving</h2>
        <p className="hint">One standard serving. We scale it to each person’s meal target.</p>
        <div className="grid2">
          <TextField
            label="Calories (kcal)"
            inputMode="numeric"
            value={r.kcal ?? ''}
            onChange={(e) => set({ kcal: numOrNull(e.target.value) })}
            error={errors.kcal}
          />
          <TextField
            label="Protein (g)"
            inputMode="numeric"
            value={r.protein ?? ''}
            onChange={(e) => set({ protein: numOrNull(e.target.value) })}
          />
          <TextField
            label="Carbs (g)"
            inputMode="numeric"
            value={r.carbs ?? ''}
            onChange={(e) => set({ carbs: numOrNull(e.target.value) })}
          />
          <TextField
            label="Fat (g)"
            inputMode="numeric"
            value={r.fat ?? ''}
            onChange={(e) => set({ fat: numOrNull(e.target.value) })}
          />
        </div>
      </section>

      <div className="grid2">
        <TextField
          label="Cook time (minutes)"
          inputMode="numeric"
          value={r.cookMinutes ?? ''}
          onChange={(e) => set({ cookMinutes: numOrNull(e.target.value) })}
        />
        <SelectField
          label="Heat"
          value={r.heat ?? ''}
          onChange={(e) => set({ heat: (e.target.value || null) as Heat | null })}
        >
          <option value="">Not set</option>
          <option value="mild">Mild</option>
          <option value="medium">Medium</option>
          <option value="hot">Hot</option>
        </SelectField>
      </div>
      <TextField
        label="Tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        hint="Separate with commas, like rice, soup, quick."
      />
      <label className="check">
        <input
          type="checkbox"
          checked={r.makesExtra}
          onChange={(e) => set({ makesExtra: e.target.checked })}
        />
        Makes enough extra for tomorrow’s lunch
      </label>

      <section className="stack">
        <h2>Ingredients</h2>
        <p className="hint">
          Amounts for one standard serving. These feed the shopping list and the allergy check.
        </p>
        {r.ingredients.map((i, n) => (
          <div key={n} className="card flat stack tight">
            <TextField
              label={`Ingredient ${n + 1}`}
              value={i.name}
              onChange={(e) => setIng(n, { name: e.target.value })}
            />
            <div className="grid2">
              <TextField
                label="Amount"
                inputMode="decimal"
                value={i.amount ?? ''}
                onChange={(e) => setIng(n, { amount: numOrNull(e.target.value) })}
              />
              <SelectField
                label="Unit"
                value={i.unit}
                onChange={(e) => setIng(n, { unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u || 'each'}
                  </option>
                ))}
              </SelectField>
            </div>
            <SelectField
              label="Aisle"
              value={i.aisle}
              onChange={(e) => setIng(n, { aisle: e.target.value as Aisle })}
            >
              {AISLES.map((a) => (
                <option key={a} value={a}>
                  {AISLE_LABEL[a]}
                </option>
              ))}
            </SelectField>
            <button
              type="button"
              className="btn ghost small"
              onClick={() => set({ ingredients: r.ingredients.filter((_, k) => k !== n) })}
            >
              <Icon name="trash" /> Remove ingredient
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn"
          onClick={() =>
            set({
              ingredients: [
                ...r.ingredients,
                { name: '', amount: null, unit: 'g', aisle: 'other' },
              ],
            })
          }
        >
          <Icon name="plus" /> Add ingredient
        </button>
      </section>

      <TextArea label="Method" value={r.steps} onChange={(e) => set({ steps: e.target.value })} />
      <TextArea label="Notes" value={r.notes} onChange={(e) => set({ notes: e.target.value })} />

      <div className="row wrap between">
        {!isNew ? (
          <button type="button" className="btn danger" onClick={remove}>
            <Icon name="trash" /> Delete dish
          </button>
        ) : (
          <span />
        )}
        <div className="row">
          <Link to="/recipes" className="btn">
            Cancel
          </Link>
          <button className="btn primary">Save dish</button>
        </div>
      </div>
    </form>
  )
}
