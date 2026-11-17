import { useState } from 'react'
import type { BodyLog, Condition } from '../../db/types'
import { parseAngka } from '../../domain/angka'
import { validateBody, type BodyErrors } from '../../domain/body'
import { CONDITION_EMOJI, CONDITION_LABEL, toLocalDate } from '../../domain/ride'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { Field } from '../../ui/Field'
import { Sheet } from '../../ui/Sheet'
import { saveBodyLog } from './bodyRepo'

interface Props {
  /** Bila diisi: mode edit (tanggal tetap, isi menimpa seluruh catatan). */
  log?: BodyLog
  /** Catatan yang sudah ada, untuk memberi tahu bahwa tanggal baru akan digabung. */
  existingDates: string[]
  onClose: () => void
  onSaved: (edited: boolean) => void
  onDelete?: () => void
}

const inputCls =
  'min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text tabular placeholder:text-muted'

const show = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','))

/** Berat/pinggang dalam satu sheet; salah satu boleh dikosongkan (Design Brief bagian 11). */
export function BodyForm({ log, existingDates, onClose, onSaved, onDelete }: Props) {
  const today = toLocalDate(new Date())
  const [date, setDate] = useState(log?.date ?? today)
  const [weight, setWeight] = useState(show(log?.weightKg))
  const [waist, setWaist] = useState(show(log?.waistCm))
  const [mood, setMood] = useState<Condition | null>(log?.mood ?? null)
  const [errors, setErrors] = useState<BodyErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Kolom kosong = null; isi yang bukan angka = NaN agar ditolak (bukan dianggap kosong).
  const num = (s: string) => (s.trim() === '' ? null : (parseAngka(s) ?? Number.NaN))
  const compute = (): BodyErrors => {
    const w = num(weight)
    const c = num(waist)
    const e = validateBody(
      {
        date,
        weightKg: w !== null && Number.isNaN(w) ? -1 : w,
        waistCm: c !== null && Number.isNaN(c) ? -1 : c,
        mood,
      },
      today,
    )
    return e
  }

  const merging = !log && existingDates.includes(date)

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = compute()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    const w = num(weight)
    const c = num(waist)
    setSaving(true)
    setSaveError(null)
    try {
      await saveBodyLog(
        date,
        { weightKg: w ?? undefined, waistCm: c ?? undefined, mood: mood ?? undefined },
        log ? 'replace' : 'merge',
      )
      onSaved(Boolean(log))
    } catch {
      setSaveError('Gagal menyimpan. Isianmu masih ada, coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open title={log ? 'Ubah Catatan Tubuh' : 'Catat Tubuh'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Tanggal" error={errors.date}>
          <input
            type="date"
            className={inputCls}
            value={date}
            max={today}
            disabled={Boolean(log)}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Berat (kg)" error={errors.weightKg}>
          <input
            className={inputCls}
            inputMode="decimal"
            placeholder="mis. 78,5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
        <Field label="Lingkar pinggang (cm)" error={errors.waistCm}>
          <input
            className={inputCls}
            inputMode="decimal"
            placeholder="mis. 92"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
          />
        </Field>
        <fieldset>
          <legend className="mb-1 text-sm text-muted">Mood (opsional)</legend>
          <div className="flex gap-2">
            {([0, 1, 2] as Condition[]).map((m) => (
              <Chip
                key={m}
                selected={mood === m}
                aria-label={`Mood ${CONDITION_LABEL[m]}`}
                onClick={() => setMood(mood === m ? null : m)}
              >
                {CONDITION_EMOJI[m]}
              </Chip>
            ))}
          </div>
        </fieldset>

        {errors.any ? (
          <p role="alert" className="text-danger">
            {errors.any}
          </p>
        ) : null}
        {merging ? (
          <p role="status" className="rounded-xl border border-warn p-3 text-warn">
            Tanggal ini sudah ada catatan. Isian baru akan digabung, kolom yang kamu kosongkan tidak
            menghapus data lama.
          </p>
        ) : null}
        {saveError ? (
          <p role="alert" className="text-danger">
            {saveError}
          </p>
        ) : null}

        <div className="sticky bottom-0 -mx-4 flex gap-2 bg-card px-4 pt-2">
          {log && onDelete ? (
            <Button variant="danger" onClick={onDelete}>
              Hapus
            </Button>
          ) : null}
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
