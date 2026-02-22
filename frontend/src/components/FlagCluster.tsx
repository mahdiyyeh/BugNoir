/**
 * Presentational only: a cluster of 4 stylized flags for start-page background.
 * Left: France, UK, Albania, Morocco. Right: USA, Romania, Spain, Bulgaria.
 */
import { StylizedWavingFlag, type Country } from './StylizedWavingFlag'

const LEFT_FLAGS: Country[] = ['France', 'UK', 'Albania', 'Morocco']
const RIGHT_FLAGS: Country[] = ['USA', 'Romania', 'Spain', 'Bulgaria']

const POSITION_CLASSES = {
  left: ['flag-pos-left-1', 'flag-pos-left-2', 'flag-pos-left-3', 'flag-pos-left-4'],
  right: ['flag-pos-right-1', 'flag-pos-right-2', 'flag-pos-right-3', 'flag-pos-right-4'],
}

const TIMING_CLASSES = [
  'flag-sway-1',
  'flag-sway-2',
  'flag-sway-3',
  'flag-sway-4',
]

export function FlagCluster({ side }: { side: 'left' | 'right' }) {
  const countries = side === 'left' ? LEFT_FLAGS : RIGHT_FLAGS
  const posClasses = POSITION_CLASSES[side]
  return (
    <div className={`flag-cluster flag-cluster-${side}`} aria-hidden>
      {countries.map((country, i) =>
        side === 'right' ? (
          <div key={country} className={`flag-right-wrap ${posClasses[i]}`}>
            <StylizedWavingFlag country={country} className={TIMING_CLASSES[i]} />
          </div>
        ) : (
          <StylizedWavingFlag
            key={country}
            country={country}
            className={`${posClasses[i]} ${TIMING_CLASSES[i]}`}
          />
        ),
      )}
    </div>
  )
}
