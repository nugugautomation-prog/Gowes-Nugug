import { useState } from 'react'
import type { Ride } from '../../db/types'
import { formatAngka } from '../../domain/angka'
import { formatDuration, toLocalDate } from '../../domain/ride'
import {
  lastWeeks,
  weekAvgSpeed,
  weeklyTargetKm,
  totalsForWeek,
  weekStart,
} from '../../domain/stats'
import { BarChart, type Bar } from '../../ui/BarChart'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { Stat } from '../../ui/Stat'

type Metric = 'jarak' | 'elevasi' | 'waktu'
const METRICS: { id: Metric; label: string }[] = [
  { id: 'jarak', label: 'Jarak' },
  { id: 'elevasi', label: 'Elevasi' },
  { id: 'waktu', label: 'Waktu' },
]

function labelOf(start: string): string {
  const [, m = '1', d = '1'] = start.split('-')
  return `${Number(d)}/${Number(m)}`
}

/** Metrik pekan ini + grafik 8 pekan (FR-020/021). Garis target hanya untuk Jarak (AC-006). */
export function WeeklyChart({
  rides,
  targetKm,
  now,
}: {
  rides: Ride[]
  targetKm: number
  now: Date
}) {
  const [metric, setMetric] = useState<Metric>('jarak')
  const today = toLocalDate(now)
  const weeks = lastWeeks(rides, today)
  const thisWeek = totalsForWeek(rides, weekStart(today))

  const bars: Bar[] = weeks.map((w) => {
    if (metric === 'jarak')
      return {
        label: labelOf(w.weekStart),
        value: w.distanceKm,
        valueText: `${formatAngka(w.distanceKm)} km`,
      }
    if (metric === 'elevasi')
      return {
        label: labelOf(w.weekStart),
        value: w.elevationM,
        valueText: `${formatAngka(w.elevationM, 0)} m`,
      }
    return {
      label: labelOf(w.weekStart),
      value: w.movingSec,
      valueText: formatDuration(w.movingSec),
    }
  })

  const weekly = weeklyTargetKm(targetKm, now.getFullYear(), now.getMonth() + 1)
  const targetLine =
    metric === 'jarak'
      ? { value: weekly, label: `Target mingguan ${formatAngka(weekly)} km` }
      : undefined

  return (
    <Card>
      <h2 className="font-semibold">Pekan ini</h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Stat value={formatAngka(thisWeek.distanceKm)} unit="km" label="Jarak" />
        <Stat value={formatDuration(thisWeek.movingSec)} label="Waktu bergerak" />
        <Stat value={formatAngka(thisWeek.elevationM, 0)} unit="m" label="Elevasi" />
        <Stat value={formatAngka(weekAvgSpeed(thisWeek))} unit="km/j" label="Kecepatan rata-rata" />
      </div>

      <h2 className="mt-4 font-semibold">8 pekan terakhir</h2>
      <div className="my-2 flex gap-2">
        {METRICS.map((m) => (
          <Chip key={m.id} selected={metric === m.id} onClick={() => setMetric(m.id)}>
            {m.label}
          </Chip>
        ))}
      </div>
      <BarChart
        title={`Grafik ${METRICS.find((m) => m.id === metric)?.label} per pekan`}
        bars={bars}
        targetLine={targetLine}
        emptyText="Belum ada data"
      />
    </Card>
  )
}
