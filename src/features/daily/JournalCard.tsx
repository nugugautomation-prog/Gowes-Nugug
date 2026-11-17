import { useState } from 'react'
import type { Sleep } from '../../db/types'
import { addDays } from '../../domain/stats'
import { parseAngka } from '../../domain/angka'
import { validateJournal, type JournalErrors } from '../../domain/readiness'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { useToast } from '../../ui/Toast'
import { saveJournal, useJournal } from './dailyRepo'

const SLEEP_LABEL: Record<Sleep, string> = { segar: 'Segar', cukup: 'Cukup', kurang: 'Kurang' }

function Stepper({
  label,
  value,
  onChange,
  step,
  unit,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step: number
  unit: string
  max?: number
}) {
  return (
    <div>
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          aria-label={`Kurangi ${label}`}
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - step))}
        >
          −
        </Button>
        <span className="tabular min-w-20 text-center text-xl font-bold" aria-live="polite">
          {value} <span className="text-base font-normal text-muted">{unit}</span>
        </span>
        <Button
          variant="secondary"
          aria-label={`Tambah ${label}`}
          disabled={max !== undefined && value + step > max}
          onClick={() => onChange(value + step)}
        >
          +
        </Button>
      </div>
    </div>
  )
}

/** Jurnal 30 detik: tiga pertanyaan tanpa mengetik; bisa untuk hari ini atau kemarin (FR-031). */
export function JournalCard({ today }: { today: string }) {
  const [day, setDay] = useState<'hari_ini' | 'kemarin'>('hari_ini')
  const date = day === 'hari_ini' ? today : addDays(today, -1)
  const saved = useJournal(date)

  return (
    <Card>
      <h2 className="font-semibold">Jurnal 30 detik</h2>
      <div className="my-2 flex gap-2">
        <Chip selected={day === 'hari_ini'} onClick={() => setDay('hari_ini')}>
          Hari ini
        </Chip>
        <Chip selected={day === 'kemarin'} onClick={() => setDay('kemarin')}>
          Kemarin
        </Chip>
      </div>
      {saved === undefined ? (
        <p className="text-muted" role="status">
          Memuat…
        </p>
      ) : (
        // key = tanggal + waktu simpan terakhir: form diisi ulang dari data tersimpan saat ganti hari.
        <JournalForm key={`${date}-${saved?.updatedAt ?? 0}`} date={date} saved={saved} />
      )}
    </Card>
  )
}

function JournalForm({
  date,
  saved,
}: {
  date: string
  saved: { sleep: Sleep; fruitPortions: number; kidMinutes: number } | null
}) {
  const toast = useToast()
  const [sleep, setSleep] = useState<Sleep | null>(saved?.sleep ?? null)
  const [fruit, setFruit] = useState(saved?.fruitPortions ?? 0)
  const [kid, setKid] = useState(String(saved?.kidMinutes ?? 0))
  const [errors, setErrors] = useState<JournalErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  async function submit() {
    // Kolom kosong dianggap 0; isi yang bukan angka → NaN agar ditolak validasi.
    const kidMinutes = kid.trim() === '' ? 0 : (parseAngka(kid) ?? Number.NaN)
    const e = validateJournal({ sleep, fruitPortions: fruit, kidMinutes })
    setErrors(e)
    if (Object.keys(e).length > 0 || !sleep) return
    try {
      setSaveError(null)
      await saveJournal(date, { sleep, fruitPortions: fruit, kidMinutes })
      toast.show('Jurnal tersimpan ✓')
    } catch {
      setSaveError('Gagal menyimpan. Isianmu masih ada, coba lagi.')
    }
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-1 text-sm text-muted">Tidur</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SLEEP_LABEL) as Sleep[]).map((s) => (
            <Chip key={s} selected={sleep === s} onClick={() => setSleep(s)}>
              {SLEEP_LABEL[s]}
            </Chip>
          ))}
        </div>
        {errors.sleep ? (
          <span role="alert" className="mt-1 block text-sm text-danger">
            {errors.sleep}
          </span>
        ) : null}
      </fieldset>
      <Stepper label="Buah serat" unit="porsi" value={fruit} step={1} onChange={setFruit} />
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Main bareng anak (menit)</span>
        <input
          className="min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text tabular placeholder:text-muted"
          inputMode="numeric"
          placeholder="mis. 20"
          value={kid}
          onChange={(e) => setKid(e.target.value)}
        />
        {errors.kidMinutes ? (
          <span role="alert" className="mt-1 block text-sm text-danger">
            {errors.kidMinutes}
          </span>
        ) : null}
      </label>
      {saveError ? (
        <p role="alert" className="text-danger">
          {saveError}
        </p>
      ) : null}
      <Button className="w-full" onClick={() => void submit()}>
        Simpan jurnal
      </Button>
    </div>
  )
}
