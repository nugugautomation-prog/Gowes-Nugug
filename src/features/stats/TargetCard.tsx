import { useState } from 'react'
import { db } from '../../db/database'
import { setSetting } from '../../db/settings'
import { parseAngka } from '../../domain/angka'
import { QUICK_TARGETS, validateTarget } from '../../domain/stats'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { useToast } from '../../ui/Toast'

/** Target bulanan: 4 tombol cepat + angka bebas (FR-022). */
export function TargetCard({ targetKm }: { targetKm: number }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function save(km: number) {
    try {
      await setSetting(db, 'monthlyTargetKm', km)
      toast.show(`Target bulanan ${String(km).replace('.', ',')} km tersimpan ✓`)
    } catch {
      setError('Gagal menyimpan target. Coba lagi.')
    }
  }

  async function saveCustom(ev: React.FormEvent) {
    ev.preventDefault()
    const km = parseAngka(text)
    const msg = validateTarget(km)
    setError(msg)
    if (msg || km === null) return
    await save(km)
    setText('')
  }

  return (
    <Card>
      <h2 className="font-semibold">Target bulanan</h2>
      <p className="tabular text-2xl font-bold">
        {String(targetKm).replace('.', ',')}{' '}
        <span className="text-base font-normal text-muted">km</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_TARGETS.map((km) => (
          <Chip key={km} selected={targetKm === km} onClick={() => void save(km)}>
            {km}
          </Chip>
        ))}
      </div>
      <form onSubmit={saveCustom} noValidate className="mt-3 flex items-start gap-2">
        <div className="flex-1">
          <input
            aria-label="Target lain (km)"
            className="min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text tabular placeholder:text-muted"
            inputMode="decimal"
            placeholder="Target lain, mis. 130"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error ? (
            <span role="alert" className="mt-1 block text-sm text-danger">
              {error}
            </span>
          ) : null}
        </div>
        <Button type="submit" variant="secondary">
          Simpan
        </Button>
      </form>
    </Card>
  )
}
