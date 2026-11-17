import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/database'
import type { Condition, Ride, RideCategory, RideType } from '../../db/types'
import { useSetting } from '../../db/useSetting'
import { formatAngka } from '../../domain/angka'
import { buildGpx, canTrim } from '../../domain/gpx'
import {
  CATEGORY_LABEL,
  CONDITION_EMOJI,
  CONDITION_LABEL,
  MAX_NOTE_LENGTH,
  TYPE_LABEL,
  avgSpeedKmh,
  formatDuration,
} from '../../domain/ride'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { Field } from '../../ui/Field'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/Toast'
import { downloadText } from '../diagnostics/checks'
import { TrackMap } from '../map/TrackMap'
import { formatTanggal } from './RideList'
import { updateRecordedMeta } from './rideRepo'

interface Props {
  ride: Ride
  onClose: () => void
  onDelete: () => void
}

/** Detail gowes rekaman: peta jejak, ekspor GPX, dan pengubahan metadata (angka dikunci, BR-009). */
export function RecordedRideDetail({ ride, onClose, onDelete }: Props) {
  const toast = useToast()
  const styleUrl = useSetting('mapStyleUrl')
  const points = useLiveQuery(
    async () => ({
      id: ride.id,
      rows: (await db.track_points.where('rideId').equals(ride.id).sortBy('seq')) ?? [],
    }),
    [ride.id],
  )
  const rows = points && points.id === ride.id ? points.rows : undefined
  const [category, setCategory] = useState<RideCategory>(ride.category)
  const [type, setType] = useState<RideType>(ride.type)
  const [condition, setCondition] = useState<Condition>(ride.condition)
  const [note, setNote] = useState(ride.note ?? '')
  const [trim, setTrim] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const noteTooLong = note.length > MAX_NOTE_LENGTH
  const trimmable = rows ? canTrim(rows) : false
  const shown = rows ?? []

  async function save() {
    if (noteTooLong) return
    setSaving(true)
    setError(null)
    try {
      await updateRecordedMeta(ride.id, { category, type, condition, note })
      toast.show('Perubahan tersimpan ✓')
      onClose()
    } catch {
      setError('Gagal menyimpan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  function exportGpx() {
    if (!rows) return
    const r = downloadText(
      `gowes-${ride.date}.gpx`,
      'application/gpx+xml',
      buildGpx(ride, rows, { trim: trim && trimmable, name: `Gowes ${ride.date}` }),
    )
    if (r.status === 'fail') setError(`Gagal membuat file GPX: ${r.detail}`)
    else toast.show('File GPX diunduh ✓')
  }

  return (
    <Sheet open title={`Gowes ${formatTanggal(ride.date)}`} onClose={onClose}>
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-3">
          <Info label="Jarak" value={`${formatAngka(ride.distanceKm, 2)} km`} />
          <Info label="Waktu bergerak" value={formatDuration(ride.movingSec)} />
          <Info
            label="Rata-rata"
            value={`${formatAngka(avgSpeedKmh(ride.distanceKm, ride.movingSec), 1)} km/j`}
          />
          <Info label="Tanjakan" value={`${Math.round(ride.elevationM)} m`} />
        </dl>
        <p className="text-sm text-muted">🔒 Jarak, waktu, dan tanjakan rekaman dikunci.</p>

        {rows === undefined ? (
          <p className="text-muted" role="status">
            Memuat jejak…
          </p>
        ) : shown.length > 0 ? (
          <TrackMap
            mode="fit"
            styleUrl={styleUrl}
            track={shown.map((p): [number, number] => [p.lon, p.lat])}
          />
        ) : (
          <p className="text-muted">Jejak GPS tidak tersimpan untuk gowes ini.</p>
        )}

        {shown.length > 0 ? (
          <div className="space-y-2">
            <h3 className="font-semibold">Ekspor ke Strava</h3>
            <Chip selected={trim && trimmable} disabled={!trimmable} onClick={() => setTrim(!trim)}>
              Potong 200 m awal dan akhir
            </Chip>
            {!trimmable ? (
              <p className="text-sm text-muted">
                Jejak kurang dari 400 m, jadi tidak ada yang bisa dipotong.
              </p>
            ) : (
              <p className="text-sm text-muted">
                Menyembunyikan lokasi rumah dan tujuanmu dari file yang kamu unggah.
              </p>
            )}
            <Button variant="secondary" className="w-full" onClick={exportGpx}>
              Ekspor GPX
            </Button>
            <p className="text-sm text-muted">
              Setelah diunduh, unggah file lewat situs web Strava (strava.com → Upload).
            </p>
          </div>
        ) : null}

        <fieldset>
          <legend className="mb-1 font-semibold">Kategori</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABEL) as RideCategory[]).map((c) => (
              <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-semibold">Jenis gowes</legend>
          <div className="flex gap-2">
            {(Object.keys(TYPE_LABEL) as RideType[]).map((t) => (
              <Chip key={t} selected={type === t} onClick={() => setType(t)}>
                {TYPE_LABEL[t]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-semibold">Kondisi badan</legend>
          <div className="flex gap-2">
            {([0, 1, 2] as Condition[]).map((c) => (
              <Chip
                key={c}
                selected={condition === c}
                aria-label={`Kondisi ${CONDITION_LABEL[c]}`}
                onClick={() => setCondition(c)}
              >
                {CONDITION_EMOJI[c]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field
          label="Catatan"
          error={noteTooLong ? `Maksimal ${MAX_NOTE_LENGTH} karakter` : undefined}
        >
          <textarea
            className="min-h-24 w-full rounded-xl border border-line bg-bg p-3 text-text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
        <div className="sticky bottom-0 -mx-4 flex gap-2 bg-card px-4 pt-2">
          <Button variant="danger" onClick={onDelete}>
            Hapus
          </Button>
          <Button className="flex-1" disabled={saving || noteTooLong} onClick={() => void save()}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tabular text-xl font-bold">{value}</dd>
    </div>
  )
}
