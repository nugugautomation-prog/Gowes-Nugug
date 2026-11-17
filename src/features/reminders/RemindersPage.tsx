import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db/database'
import { getSetting, setSetting } from '../../db/settings'
import type { ReminderTimes } from '../../db/types'
import {
  REMINDER_LABEL,
  buildIcs,
  buildReminderEvents,
  validTime,
  type ReminderKind,
} from '../../domain/ics'
import { toLocalDate } from '../../domain/ride'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { Field } from '../../ui/Field'
import { PageHeader } from '../../ui/PageHeader'
import { useToast } from '../../ui/Toast'
import { downloadText } from '../diagnostics/checks'

const KINDS: ReminderKind[] = ['minum', 'jurnal', 'sabtu', 'minggu']
const inputCls =
  'min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text tabular placeholder:text-muted'

/** Pengingat lewat kalender HP (F-12): pilih jenis & jam, unduh .ics berulang. */
export function RemindersPage() {
  const saved = useLiveQuery(() => getSetting(db, 'reminderTimes'), [])
  return (
    <>
      <PageHeader title="Pengingat" subtitle="Alarm dibunyikan oleh Kalender HP" />
      {saved === undefined ? (
        <p className="text-muted" role="status">
          Memuat…
        </p>
      ) : (
        <RemindersForm initial={saved} />
      )}
    </>
  )
}

function RemindersForm({ initial }: { initial: ReminderTimes }) {
  const toast = useToast()
  const [times, setTimes] = useState<ReminderTimes>(initial)
  const [kinds, setKinds] = useState<ReminderKind[]>(KINDS)
  const [error, setError] = useState<string | null>(null)

  const timeErr = (t: string) => (validTime(t) ? undefined : 'Isi jam yang valid, mis. 09:00')
  const toggle = (k: ReminderKind) =>
    setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))

  const set = (k: 'jurnal' | 'sabtu' | 'minggu', v: string) => setTimes({ ...times, [k]: v })
  const setMinum = (i: number, v: string) =>
    setTimes({ ...times, minum: times.minum.map((t, j) => (j === i ? v : t)) })

  async function create() {
    setError(null)
    if (kinds.length === 0) return setError('Pilih minimal satu jenis pengingat.')
    const used = kinds.flatMap((k) => (k === 'minum' ? times.minum : [times[k]]))
    if (used.some((t) => !validTime(t))) return setError('Periksa jam yang berwarna merah.')
    try {
      await setSetting(db, 'reminderTimes', times)
      const events = buildReminderEvents(times, kinds, toLocalDate(new Date()))
      const r = downloadText(
        'pengingat-gowessehat.ics',
        'text/calendar',
        buildIcs(events, Date.now()),
      )
      if (r.status === 'fail') return setError(`Gagal membuat file: ${r.detail}`)
      toast.show('File dibuat. Buka dengan Kalender HP ✓')
    } catch {
      setError('Gagal menyimpan jam. Coba lagi.')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-2 font-semibold">Jenis pengingat</h2>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Chip key={k} selected={kinds.includes(k)} onClick={() => toggle(k)}>
              {REMINDER_LABEL[k]}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Jam</h2>
        <div className="space-y-4">
          {times.minum.map((t, i) => (
            <Field key={i} label={`Minum air ${i + 1}`} error={timeErr(t)}>
              <input
                type="time"
                className={inputCls}
                value={t}
                onChange={(e) => setMinum(i, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Jurnal malam" error={timeErr(times.jurnal)}>
            <input
              type="time"
              className={inputCls}
              value={times.jurnal}
              onChange={(e) => set('jurnal', e.target.value)}
            />
          </Field>
          <Field label="Gowes Sabtu" error={timeErr(times.sabtu)}>
            <input
              type="time"
              className={inputCls}
              value={times.sabtu}
              onChange={(e) => set('sabtu', e.target.value)}
            />
          </Field>
          <Field label="Gowes Minggu" error={timeErr(times.minggu)}>
            <input
              type="time"
              className={inputCls}
              value={times.minggu}
              onChange={(e) => set('minggu', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {error ? (
        <p role="alert" className="text-danger">
          {error}
        </p>
      ) : null}
      <Button className="w-full" onClick={() => void create()}>
        Buat file kalender
      </Button>
      <p className="text-sm text-muted">
        Setelah diunduh, buka file-nya dengan Kalender HP. Pengingat berulang otomatis dan jam
        memakai zona WIB (Asia/Jakarta). Mengimpor ulang tidak menggandakan acara yang sama.
      </p>
    </div>
  )
}
