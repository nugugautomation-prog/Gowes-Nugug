import type { Reminder } from '../db/types'
import { validTime } from './reminders'

export { validTime }

const TZ = 'Asia/Jakarta'
const CRLF = '\r\n'
const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const

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

export interface IcsEvent {
  uid: string
  summary: string
  description: string
  /** 'YYYY-MM-DD' kejadian pertama. */
  startDate: string
  /** 'HH:MM' waktu WIB. */
  time: string
  /** Aturan ulang tanpa awalan "RRULE:", atau undefined = sekali. */
  rrule?: string
}

const compactDate = (d: string) => d.replace(/-/g, '')
const compactTime = (t: string) => t.replace(':', '') + '00'

function weekdayCode(date: string): string {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return DAY_CODES[new Date(y, m - 1, d).getDay()] ?? 'MO'
}

/** Ubah pengingat menjadi acara kalender. Jam atau tanggal tak valid → galat. */
export function reminderToEvent(r: Reminder): IcsEvent {
  if (!validTime(r.time)) throw new Error(`Jam tidak valid: ${r.time}`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) throw new Error(`Tanggal tidak valid: ${r.date}`)
  const day = Number(r.date.slice(8))
  const rrule =
    r.repeat === 'daily'
      ? 'FREQ=DAILY'
      : r.repeat === 'weekly'
        ? `FREQ=WEEKLY;BYDAY=${weekdayCode(r.date)}`
        : r.repeat === 'monthly'
          ? `FREQ=MONTHLY;BYMONTHDAY=${day}`
          : undefined
  return {
    uid: `gowessehat-${r.id}@gowessehat.local`, // tetap per pengingat: impor ulang tidak menggandakan
    summary: r.title,
    description: r.note ?? '',
    startDate: r.date,
    time: r.time,
    rrule,
  }
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

/** Bangun isi file .ics (CRLF, terlipat) dengan alarm tepat waktu (VALARM). */
export function buildIcs(events: IcsEvent[], nowMs: number): string {
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
      `UID:${e.uid}`,
      `DTSTAMP:${utcStamp(nowMs)}`,
      `DTSTART;TZID=${TZ}:${compactDate(e.startDate)}T${compactTime(e.time)}`,
      'DURATION:PT15M',
      ...(e.rrule ? [`RRULE:${e.rrule}`] : []),
      `SUMMARY:${escapeText(e.summary)}`,
      ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
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
