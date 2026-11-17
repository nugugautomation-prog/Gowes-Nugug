import type { Reminder, Repeat } from '../db/types'
import { addDays, weekStart } from './stats'

export const MAX_REMINDER_TITLE = 80
export const MAX_REMINDER_NOTE = 280

export const REPEAT_LABEL: Record<Repeat, string> = {
  none: 'Sekali',
  daily: 'Tiap hari',
  weekly: 'Tiap minggu',
  monthly: 'Tiap bulan',
}

/** Jam valid "HH:MM" 00:00–23:59. */
export function validTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t)
}

function parseDate(date: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(y, mo - 1, d)
  // Tolak tanggal yang tidak ada (mis. 2026-02-30).
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null
}

export function validDate(date: string): boolean {
  return parseDate(date) !== null
}

export interface ReminderInput {
  title: string
  note?: string
  date: string
  time: string
  repeat: Repeat
}

export type ReminderErrors = Partial<Record<'title' | 'note' | 'date' | 'time', string>>

/** VAL pengingat: judul 1–80, catatan ≤ 280, tanggal dan jam valid. */
export function validateReminder(i: ReminderInput): ReminderErrors {
  const e: ReminderErrors = {}
  const title = i.title.trim()
  if (title.length === 0) e.title = 'Tulis judul pengingat dulu'
  else if (title.length > MAX_REMINDER_TITLE) e.title = `Maksimal ${MAX_REMINDER_TITLE} karakter`
  if ((i.note ?? '').length > MAX_REMINDER_NOTE) e.note = `Maksimal ${MAX_REMINDER_NOTE} karakter`
  if (!validDate(i.date)) e.date = 'Pilih tanggal yang valid'
  if (!validTime(i.time)) e.time = 'Isi jam yang valid, mis. 09:00'
  return e
}

const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate() // m = 1..12

/** Apakah pengingat jatuh pada tanggal `date` (tanpa melihat jam). Bulanan: tanggal 31 jatuh di akhir bulan pendek. */
export function occursOn(r: Pick<Reminder, 'date' | 'repeat'>, date: string): boolean {
  if (date < r.date) return false
  if (r.repeat === 'none') return date === r.date
  if (r.repeat === 'daily') return true
  const a = parseDate(r.date)
  const b = parseDate(date)
  if (!a || !b) return false
  if (r.repeat === 'weekly') return a.getDay() === b.getDay()
  const want = Math.min(a.getDate(), daysInMonth(b.getFullYear(), b.getMonth() + 1))
  return b.getDate() === want
}

export interface Occurrence {
  date: string
  time: string
}

/**
 * Kejadian pertama pada/setelah (nowDate, nowTime). null = tidak ada lagi
 * (pengingat sekali yang sudah lewat).
 */
export function nextOccurrence(
  r: Pick<Reminder, 'date' | 'time' | 'repeat'>,
  nowDate: string,
  nowTime: string,
): Occurrence | null {
  const from = r.date > nowDate ? r.date : nowDate
  const limit = r.repeat === 'none' ? 1 : 400
  for (let i = 0; i < limit; i++) {
    const d = addDays(from, i)
    if (!occursOn(r, d)) continue
    if (d > nowDate || r.time >= nowTime) return { date: d, time: r.time }
  }
  return null
}

/** Pengingat sekali yang belum selesai dan waktunya sudah lewat. */
export function isOverdue(r: Reminder, nowDate: string, nowTime: string): boolean {
  if (r.repeat !== 'none' || r.done) return false
  return r.date < nowDate || (r.date === nowDate && r.time < nowTime)
}

export interface Grouped {
  overdue: Reminder[]
  upcoming: { reminder: Reminder; next: Occurrence }[]
  done: Reminder[]
}

/** Kelompokkan untuk tampilan: terlewat, akan datang (terdekat dulu), selesai. */
export function groupReminders(all: Reminder[], nowDate: string, nowTime: string): Grouped {
  const overdue: Reminder[] = []
  const done: Reminder[] = []
  const upcoming: Grouped['upcoming'] = []
  for (const r of all) {
    if (r.done) done.push(r)
    else if (isOverdue(r, nowDate, nowTime)) overdue.push(r)
    else {
      const next = nextOccurrence(r, nowDate, nowTime)
      if (next) upcoming.push({ reminder: r, next })
    }
  }
  const key = (o: Occurrence) => `${o.date} ${o.time}`
  upcoming.sort((a, b) => key(a.next).localeCompare(key(b.next)))
  overdue.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  done.sort((a, b) => b.updatedAt - a.updatedAt)
  return { overdue, upcoming, done }
}

/** Tanggal berikutnya yang jatuh pada hari tertentu (0 = Senin … 6 = Minggu), mulai hari ini. */
export function nextWeekday(today: string, offsetFromMonday: number): string {
  const d = addDays(weekStart(today), offsetFromMonday)
  return d < today ? addDays(d, 7) : d
}

/** Label relatif: "Hari ini", "Besok", atau tanggal. */
export function relativeDay(date: string, today: string): 'hari_ini' | 'besok' | null {
  if (date === today) return 'hari_ini'
  if (date === addDays(today, 1)) return 'besok'
  return null
}
