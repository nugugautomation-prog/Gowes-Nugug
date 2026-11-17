import { formatAngka } from '../../domain/angka'
import {
  CATEGORY_LABEL,
  CONDITION_EMOJI,
  TYPE_LABEL,
  avgSpeedKmh,
  formatDuration,
} from '../../domain/ride'
import type { Ride } from '../../db/types'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/PageHeader'

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatTanggal(date: string): string {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return `${d} ${BULAN[m - 1] ?? ''} ${y}`
}

export function RideList({ rides, onSelect }: { rides: Ride[]; onSelect: (ride: Ride) => void }) {
  if (rides.length === 0) {
    return (
      <EmptyState title="Belum ada gowes" hint="Ketuk Catat Gowes untuk menambah yang pertama." />
    )
  }
  return (
    <ul className="space-y-2">
      {rides.map((r) => (
        <li key={r.id}>
          <Card className="p-0">
            <button
              type="button"
              className="min-h-12 w-full p-4 text-left"
              onClick={() => onSelect(r)}
              aria-label={`Gowes ${formatTanggal(r.date)}, ${formatAngka(r.distanceKm)} km`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="tabular text-xl font-bold">
                  {formatAngka(r.distanceKm)}{' '}
                  <span className="text-base font-normal text-muted">km</span>
                </span>
                <span className="text-muted">{formatTanggal(r.date)}</span>
              </div>
              <div className="mt-1 text-sm text-muted">
                {formatDuration(r.movingSec)} ·{' '}
                {formatAngka(avgSpeedKmh(r.distanceKm, r.movingSec))} km/j ·{' '}
                {formatAngka(r.elevationM, 0)} m
              </div>
              <div className="mt-1 text-sm">
                {CONDITION_EMOJI[r.condition]} {TYPE_LABEL[r.type]} · {CATEGORY_LABEL[r.category]}
                {r.source === 'recorded' ? ' · 🔒 rekaman' : ''}
              </div>
            </button>
          </Card>
        </li>
      ))}
    </ul>
  )
}
