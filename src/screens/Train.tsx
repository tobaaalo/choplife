import { SPORTS, SPORT_LABEL } from '../../shared/train/types'
import type { Sport } from '../../shared/train/types'
import { Link } from '../components/Shell'
import { useLocation } from '../lib/router'
import { Gym } from './Gym'
import { SportView } from './SportView'
import { WorkoutEditor } from './WorkoutEditor'

export function Train() {
  const { path } = useLocation()
  const workout = /^\/train\/workout\/([^/]+)$/.exec(path)
  if (workout) return <WorkoutEditor id={workout[1]} />
  const sport = SPORTS.find((s) => path === `/train/${s}`) as Sport | undefined
  return (
    <>
      <div className="page-head">
        <div>
          <span className="label">Training</span>
          <h1>{sport ? SPORT_LABEL[sport] : 'Gym'}</h1>
        </div>
      </div>
      <nav className="chips" aria-label="Training sections">
        <Link to="/train" className="chip" aria-current={!sport ? 'page' : undefined}>
          Gym
        </Link>
        {SPORTS.map((s) => (
          <Link
            key={s}
            to={`/train/${s}`}
            className="chip"
            aria-current={sport === s ? 'page' : undefined}
          >
            {SPORT_LABEL[s]}
          </Link>
        ))}
      </nav>
      {sport ? <SportView sport={sport} /> : <Gym />}
    </>
  )
}
