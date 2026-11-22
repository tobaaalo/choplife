import type { Portion } from '../../shared/logic/portions'
import { formatMult } from '../../shared/logic/portions'

interface Item {
  userId: string
  name: string
  portion: Portion
}

interface Props {
  items: Item[]
  /** people who have already eaten this meal */
  eaten?: Set<string>
  onToggle?: (userId: string) => void
}

/** One ticket per person. With onToggle, each ticket is a button that ticks that person's meal. */
export function Stubs({ items, eaten, onToggle }: Props) {
  if (items.length === 0) return null
  return (
    <div className="stubs">
      {items.map((x, i) => {
        const done = eaten?.has(x.userId) ?? false
        const body = (
          <>
            <span className="who">{x.name}</span>
            <span className="amt">{formatMult(x.portion.mult)}</span>
            <span className="sub">
              {x.portion.kcal} kcal
              {x.portion.status !== 'ok'
                ? x.portion.status === 'under'
                  ? ' · a bit small'
                  : ' · a bit big'
                : ''}
            </span>
            {onToggle && <span className="tick">{done ? '✓ Ate it' : 'Tap if eaten'}</span>}
          </>
        )
        const cls = `stub ${i % 2 === 1 ? 'b' : ''} ${done ? 'done' : ''}`
        return onToggle ? (
          <button
            key={x.userId}
            type="button"
            className={cls}
            aria-pressed={done}
            onClick={() => onToggle(x.userId)}
          >
            {body}
          </button>
        ) : (
          <div key={x.userId} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}
