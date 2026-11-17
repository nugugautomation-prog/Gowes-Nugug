import { useRides } from '../rides/rideRepo'
import { balanceForMonth } from '../../domain/summary'
import { toLocalDate } from '../../domain/ride'
import { Card } from '../../ui/Card'
import { useNow } from '../../ui/useNow'

/** Keseimbangan hidup bulan ini: porsi jumlah gowes Me-time vs Bareng anak (BR-018, FR-092). */
export function BalanceCard() {
  const rides = useRides()
  const month = toLocalDate(useNow()).slice(0, 7)
  if (rides === undefined)
    return (
      <Card>
        <p className="text-muted" role="status">
          Memuat…
        </p>
      </Card>
    )
  const b = balanceForMonth(rides, month)
  return (
    <Card>
      <h2 className="font-semibold">Keseimbangan bulan ini</h2>
      {b.metimePercent === null || b.kidPercent === null ? (
        <p className="mt-1 text-muted">Belum ada gowes bulan ini.</p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`Me-time ${b.metimePercent} persen, Bareng anak ${b.kidPercent} persen`}
            className="mt-2 flex h-4 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full bg-brand" style={{ width: `${b.metimePercent}%` }} />
            <div className="h-full bg-accent" style={{ width: `${b.kidPercent}%` }} />
          </div>
          <div className="tabular mt-2 flex justify-between text-sm">
            <span>
              Me-time {b.metimePercent}% ({b.metime})
            </span>
            <span>
              Bareng anak {b.kidPercent}% ({b.kid})
            </span>
          </div>
        </>
      )}
    </Card>
  )
}
