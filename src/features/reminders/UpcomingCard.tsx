import { Link } from 'react-router-dom'
import { addDays } from '../../domain/stats'
import { groupReminders, relativeDay } from '../../domain/reminders'
import { toLocalDate } from '../../domain/ride'
import { Card } from '../../ui/Card'
import { useNow } from '../../ui/useNow'
import { formatTanggal } from '../rides/RideList'
import { useReminders } from './remindersRepo'

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** Beranda: pengingat terdekat (7 hari ke depan) dan jumlah yang terlewat. */
export function UpcomingCard() {
  const now = useNow()
  const today = toLocalDate(now)
  const all = useReminders()
  if (all === undefined) return null
  if (all.length === 0)
    return (
      <Card>
        <h2 className="font-semibold">Pengingat</h2>
        <p className="mt-1 text-muted">Belum ada pengingat.</p>
        <Link
          to="/lainnya/pengingat"
          className="mt-1 inline-flex min-h-12 items-center text-brand underline"
        >
          Buat pengingat
        </Link>
      </Card>
    )
  const g = groupReminders(all, today, hhmm(now))
  const horizon = addDays(today, 7)
  const soon = g.upcoming.filter((u) => u.next.date <= horizon).slice(0, 3)
  return (
    <Card className={g.overdue.length > 0 ? 'border-warn' : ''}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">Pengingat</h2>
        <Link
          to="/lainnya/pengingat"
          className="inline-flex min-h-12 items-center text-brand underline"
        >
          Lihat semua
        </Link>
      </div>
      {g.overdue.length > 0 ? (
        <p role="status" className="text-warn">
          {g.overdue.length} pengingat terlewat
        </p>
      ) : null}
      {soon.length === 0 ? (
        <p className="text-muted">Tidak ada pengingat dalam 7 hari ke depan.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {soon.map(({ reminder: r, next }) => {
            const rel = relativeDay(next.date, today)
            const day =
              rel === 'hari_ini' ? 'Hari ini' : rel === 'besok' ? 'Besok' : formatTanggal(next.date)
            return (
              <li key={r.id} className="flex justify-between gap-3">
                <span>{r.title}</span>
                <span className="tabular text-muted">
                  {day} · {next.time}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
