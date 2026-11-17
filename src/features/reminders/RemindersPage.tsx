import { useState } from 'react'
import type { Reminder, Repeat } from '../../db/types'
import { buildIcs, reminderToEvent } from '../../domain/ics'
import {
  REPEAT_LABEL,
  groupReminders,
  nextWeekday,
  relativeDay,
  validateReminder,
  type ReminderErrors,
} from '../../domain/reminders'
import { toLocalDate } from '../../domain/ride'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { Field } from '../../ui/Field'
import { EmptyState, PageHeader } from '../../ui/PageHeader'
import { Sheet } from '../../ui/Sheet'
import { useNow } from '../../ui/useNow'
import { useToast } from '../../ui/Toast'
import { downloadText } from '../diagnostics/checks'
import { formatTanggal } from '../rides/RideList'
import {
  addReminder,
  deleteReminder,
  restoreReminder,
  setReminderDone,
  updateReminder,
  useReminders,
} from './remindersRepo'

const inputCls =
  'min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text tabular placeholder:text-muted'

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

function when(date: string, time: string, today: string): string {
  const rel = relativeDay(date, today)
  const day = rel === 'hari_ini' ? 'Hari ini' : rel === 'besok' ? 'Besok' : formatTanggal(date)
  return `${day} · ${time}`
}

/** Pengingat umum (F-12 direvisi, D-26): daftar jadwal + kirim ke Kalender HP untuk alarm. */
export function RemindersPage() {
  const now = useNow()
  const today = toLocalDate(now)
  const nowTime = hhmm(now)
  const toast = useToast()
  const all = useReminders()
  const [sheet, setSheet] = useState<{ reminder?: Reminder } | null>(null)

  function toCalendar(list: Reminder[], filename: string) {
    try {
      const ics = buildIcs(list.map(reminderToEvent), now.getTime())
      const r = downloadText(filename, 'text/calendar', ics)
      if (r.status === 'fail') toast.show('Gagal membuat file kalender')
      else toast.show('File dibuat. Buka dengan Kalender HP ✓')
    } catch {
      toast.show('Gagal membuat file kalender')
    }
  }

  if (all === undefined)
    return (
      <>
        <PageHeader title="Pengingat" />
        <p className="text-muted" role="status">
          Memuat…
        </p>
      </>
    )

  const g = groupReminders(all, today, nowTime)
  const active = [...g.overdue, ...g.upcoming.map((u) => u.reminder)]

  return (
    <>
      <PageHeader
        title="Pengingat"
        subtitle="Jadwal supaya tidak lupa"
        action={<Button onClick={() => setSheet({})}>Tambah</Button>}
      />
      <div className="space-y-4">
        {all.length === 0 ? (
          <EmptyState
            title="Belum ada pengingat"
            hint="Ketuk Tambah untuk membuat jadwal, mis. servis sepeda atau gowes Sabtu sore."
          />
        ) : null}

        {g.overdue.length > 0 ? (
          <section aria-label="Terlewat" className="space-y-2">
            <h2 className="font-semibold text-warn">Terlewat</h2>
            {g.overdue.map((r) => (
              <Item
                key={r.id}
                r={r}
                label={when(r.date, r.time, today)}
                overdue
                onEdit={() => setSheet({ reminder: r })}
                onCalendar={() => toCalendar([r], `pengingat-${r.date}.ics`)}
                onDone={() => void setReminderDone(r.id, true)}
              />
            ))}
          </section>
        ) : null}

        {g.upcoming.length > 0 ? (
          <section aria-label="Akan datang" className="space-y-2">
            <h2 className="font-semibold">Akan datang</h2>
            {g.upcoming.map(({ reminder: r, next }) => (
              <Item
                key={r.id}
                r={r}
                label={when(next.date, next.time, today)}
                onEdit={() => setSheet({ reminder: r })}
                onCalendar={() => toCalendar([r], `pengingat-${r.date}.ics`)}
                onDone={r.repeat === 'none' ? () => void setReminderDone(r.id, true) : undefined}
              />
            ))}
          </section>
        ) : null}

        {active.length > 1 ? (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => toCalendar(active, 'pengingat-gowessehat.ics')}
          >
            Kirim semua ke Kalender
          </Button>
        ) : null}

        {g.done.length > 0 ? (
          <section aria-label="Selesai" className="space-y-2">
            <h2 className="font-semibold text-muted">Selesai</h2>
            {g.done.map((r) => (
              <Item
                key={r.id}
                r={r}
                label={when(r.date, r.time, today)}
                done
                onEdit={() => setSheet({ reminder: r })}
                onDone={() => void setReminderDone(r.id, false)}
              />
            ))}
          </section>
        ) : null}

        <p className="text-sm text-muted">
          Alarm dibunyikan oleh Kalender HP. Ketuk <strong>Kalender</strong> pada pengingat, lalu
          buka file yang diunduh. Mengimpor ulang tidak menggandakan acara yang sama.
        </p>
      </div>

      {sheet ? (
        <ReminderForm
          key={sheet.reminder?.id ?? 'baru'}
          reminder={sheet.reminder}
          today={today}
          onClose={() => setSheet(null)}
          onDelete={async (r) => {
            const snapshot = await deleteReminder(r.id)
            setSheet(null)
            toast.show('Pengingat dihapus', {
              label: 'Urungkan',
              onClick: () => {
                if (snapshot) void restoreReminder(snapshot)
              },
            })
          }}
        />
      ) : null}
    </>
  )
}

function Item({
  r,
  label,
  overdue = false,
  done = false,
  onEdit,
  onCalendar,
  onDone,
}: {
  r: Reminder
  label: string
  overdue?: boolean
  done?: boolean
  onEdit: () => void
  onCalendar?: () => void
  onDone?: () => void
}) {
  return (
    <Card className={`p-0 ${overdue ? 'border-warn' : ''}`}>
      <button
        type="button"
        className="min-h-12 w-full p-4 text-left"
        aria-label={`Pengingat ${r.title}`}
        onClick={onEdit}
      >
        <span className={`block font-semibold ${done ? 'text-muted line-through' : ''}`}>
          {r.title}
        </span>
        <span className="tabular block text-sm text-muted">
          {label}
          {r.repeat !== 'none' ? ` · ${REPEAT_LABEL[r.repeat]}` : ''}
        </span>
        {r.note ? <span className="mt-1 block text-sm text-muted">{r.note}</span> : null}
      </button>
      <div className="flex gap-2 px-4 pb-3">
        {onDone ? (
          <Button
            variant="secondary"
            onClick={onDone}
            aria-label={`${done ? 'Batal selesai' : 'Selesai'} ${r.title}`}
          >
            {done ? 'Batal selesai' : 'Selesai'}
          </Button>
        ) : null}
        {onCalendar ? (
          <Button variant="secondary" onClick={onCalendar} aria-label={`Kalender ${r.title}`}>
            Kalender
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

function ReminderForm({
  reminder,
  today,
  onClose,
  onDelete,
}: {
  reminder?: Reminder
  today: string
  onClose: () => void
  onDelete: (r: Reminder) => void | Promise<void>
}) {
  const toast = useToast()
  const [title, setTitle] = useState(reminder?.title ?? '')
  const [date, setDate] = useState(reminder?.date ?? today)
  const [time, setTime] = useState(reminder?.time ?? '09:00')
  const [repeat, setRepeat] = useState<Repeat>(reminder?.repeat ?? 'none')
  const [note, setNote] = useState(reminder?.note ?? '')
  const [errors, setErrors] = useState<ReminderErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function preset(kind: 'sabtu' | 'minggu') {
    setTitle(kind === 'sabtu' ? 'Gowes sore 🚴' : 'Gowes pagi 🚴')
    setTime(kind === 'sabtu' ? '16:30' : '06:00')
    setDate(nextWeekday(today, kind === 'sabtu' ? 5 : 6))
    setRepeat('weekly')
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const input = { title, note, date, time, repeat }
    const e = validateReminder(input)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    setSaveError(null)
    try {
      if (reminder) await updateReminder(reminder.id, input)
      else await addReminder(input)
      toast.show(reminder ? 'Perubahan tersimpan ✓' : 'Pengingat tersimpan ✓')
      onClose()
    } catch {
      setSaveError('Gagal menyimpan. Isianmu masih ada, coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open title={reminder ? 'Ubah Pengingat' : 'Pengingat Baru'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {!reminder ? (
          <div className="flex flex-wrap gap-2">
            <Chip onClick={() => preset('sabtu')}>Gowes Sabtu sore</Chip>
            <Chip onClick={() => preset('minggu')}>Gowes Minggu pagi</Chip>
          </div>
        ) : null}
        <Field label="Judul" error={errors.title}>
          <input
            className={inputCls}
            value={title}
            placeholder="mis. Servis sepeda"
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Tanggal" error={errors.date}>
          <input
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Jam" error={errors.time}>
          <input
            type="time"
            className={inputCls}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
        <fieldset>
          <legend className="mb-1 text-sm text-muted">Ulangi</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(REPEAT_LABEL) as Repeat[]).map((r) => (
              <Chip key={r} selected={repeat === r} onClick={() => setRepeat(r)}>
                {REPEAT_LABEL[r]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field label="Catatan (opsional)" error={errors.note}>
          <textarea
            className="min-h-20 w-full rounded-xl border border-line bg-bg p-3 text-text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        {saveError ? (
          <p role="alert" className="text-danger">
            {saveError}
          </p>
        ) : null}
        <div className="sticky bottom-0 -mx-4 flex gap-2 bg-card px-4 pt-2">
          {reminder ? (
            <Button variant="danger" onClick={() => void onDelete(reminder)}>
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
