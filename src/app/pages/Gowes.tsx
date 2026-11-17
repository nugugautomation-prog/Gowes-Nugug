import { useState } from 'react'
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
  const [formKey, setFormKey] = useState<number | null>(null) // null = tertutup
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
        <RideList rides={rides} onSelect={setDetail} />
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
