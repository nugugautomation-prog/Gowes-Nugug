import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/database'
import { useSetting } from '../../db/useSetting'
import { formatAngka } from '../../domain/angka'
import { CONDITION_EMOJI, CONDITION_LABEL, formatDuration, toLocalDate } from '../../domain/ride'
import { addDays, weekStart } from '../../domain/stats'
import { weeklySummary, type SummaryData } from '../../domain/summary'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useNow } from '../../ui/useNow'
import { formatTanggal } from '../rides/RideList'

const NA = 'belum ada data'

function signed(n: number, digits = 1): string {
  const s = formatAngka(Math.abs(n), digits)
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular text-right">{value}</dd>
    </div>
  )
}

/** Semua data mentah untuk ringkasan; undefined = memuat. */
function useSummaryData(): SummaryData | undefined {
  const ideal = useSetting('idealWeightKg')
  const raw = useLiveQuery(async () => {
    const [rides, bodyLogs, checklistDays] = await Promise.all([
      db.rides.toArray(),
      db.body_logs.toArray(),
      db.checklist_days.toArray(),
    ])
    return { rides, bodyLogs, checklistDays }
  }, [])
  return raw ? { ...raw, idealWeightKg: ideal } : undefined
}

/** Ringkasan satu pekan (F-09) dengan pemilih pekan; minggu berjalan berlabel "baru N dari 7 hari". */
export function WeeklySummaryCard() {
  const today = toLocalDate(useNow())
  const currentStart = weekStart(today)
  const [start, setStart] = useState<string | null>(null)
  const data = useSummaryData()
  const shown = start ?? currentStart

  if (!data)
    return (
      <Card>
        <p className="text-muted" role="status">
          Memuat…
        </p>
      </Card>
    )

  const s = weeklySummary(data, shown, today)
  const isCurrent = shown === currentStart
  const c = s.comparison
  const unit = c.basis === 'perHari' ? 'km/hari' : 'km'

  return (
    <Card>
      <h2 className="font-semibold">Ringkasan pekan</h2>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          aria-label="Pekan sebelumnya"
          onClick={() => setStart(addDays(shown, -7))}
        >
          ‹
        </Button>
        <div className="text-center">
          <p className="tabular font-semibold">
            {formatTanggal(s.weekStart)} – {formatTanggal(s.weekEnd)}
          </p>
          {s.partial ? (
            <p className="text-sm text-muted">baru {s.daysElapsed} dari 7 hari</p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          aria-label="Pekan berikutnya"
          disabled={isCurrent}
          onClick={() => {
            const next = addDays(shown, 7)
            setStart(next >= currentStart ? null : next)
          }}
        >
          ›
        </Button>
      </div>

      {!s.hasData ? (
        <p className="mt-3 text-muted">Belum ada data di pekan ini.</p>
      ) : (
        <dl className="mt-3 divide-y divide-line">
          <Row label="Gowes" value={`${s.totals.count} kali`} />
          <Row label="Jarak" value={`${formatAngka(s.totals.distanceKm)} km`} />
          <Row label="Tanjakan" value={`${Math.round(s.totals.elevationM)} m`} />
          <Row label="Waktu bergerak" value={formatDuration(s.totals.movingSec)} />
          <Row
            label={
              c.basis === 'perHari' ? 'Dibanding pekan lalu (per hari)' : 'Dibanding pekan lalu'
            }
            value={c.hasPrevious ? `${signed(c.distanceDelta)} ${unit}` : NA}
          />
          <Row
            label="Rata-rata per gowes"
            value={c.perRideDelta !== null ? `${signed(c.perRideDelta)} km` : NA}
          />
          <Row
            label="Perubahan berat"
            value={s.weightChangeKg !== null ? `${signed(s.weightChangeKg)} kg` : NA}
          />
          <Row
            label="Jarak ke target berat"
            value={s.gapToIdealKg !== null ? `${signed(s.gapToIdealKg)} kg` : NA}
          />
          <Row
            label="Mood dominan"
            value={s.mood !== null ? `${CONDITION_EMOJI[s.mood]} ${CONDITION_LABEL[s.mood]}` : NA}
          />
          <Row
            label="Checklist"
            value={s.checklistPercent !== null ? `${Math.round(s.checklistPercent)}%` : NA}
          />
        </dl>
      )}
    </Card>
  )
}
