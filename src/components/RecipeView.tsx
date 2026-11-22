import type { Recipe, Slot } from '../../shared/types'
import { AISLE_SHORT } from '../../shared/types'
import { formatAmount } from '../../shared/logic/shopping'
import { Sheet } from './Sheet'
import { Link } from './Shell'

interface Props {
  recipe: Recipe | null
  servings: number
  slot?: Slot
  onClose: () => void
}

/** Read-only cook view: ingredients scaled for what the household actually eats. */
export function RecipeView({ recipe, servings, onClose }: Props) {
  return (
    <Sheet open={recipe != null} onClose={onClose} title={recipe?.name ?? ''}>
      {recipe && (
        <>
          <p className="small soft">
            {[
              recipe.cookMinutes ? `${recipe.cookMinutes} min` : null,
              recipe.kcal ? `${recipe.kcal} kcal per serving` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {recipe.ingredients.length === 0 ? (
            <div className="empty">
              <p className="soft">No ingredients listed yet.</p>
              <Link to={`/recipes/${recipe.id}`} className="btn" onClick={onClose}>
                Add ingredients
              </Link>
            </div>
          ) : (
            <div className="stack tight">
              <span className="label">
                Ingredients{servings > 0 ? ` for ${Number(servings.toFixed(2))} servings` : ''}
              </span>
              <ul className="list">
                {recipe.ingredients.map((i, n) => (
                  <li key={n} className="item-row">
                    <span className="grow">{i.name}</span>
                    <span className="soft small">
                      {i.amount != null ? formatAmount(i.amount * (servings || 1), i.unit) : ''}
                    </span>
                    <span className="pill">{AISLE_SHORT[i.aisle]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recipe.steps && (
            <div className="stack tight">
              <span className="label">Method</span>
              <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.steps}</p>
            </div>
          )}
          {recipe.notes && <p className="small soft">{recipe.notes}</p>}
        </>
      )}
    </Sheet>
  )
}
