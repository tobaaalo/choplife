import { useMemo, useState } from 'react'
import type { Slot } from '../../shared/types'
import { SLOT_LABEL } from '../../shared/types'
import { MOODS } from '../../shared/logic/moods'
import type { MoodId } from '../../shared/logic/moods'
import { recommend } from '../../shared/logic/engine'
import type { RankCtx } from '../../shared/logic/engine'
import { hideForTwoWeeks, planMeal, setFeedback } from '../lib/actions'
import { allergyUnverified } from '../lib/derive'
import { Sheet } from './Sheet'
import { Stubs } from './Portions'
import { Icon } from './Icon'
import { Link } from './Shell'

interface Props {
  open: boolean
  onClose: () => void
  ctx: RankCtx
  date: string
  slot: Slot
  /** the meal being replaced, so it does not count as a repeat */
  replacing?: boolean
}

export function Recommender({ open, onClose, ctx, date, slot, replacing }: Props) {
  const [moods, setMoods] = useState<MoodId[]>([])
  const [hint, setHint] = useState('')
  const [shown, setShown] = useState(5)

  const anyKcal = ctx.recipes.some((r) => r.kcal)
  const recs = useMemo(
    () =>
      open
        ? recommend(
            ctx,
            { slot, date, moods, hint, replacing: replacing ? { date, slot } : undefined },
            60,
          )
        : [],
    [open, ctx, slot, date, moods, hint, replacing],
  )

  const toggle = (id: MoodId) => {
    setShown(5)
    setMoods((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))
  }

  return (
    <Sheet open={open} onClose={onClose} title={`${SLOT_LABEL[slot]}: what do you feel like?`}>
      <div className="chips" role="group" aria-label="Moods">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="chip"
            aria-pressed={moods.includes(m.id)}
            onClick={() => toggle(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="rec-hint">Or tell us in your own words</label>
        <input
          id="rec-hint"
          className="input"
          value={hint}
          placeholder="Something with plantain, not too heavy, no fish"
          onChange={(e) => {
            setShown(5)
            setHint(e.target.value)
          }}
        />
      </div>

      {!anyKcal ? (
        <div className="empty">
          <h3>No dishes have calories yet</h3>
          <p className="soft">
            We can only size portions for dishes with calories. Fill in a few and suggestions will
            appear here.
          </p>
          <Link to="/recipes?fill=1" className="btn primary" onClick={onClose}>
            Fill in calories
          </Link>
        </div>
      ) : recs.length === 0 ? (
        <div className="empty">
          <h3>Nothing fits that</h3>
          <p className="soft">
            Try fewer moods, or clear the box. Allergies and dishes you hid are always left out.
          </p>
        </div>
      ) : (
        <ul className="list" aria-live="polite">
          {recs.slice(0, shown).map((r) => (
            <li key={r.recipe.id} style={{ padding: '12px 0' }} className="stack tight">
              <div className="row between">
                <h3>{r.recipe.name}</h3>
                {!r.exact && moods.length + (hint.trim() ? 1 : 0) > 0 && (
                  <span className="pill warn">Close match</span>
                )}
              </div>
              <p className="small soft">{r.reasons.join(' · ')}</p>
              {allergyUnverified(r.recipe, ctx.people) && (
                <p className="pill warn" style={{ alignSelf: 'flex-start' }}>
                  Ingredients not listed: allergy check used the name only
                </p>
              )}
              <Stubs items={r.portions} />
              <div className="row wrap">
                <button
                  className="btn primary small"
                  onClick={() => {
                    planMeal(date, slot, r.recipe.id)
                    onClose()
                  }}
                >
                  Cook this
                </button>
                <button className="btn small" onClick={() => hideForTwoWeeks(ctx, r.recipe)}>
                  <Icon name="eyeoff" /> Not this
                </button>
                <button
                  className="btn small"
                  aria-pressed={ctx.feedback.some((f) => f.recipeId === r.recipe.id && f.loved)}
                  onClick={() =>
                    setFeedback(ctx, r.recipe.id, {
                      loved: !ctx.feedback.some((f) => f.recipeId === r.recipe.id && f.loved),
                    })
                  }
                >
                  <Icon name="heart" /> Love it
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {recs.length > shown && (
        <button className="btn block" onClick={() => setShown(shown + 5)}>
          Show more
        </button>
      )}
    </Sheet>
  )
}
