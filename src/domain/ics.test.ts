import { describe, expect, it } from 'vitest'
import type { Reminder } from '../db/types'
import { buildIcs, escapeText, foldLine, reminderToEvent, utcStamp } from './ics'

const NOW = Date.UTC(2026, 10, 17, 3, 0, 0)
const mk = (o: Partial<Reminder>): Reminder => ({
  id: 'abc',
  title: 'Servis sepeda',
  date: '2026-11-21',
  time: '16:30',
  repeat: 'none',
  done: false,
  createdAt: 1,
  updatedAt: 1,
  ...o,
})

describe('escapeText', () => {
  it('meloloskan \\ ; , dan baris baru', () => {
    expect(escapeText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
  })
  it('karakter lain (& < > " \' emoji) dibiarkan', () => {
    expect(escapeText('& < > " \' 🚴')).toBe('& < > " \' 🚴')
  })
})

describe('foldLine', () => {
  it('baris pendek tidak diubah', () => {
    expect(foldLine('SUMMARY:hai')).toBe('SUMMARY:hai')
  })
  it('baris panjang dilipat ≤ 75 byte dan bisa disambung kembali', () => {
    const long = 'DESCRIPTION:' + 'ä🚴x'.repeat(40)
    const folded = foldLine(long)
    const enc = new TextEncoder()
    for (const part of folded.split('\r\n')) expect(enc.encode(part).length).toBeLessThanOrEqual(75)
    expect(folded.replace(/\r\n /g, '')).toBe(long)
  })
})

describe('reminderToEvent', () => {
  it('sekali: tanpa RRULE', () => {
    expect(reminderToEvent(mk({})).rrule).toBeUndefined()
  })
  it('harian, mingguan (BYDAY sesuai hari tanggal mulai), bulanan (BYMONTHDAY)', () => {
    expect(reminderToEvent(mk({ repeat: 'daily' })).rrule).toBe('FREQ=DAILY')
    expect(reminderToEvent(mk({ repeat: 'weekly', date: '2026-11-21' })).rrule).toBe(
      'FREQ=WEEKLY;BYDAY=SA',
    )
    expect(reminderToEvent(mk({ repeat: 'weekly', date: '2026-11-22' })).rrule).toBe(
      'FREQ=WEEKLY;BYDAY=SU',
    )
    expect(reminderToEvent(mk({ repeat: 'monthly', date: '2026-01-31' })).rrule).toBe(
      'FREQ=MONTHLY;BYMONTHDAY=31',
    )
  })
  it('UID stabil per pengingat', () => {
    expect(reminderToEvent(mk({})).uid).toBe('gowessehat-abc@gowessehat.local')
  })
  it('jam atau tanggal tak valid ditolak', () => {
    expect(() => reminderToEvent(mk({ time: '25:00' }))).toThrow()
    expect(() => reminderToEvent(mk({ date: 'besok' }))).toThrow()
  })
})

describe('buildIcs (AC-017)', () => {
  const events = [
    reminderToEvent(mk({ note: 'Bawa; kunci, "pas"\nlantai 2' })),
    reminderToEvent(mk({ id: 'w', title: 'Gowes 🚴', repeat: 'weekly', time: '06:00' })),
  ]
  const ics = buildIcs(events, NOW)
  const lines = ics.split('\r\n')

  it('struktur valid, CRLF, berakhir CRLF', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines.at(-2)).toBe('END:VCALENDAR')
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics).toContain('VERSION:2.0')
  })
  it('BEGIN/END seimbang untuk VEVENT dan VALARM', () => {
    const count = (s: string) => lines.filter((l) => l === s).length
    expect(count('BEGIN:VEVENT')).toBe(2)
    expect(count('END:VEVENT')).toBe(2)
    expect(count('BEGIN:VALARM')).toBe(2)
    expect(count('END:VALARM')).toBe(2)
  })
  it('zona Asia/Jakarta dengan VTIMEZONE dan jam sesuai', () => {
    expect(ics).toContain('TZID:Asia/Jakarta')
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20261121T163000')
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20261121T060000')
  })
  it('hanya yang berulang memakai RRULE; alarm saat waktu tiba', () => {
    expect(ics.match(/RRULE:/g)).toHaveLength(1)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA')
    expect(ics).toContain('TRIGGER:-PT0M')
  })
  it('karakter khusus ter-escape dan catatan ikut', () => {
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('DESCRIPTION:Bawa\\; kunci\\, "pas"\\nlantai 2')
  })
  it('UID unik dan stabil; DTSTAMP UTC; tidak ada baris > 75 byte', () => {
    const uids = lines.filter((l) => l.startsWith('UID:'))
    expect(new Set(uids).size).toBe(uids.length)
    expect(utcStamp(NOW)).toBe('20261117T030000Z')
    expect(ics).toContain('DTSTAMP:20261117T030000Z')
    const enc = new TextEncoder()
    for (const l of lines) expect(enc.encode(l).length).toBeLessThanOrEqual(75)
  })
  it('judul bermuatan skrip tidak menjadi baris baru', () => {
    const evil = buildIcs([reminderToEvent(mk({ title: 'a\r\nBEGIN:VEVENT\r\nX' }))], NOW)
    expect(evil.split('\r\n').filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1)
  })
})
