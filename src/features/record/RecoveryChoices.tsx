import type { ActiveRecording } from '../../db/types'
import { formatAngka } from '../../domain/angka'
import { toLocalDate } from '../../domain/ride'
import { Button } from '../../ui/Button'
import { formatTanggal } from '../rides/RideList'

/** Pilihan untuk rekaman yang belum selesai (FR-139): Lanjutkan / Simpan / Buang. */
export function RecoveryChoices({
  rec,
  onResume,
  onSave,
  onDiscard,
}: {
  rec: ActiveRecording
  onResume: () => void
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div className="space-y-3">
      <p>
        Ada rekaman gowes {formatTanggal(toLocalDate(new Date(rec.startedAt)))} yang belum selesai:{' '}
        <span className="tabular font-semibold">{formatAngka(rec.distanceKm, 2)} km</span>. Titik
        yang sudah terekam aman.
      </p>
      <div className="flex flex-col gap-2">
        <Button onClick={onResume}>Lanjutkan</Button>
        <Button variant="secondary" onClick={onSave}>
          Simpan
        </Button>
        <Button variant="danger" onClick={onDiscard}>
          Buang
        </Button>
      </div>
    </div>
  )
}
