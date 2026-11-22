import type { ProgressPoint } from '../../shared/train/logic'

/** A tiny line chart. Plain SVG, no library. */
export function ProgressChart({ points, unit = 'kg' }: { points: ProgressPoint[]; unit?: string }) {
  if (points.length === 0) return <p className="soft small">No finished sets for this yet.</p>
  const W = 320
  const H = 110
  const pad = 22
  const vals = points.map((p) => p.e1rm)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const span = hi - lo || 1
  const x = (i: number) =>
    points.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (points.length - 1)
  const y = (v: number) => H - pad - ((v - lo) * (H - pad * 2)) / span
  const d = points
    .map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.e1rm).toFixed(1)}`)
    .join(' ')
  const first = points[0]
  const last = points[points.length - 1]
  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Estimated best lift went from ${first.e1rm} to ${last.e1rm} ${unit} over ${points.length} workouts`}
      >
        <path d={d} fill="none" stroke="var(--stamp)" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.date + i} cx={x(i)} cy={y(p.e1rm)} r="3" fill="var(--ink)" />
        ))}
        <text x={pad} y={12} fontSize="10" fill="var(--ink-soft)">
          {hi} {unit}
        </text>
        <text x={pad} y={H - 4} fontSize="10" fill="var(--ink-soft)">
          {lo} {unit}
        </text>
      </svg>
      <figcaption className="soft small">
        Estimated best lift: {first.e1rm} to {last.e1rm} {unit}. Latest best set: {last.best}.
      </figcaption>
    </figure>
  )
}
