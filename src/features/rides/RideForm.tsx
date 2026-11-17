import { useState } from 'react'
import { parseAngka } from '../../domain/angka'
import {
  CATEGORY_LABEL,
  CONDITION_EMOJI,
  CONDITION_LABEL,
  MAX_NOTE_LENGTH,
  TYPE_LABEL,
  categoryFor,
  findDuplicate,
  isSpeedSuspicious,
  toLocalDate,
  toMovingSec,
  validateRide,
  type RideErrors,
} from '../../domain/ride'
import type { Condition, Ride, RideCategory, RideType } from '../../db/types'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { Field } from '../../ui/Field'
import { Sheet } from '../../ui/Sheet'
import type { ManualRideData } from './rideRepo'

interface Props {
  open: boolean
  /** Bila diisi: mode edit. */
  ride?: Ride
  /** Semua gowes yang ada, untuk peringatan duplikat. */
  rides: Ride[]
  onClose: () => void
  onSave: (data: ManualRideData) => Promise<void>
}

const inputCls =
  'min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text tabular placeholder:text-muted'

function initial(ride: Ride | undefined, today: string) {
  if (ride) {
    const h = Math.floor(ride.movingSec / 3600)
    const m = Math.round((ride.movingSec % 3600) / 60)
    return {
      date: ride.date,
      distance: String(ride.distanceKm).replace('.', ','),
      hours: h ? String(h) : '',
      minutes: String(m),
      elevation: String(ride.elevationM).replace('.', ','),
      category: ride.category,
      categoryTouched: true,
      type: ride.type as RideType,
      condition: ride.condition as Condition,
      note: ride.note ?? '',
    }
  }
  return {
    date: today,
    distance: '',
    hours: '',
    minutes: '',
    elevation: '',
    category: categoryFor(today) as RideCategory,
    categoryTouched: false,
    type: 'metime' as RideType,
    condition: 1 as Condition,
    note: '',
  }
}

/** Isi form diatur lewat `key` dari pemanggil, jadi state awal selalu segar saat dibuka. */
export function RideForm({ open, ride, rides, onClose, onSave }: Props) {
  const today = toLocalDate(new Date())
  const [f, setF] = useState(() => initial(ride, today))
  const [errors, setErrors] = useState<RideErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }))

  const distanceKm = parseAngka(f.distance)
  const movingSec = toMovingSec(f.hours, f.minutes, parseAngka)
  const elevationM = parseAngka(f.elevation)

  const compute = (): RideErrors =>
    validateRide({ date: f.date, distanceKm, movingSec, elevationM, note: f.note }, today)

  const duplicate =
    distanceKm !== null && movingSec !== null && distanceKm > 0 && movingSec > 0
      ? findDuplicate(rides, { date: f.date, distanceKm, movingSec }, ride?.id)
      : undefined
  const fast = distanceKm !== null && movingSec !== null && isSpeedSuspicious(distanceKm, movingSec)

  const blur = (k: keyof RideErrors) => () => {
    const e = compute()
    setErrors((p) => ({ ...p, [k]: e[k] }))
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = compute()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({
        date: f.date,
        distanceKm: distanceKm!,
        movingSec: movingSec!,
        elevationM: elevationM!,
        category: f.category,
        type: f.type,
        condition: f.condition,
        note: f.note,
      })
    } catch {
      setSaveError('Gagal menyimpan. Isian kamu masih ada, coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} title={ride ? 'Ubah Gowes' : 'Catat Gowes'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Tanggal" error={errors.date}>
          <input
            type="date"
            className={inputCls}
            value={f.date}
            max={today}
            onChange={(e) => {
              const date = e.target.value
              setF((p) => ({
                ...p,
                date,
                category: p.categoryTouched || !date ? p.category : categoryFor(date),
              }))
            }}
            onBlur={blur('date')}
          />
        </Field>
        <Field label="Jarak (km)" error={errors.distanceKm}>
          <input
            className={inputCls}
            inputMode="decimal"
            placeholder="mis. 18,5"
            value={f.distance}
            onChange={(e) => set('distance', e.target.value)}
            onBlur={blur('distanceKm')}
          />
        </Field>
        <div>
          <span className="mb-1 block text-sm text-muted">Waktu bergerak</span>
          <div className="flex items-center gap-2">
            <input
              aria-label="Jam"
              className={inputCls}
              inputMode="numeric"
              placeholder="jam"
              value={f.hours}
              onChange={(e) => set('hours', e.target.value)}
              onBlur={blur('movingSec')}
            />
            <span className="text-muted">j</span>
            <input
              aria-label="Menit"
              className={inputCls}
              inputMode="numeric"
              placeholder="menit"
              value={f.minutes}
              onChange={(e) => set('minutes', e.target.value)}
              onBlur={blur('movingSec')}
            />
            <span className="text-muted">mnt</span>
          </div>
          {errors.movingSec ? (
            <span role="alert" className="mt-1 block text-sm text-danger">
              {errors.movingSec}
            </span>
          ) : null}
        </div>
        <Field label="Elevasi (m)" error={errors.elevationM}>
          <input
            className={inputCls}
            inputMode="decimal"
            placeholder="mis. 120"
            value={f.elevation}
            onChange={(e) => set('elevation', e.target.value)}
            onBlur={blur('elevationM')}
          />
        </Field>

        <fieldset>
          <legend className="mb-1 text-sm text-muted">Kategori waktu</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABEL) as RideCategory[]).map((c) => (
              <Chip
                key={c}
                selected={f.category === c}
                onClick={() => setF((p) => ({ ...p, category: c, categoryTouched: true }))}
              >
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm text-muted">Jenis gowes</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABEL) as RideType[]).map((t) => (
              <Chip key={t} selected={f.type === t} onClick={() => set('type', t)}>
                {TYPE_LABEL[t]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm text-muted">Kondisi badan</legend>
          <div className="flex gap-2">
            {([0, 1, 2] as Condition[]).map((c) => (
              <Chip
                key={c}
                selected={f.condition === c}
                aria-label={CONDITION_LABEL[c]}
                onClick={() => set('condition', c)}
              >
                {CONDITION_EMOJI[c]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <details open={f.note !== ''}>
          <summary className="min-h-12 cursor-pointer py-3 text-muted">Catatan (opsional)</summary>
          <Field label="Catatan" error={errors.note}>
            <textarea
              className={`${inputCls} py-2`}
              rows={3}
              maxLength={MAX_NOTE_LENGTH + 20}
              value={f.note}
              onChange={(e) => set('note', e.target.value)}
              onBlur={blur('note')}
            />
          </Field>
        </details>

        {duplicate ? (
          <div role="status" className="rounded-xl border border-warn p-3 text-warn">
            ⚠ Sudah ada gowes dengan tanggal, jarak, dan waktu yang sama. Tetap bisa disimpan.
          </div>
        ) : null}
        {fast ? (
          <div role="status" className="rounded-xl border border-warn p-3 text-warn">
            ⚠ Kecepatan rata-rata di atas 70 km/jam. Cek lagi jarak dan waktunya. Tetap bisa
            disimpan.
          </div>
        ) : null}
        {saveError ? (
          <div role="alert" className="text-danger">
            {saveError}
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-4 bg-card px-4 pt-2">
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
