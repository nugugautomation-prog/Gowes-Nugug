import type { Ride } from '../../db/types'
import { formatAngka } from '../../domain/angka'
import { monthProgress } from '../../domain/stats'
import { Card } from '../../ui/Card'

/** Progres bulan berjalan (FR-024, BR-013). Angka asli tetap tampil walau > 100%. */
export function MonthProgressCard({
  rides,
  targetKm,
  month,
}: {
  rides: Ride[]
  targetKm: number
  month: string
}) {
  const p = monthProgress(rides, month, targetKm)
  const pct = Math.round(p.percent)
  return (
    <Card>
      <h2 className="font-semibold">Progres bulan ini</h2>
      <p className="tabular mt-1 text-2xl font-bold">
        {formatAngka(p.totalKm)}{' '}
        <span className="text-base font-normal text-muted">
          dari {formatAngka(p.targetKm, p.targetKm % 1 === 0 ? 0 : 1)} km ({pct}%)
        </span>
      </p>
      <div
        role="progressbar"
        aria-label="Progres target bulanan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p.barPercent)}
        aria-valuetext={`${pct} persen`}
        className="mt-2 h-3 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${p.barPercent}%` }} />
      </div>
      {p.percent >= 100 ? (
        <p className="mt-2 text-muted">Target bulan ini tercapai. Mantap!</p>
      ) : null}
    </Card>
  )
}
