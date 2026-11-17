import { useState } from 'react'
import { useSetting } from '../../db/useSetting'
import { MAX_BACKUP_BYTES, parseBackup, type BackupData } from '../../domain/backup'
import { toLocalDate } from '../../domain/ride'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { Dialog } from '../../ui/Dialog'
import { PageHeader } from '../../ui/PageHeader'
import { useToast } from '../../ui/Toast'
import { downloadText } from '../diagnostics/checks'
import {
  ImportBlockedError,
  countsOf,
  currentCounts,
  exportBackup,
  importBackup,
  markBackedUp,
  recordingActive,
  type DataCounts,
} from './backupRepo'

function when(ms: number | null): string {
  return ms === null ? 'belum pernah' : toLocalDate(new Date(ms))
}

const line = (c: DataCounts) =>
  `${c.rides} gowes, ${c.reminders} pengingat, ${c.bodyLogs} catatan tubuh, ${c.trackPoints} titik GPS`

/** Cadangan JSON (F-13): ekspor, dan impor yang mengganti semua data setelah pratinjau + konfirmasi. */
export function BackupPage() {
  const toast = useToast()
  const lastBackupAt = useSetting('lastBackupAt')
  const lastImportAt = useSetting('lastImportAt')
  const [tracks, setTracks] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<{ data: BackupData; old: DataCounts } | null>(null)
  const [busy, setBusy] = useState(false)

  async function doExport() {
    setError(null)
    setBusy(true)
    try {
      const text = await exportBackup(tracks)
      const r = downloadText(
        `gowessehat-cadangan-${toLocalDate(new Date())}.json`,
        'application/json',
        text,
      )
      if (r.status === 'fail') return setError(`Gagal membuat file: ${r.detail}`)
      await markBackedUp()
      toast.show('Cadangan diunduh. Simpan file-nya di tempat aman ✓')
    } catch {
      setError('Gagal membuat cadangan. Data kamu tidak berubah.')
    } finally {
      setBusy(false)
    }
  }

  async function pick(file: File | undefined) {
    setError(null)
    if (!file) return
    if (await recordingActive())
      return setError('Selesaikan atau batalkan rekaman yang sedang berjalan dulu.')
    if (file.size > MAX_BACKUP_BYTES) return setError('File terlalu besar (maksimal 50 MB).')
    const r = parseBackup(await file.text())
    if (!r.ok) return setError(`${r.reason} Data lama tidak berubah.`)
    setPending({ data: r.data, old: await currentCounts() })
  }

  async function confirmImport() {
    if (!pending) return
    try {
      await importBackup(pending.data)
      setPending(null)
      toast.show('Data berhasil dipulihkan ✓')
    } catch (e) {
      setPending(null)
      setError(
        e instanceof ImportBlockedError
          ? `${e.message} Data lama tidak berubah.`
          : 'Impor gagal. Data lama tidak berubah.',
      )
    }
  }

  return (
    <>
      <PageHeader title="Cadangan" subtitle="Simpan dan pulihkan data" />
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold">Ekspor</h2>
          <p className="mt-1 text-muted">
            Cadangan terakhir: {when(lastBackupAt)}. Impor terakhir: {when(lastImportAt)}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip selected={tracks} onClick={() => setTracks(!tracks)}>
              Sertakan jejak GPS
            </Chip>
          </div>
          <Button className="mt-3 w-full" disabled={busy} onClick={() => void doExport()}>
            Ekspor JSON
          </Button>
        </Card>

        <Card>
          <h2 className="font-semibold">Impor</h2>
          <p className="mt-1 text-muted">
            Impor <strong>mengganti semua data</strong> di aplikasi ini dengan isi file.
          </p>
          <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line px-4 font-semibold">
            Pilih file cadangan
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Pilih file cadangan"
              onChange={(e) => {
                void pick(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </Card>

        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <Dialog
        open={pending !== null}
        danger
        title="Ganti semua data?"
        message={
          pending
            ? `Sekarang: ${line(pending.old)}. Dari file: ${line(countsOf(pending.data))}. Data sekarang akan hilang dan tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Ganti semua"
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmImport()}
      />
    </>
  )
}
