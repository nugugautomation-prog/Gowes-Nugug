import type { ReminderTimes } from '../db/types'
import { addDays, weekStart } from './stats'

export type ReminderKind = 'minum' | 'jurnal' | 'sabtu' | 'minggu'

export const REMINDER_LABEL: Record<ReminderKind, string> = {
  minum: 'Minum air',
  jurnal: 'Jurnal malam',
  sabtu: 'Gowes Sabtu sore',
  minggu: 'Gowes Minggu pagi',
}

const TZ = 'Asia/Jakarta'
const CRLF = '\r\n'

/** Jam valid "HH:MM" 00:00–23:59 (VAL jam). */
export function validTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t)
}

/** Escape TEXT menurut RFC 5545: \ ; , dan baris baru. */
export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Lipat baris > 75 byte UTF-8 (RFC 5545), tanpa memotong karakter di tengah. */
export function foldLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const parts: string[] = []
  let cur = ''
  let bytes = 0
  let limit = 75
  for (const ch of line) {
    const b = enc.encode(ch).length
    if (bytes + b > limit) {
      parts.push(cur)
      cur = ''
      bytes = 0
      limit = 74 // baris lanjutan diawali satu spasi
    }
    cur += ch
    bytes += b
  }
  parts.push(cur)
  return parts.join(CRLF + ' ')
}

export interface ReminderEvent {
  kind: ReminderKind
  time: string // HH:MM
  summary: string
  description: string
  /** Tanggal mulai 'YYYY-MM-DD'. */
  startDate: string
  rrule: string
}

const compactDate = (d: string) => d.replace(/-/g, '')
const compactTime = (t: string) => t.replace(':', '') + '00'

function firstWeekday(today: string, offsetFromMonday: number): string {
  const d = addDays(weekStart(today), offsetFromMonday)
  return d < today ? addDays(d, 7) : d
}

/** Susun daftar kejadian berulang dari jam pilihan (FR-110/111). Jam tak valid → galat. */
export function buildReminderEvents(
  times: ReminderTimes,
  kinds: ReminderKind[],
  today: string,
): ReminderEvent[] {
  const out: ReminderEvent[] = []
  const check = (t: string) => {
    if (!validTime(t)) throw new Error(`Jam tidak valid: ${t}`)
    return t
  }
  if (kinds.includes('minum')) {
    for (const t of [...new Set(times.minum.map(check))].sort())
      out.push({
        kind: 'minum',
        time: t,
        summary: 'Minum air 💧',
        description: 'Waktunya minum air. Target hari ini 2.500 ml.',
        startDate: today,
        rrule: 'FREQ=DAILY',
      })
  }
  if (kinds.includes('jurnal'))
    out.push({
      kind: 'jurnal',
      time: check(times.jurnal),
      summary: 'Isi jurnal malam 📝',
      description: 'Catat tidur, buah, dan waktu bareng anak hari ini.',
      startDate: today,
      rrule: 'FREQ=DAILY',
    })
  if (kinds.includes('sabtu'))
    out.push({
      kind: 'sabtu',
      time: check(times.sabtu),
      summary: 'Gowes sore 🚴',
      description: 'Waktunya gowes Sabtu sore. Cek kesiapan di aplikasi dulu.',
      startDate: firstWeekday(today, 5),
      rrule: 'FREQ=WEEKLY;BYDAY=SA',
    })
  if (kinds.includes('minggu'))
    out.push({
      kind: 'minggu',
      time: check(times.minggu),
      summary: 'Gowes pagi 🚴',
      description: 'Waktunya gowes Minggu pagi. Cek kesiapan di aplikasi dulu.',
      startDate: firstWeekday(today, 6),
      rrule: 'FREQ=WEEKLY;BYDAY=SU',
    })
  return out
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZ}`,
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0700',
  'TZOFFSETTO:+0700',
  'TZNAME:WIB',
  'END:STANDARD',
  'END:VTIMEZONE',
]

/** UTC "YYYYMMDDTHHMMSSZ" dari epoch ms. */
export function utcStamp(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** Bangun isi file .ics (CRLF, terlipat). UID tetap per jenis+jam agar impor ulang tidak menggandakan. */
export function buildIcs(events: ReminderEvent[], nowMs: number): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GowesSehat//Pengingat//ID',
    'CALSCALE:GREGORIAN',
    ...VTIMEZONE,
  ]
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:gowessehat-${e.kind}-${e.time.replace(':', '')}@gowessehat.local`,
      `DTSTAMP:${utcStamp(nowMs)}`,
      `DTSTART;TZID=${TZ}:${compactDate(e.startDate)}T${compactTime(e.time)}`,
      'DURATION:PT15M',
      `RRULE:${e.rrule}`,
      `SUMMARY:${escapeText(e.summary)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(e.summary)}`,
      'TRIGGER:-PT0M',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join(CRLF) + CRLF
}
