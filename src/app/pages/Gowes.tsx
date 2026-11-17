import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSetting } from '../../db/useSetting'
import { MonthProgressCard } from '../../features/stats/MonthProgressCard'
import { TargetCard } from '../../features/stats/TargetCard'
import { WeeklyChart } from '../../features/stats/WeeklyChart'
import { toLocalDate } from '../../domain/ride'
import type { Ride } from '../../db/types'
import { formatAngka } from '../../domain/angka'
import { RideForm } from '../../features/rides/RideForm'
import { RideList, formatTanggal } from '../../features/rides/RideList'
import {
  addManualRide,
  deleteRide,
  updateManualRide,
  useRides,
} from '../../features/rides/rideRepo'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { PageHeader } from '../../ui/PageHeader'
import { useToast } from '../../ui/Toast'

export function Gowes() {
  const rides = useRides()
  const toast = useToast()
  const location = useLocation()
  const targetKm = useSetting('monthlyTargetKm')
  const now = new Date()
  // Datang dari tombol Catat Gowes di Beranda: form langsung terbuka.
  const [formKey, setFormKey] = useState<number | null>(() =>
    (location.state as { catat?: boolean } | null)?.catat ? Date.now() : null,
  ) // null = tertutup
  const [editing, setEditing] = useState<Ride | undefined>()
  const [detail, setDetail] = useState<Ride | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<Ride | undefined>()

  const openNew = () => {
    setEditing(undefined)
    setFormKey(Date.now())
  }
  const openEdit = (r: Ride) => {
    setDetail(undefined)
    setEditing(r)
    setFormKey(Date.now())
  }
  const closeForm = () => setFormKey(null)

  return (
    <>
      <PageHeader
        title="Gowes"
        subtitle="Riwayat gowes"
        action={<Button onClick={openNew}>Catat Gowes</Button>}
      />
      {rides === undefined ? (
        <p className="text-muted" role="status">
          Memuat…
        </p>
      ) : (
        <div className="space-y-4">
          <WeeklyChart rides={rides} targetKm={targetKm} now={now} />
          <MonthProgressCard
            rides={rides}
            targetKm={targetKm}
            month={toLocalDate(now).slice(0, 7)}
          />
          <TargetCard targetKm={targetKm} />
          <h2 className="pt-2 text-lg font-semibold">Riwayat</h2>
          <RideList rides={rides} onSelect={setDetail} />
        </div>
      )}

      {formKey !== null ? (
        <RideForm
          key={formKey}
          open
          ride={editing}
          rides={rides ?? []}
          onClose={closeForm}
          onSave={async (data) => {
            if (editing) await updateManualRide(editing.id, data)
            else await addManualRide(data)
            closeForm()
            toast.show(editing ? 'Perubahan tersimpan ✓' : 'Gowes tersimpan ✓')
          }}
        />
      ) : null}

      {detail ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] rounded-t-3xl border border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="font-semibold">
            {formatTanggal(detail.date)} · {formatAngka(detail.distanceKm)} km
          </p>
          {detail.note ? <p className="mt-1 text-muted">{detail.note}</p> : null}
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setDetail(undefined)}>
              Tutup
            </Button>
            {detail.source === 'manual' ? (
              <Button variant="secondary" className="flex-1" onClick={() => openEdit(detail)}>
                Ubah
              </Button>
            ) : (
              <span className="flex-1 self-center text-sm text-muted">
                🔒 Angka rekaman dikunci
              </span>
            )}
            <Button variant="danger" onClick={() => setConfirmDelete(detail)}>
              Hapus
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={confirmDelete !== undefined}
        danger
        title="Hapus gowes?"
        message={
          confirmDelete
            ? `Hapus gowes ${formatTanggal(confirmDelete.date)}, ${formatAngka(confirmDelete.distanceKm)} km? Ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Hapus"
        onCancel={() => setConfirmDelete(undefined)}
        onConfirm={async () => {
          if (confirmDelete) await deleteRide(confirmDelete.id)
          setConfirmDelete(undefined)
          setDetail(undefined)
          toast.show('Gowes dihapus')
        }}
      />
    </>
  )
}
