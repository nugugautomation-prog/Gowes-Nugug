import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { Dialog } from '../../ui/Dialog'
import { PageHeader } from '../../ui/PageHeader'
import { Sheet } from '../../ui/Sheet'
import { Stat } from '../../ui/Stat'
import { useToast } from '../../ui/Toast'

/** Halaman pengembang untuk memeriksa tampilan komponen di HP (360–420 px, gelap/terang). */
export function Galeri() {
  const toast = useToast()
  const [sheet, setSheet] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [jenis, setJenis] = useState<'metime' | 'anak'>('metime')

  return (
    <>
      <PageHeader
        title="Galeri komponen"
        action={
          <Link className="min-h-12 text-brand underline" to="/lainnya">
            Kembali
          </Link>
        }
      />
      <div className="space-y-4">
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Stat value="42,5" unit="km" label="Jarak" />
            <Stat value="1:35" label="Waktu" />
            <Stat value="18,2" unit="km/j" label="Rata-rata" />
          </div>
        </Card>
        <Card>
          <Stat size="xl" value="23,4" unit="km/j" label="Kecepatan (contoh layar rekam)" />
        </Card>
        <Card className="space-y-3">
          <div className="flex gap-2">
            <Chip selected={jenis === 'metime'} onClick={() => setJenis('metime')}>
              Me-time
            </Chip>
            <Chip selected={jenis === 'anak'} onClick={() => setJenis('anak')}>
              Bareng anak
            </Chip>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast.show('Gowes tersimpan ✓')}>Utama</Button>
            <Button variant="secondary" onClick={() => setSheet(true)}>
              Buka sheet
            </Button>
            <Button variant="danger" onClick={() => setDialog(true)}>
              Hapus…
            </Button>
          </div>
          <Button large className="w-full">
            Jeda (besar)
          </Button>
        </Card>
        <Card>
          <p className="font-semibold text-brand">✓ Siap gowes</p>
          <p className="font-semibold text-warn">~ Cukup santai saja hari ini</p>
          <p className="font-semibold text-danger">! Istirahat dulu</p>
          <p className="text-muted">– Belum ada data</p>
        </Card>
        <label className="block">
          <span className="text-sm text-muted">Contoh input (16 px, tidak auto-zoom)</span>
          <input
            inputMode="decimal"
            placeholder="0,0"
            className="mt-1 min-h-12 w-full rounded-xl border border-line bg-card px-3 text-text"
          />
        </label>
      </div>
      <Sheet open={sheet} title="Catat Gowes (contoh)" onClose={() => setSheet(false)}>
        <p className="mb-4 text-muted">Form akan tampil di sini.</p>
        <Button className="w-full" onClick={() => setSheet(false)}>
          Simpan
        </Button>
      </Sheet>
      <Dialog
        open={dialog}
        danger
        title="Hapus gowes?"
        message="Hapus gowes 12 Nov, 18 km? Tidak bisa dibatalkan."
        confirmLabel="Hapus"
        onConfirm={() => {
          setDialog(false)
          toast.show('Contoh: terhapus')
        }}
        onCancel={() => setDialog(false)}
      />
    </>
  )
}
