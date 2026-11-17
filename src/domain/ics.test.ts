import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../db/settings'
import {
  buildIcs,
  buildReminderEvents,
  escapeText,
  foldLine,
  utcStamp,
  validTime,
  type ReminderKind,
} from './ics'

const ALL: ReminderKind[] = ['minum', 'jurnal', 'sabtu', 'minggu']
const times = DEFAULT_SETTINGS.reminderTimes
const NOW = Date.UTC(2026, 10, 17, 3, 0, 0) // 2026-11-17 (Selasa)
const TODAY = '2026-11-17'

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

describe('validTime', () => {
  it('menerima HH:MM 00:00–23:59', () => {
    for (const t of ['00:00', '09:05', '23:59']) expect(validTime(t)).toBe(true)
    for (const t of ['24:00', '9:00', '12:60', '', 'abc', '12:5']) expect(validTime(t)).toBe(false)
  })
})

describe('buildReminderEvents (FR-111)', () => {
  const ev = buildReminderEvents(times, ALL, TODAY)
  it('4 jam minum + jurnal + sabtu + minggu = 7 kejadian', () => {
    expect(ev).toHaveLength(7)
    expect(ev.filter((e) => e.kind === 'minum').map((e) => e.time)).toEqual([
      '09:00',
      '11:00',
      '13:00',
      '15:00',
    ])
  })
  it('jam bawaan: jurnal 20:00, Sabtu 16:30, Minggu 06:00', () => {
    expect(ev.find((e) => e.kind === 'jurnal')?.time).toBe('20:00')
    expect(ev.find((e) => e.kind === 'sabtu')?.time).toBe('16:30')
    expect(ev.find((e) => e.kind === 'minggu')?.time).toBe('06:00')
  })
  it('tanggal mulai jatuh pada hari yang benar (Sabtu 21 Nov, Minggu 22 Nov 2026)', () => {
    expect(ev.find((e) => e.kind === 'sabtu')?.startDate).toBe('2026-11-21')
    expect(ev.find((e) => e.kind === 'minggu')?.startDate).toBe('2026-11-22')
  })
  it('bila hari ini Sabtu, mulai hari ini; Minggu depan bila hari ini Minggu', () => {
    const sat = buildReminderEvents(times, ['sabtu'], '2026-11-21')[0]
    expect(sat?.startDate).toBe('2026-11-21')
    const sun = buildReminderEvents(times, ['minggu'], '2026-11-22')[0]
    expect(sun?.startDate).toBe('2026-11-22')
    const satAfter = buildReminderEvents(times, ['sabtu'], '2026-11-22')[0]
    expect(satAfter?.startDate).toBe('2026-11-28')
  })
  it('hanya jenis yang dipilih', () => {
    expect(buildReminderEvents(times, ['jurnal'], TODAY)).toHaveLength(1)
    expect(buildReminderEvents(times, [], TODAY)).toHaveLength(0)
  })
  it('jam minum ganda digabung; jam tak valid ditolak', () => {
    const dup = buildReminderEvents({ ...times, minum: ['09:00', '09:00'] }, ['minum'], TODAY)
    expect(dup).toHaveLength(1)
    expect(() => buildReminderEvents({ ...times, jurnal: '25:00' }, ['jurnal'], TODAY)).toThrow()
  })
})

describe('buildIcs (AC-017)', () => {
  const ics = buildIcs(buildReminderEvents(times, ALL, TODAY), NOW)
  const lines = ics.split('\r\n')

  it('struktur kalender valid dengan CRLF dan berakhir CRLF', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines.at(-2)).toBe('END:VCALENDAR')
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
    expect(ics).toContain('VERSION:2.0')
  })
  it('BEGIN/END seimbang untuk VEVENT dan VALARM', () => {
    const count = (s: string) => lines.filter((l) => l === s).length
    expect(count('BEGIN:VEVENT')).toBe(7)
    expect(count('END:VEVENT')).toBe(7)
    expect(count('BEGIN:VALARM')).toBe(7)
    expect(count('END:VALARM')).toBe(7)
  })
  it('zona Asia/Jakarta dengan VTIMEZONE dan jam sesuai FR-111', () => {
    expect(ics).toContain('TZID:Asia/Jakarta')
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20261121T163000')
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20261122T060000')
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20261117T200000')
  })
  it('RRULE berulang dan alarm VALARM saat waktu tiba', () => {
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU')
    expect(ics.match(/RRULE:FREQ=DAILY/g)).toHaveLength(5)
    expect(ics).toContain('TRIGGER:-PT0M')
    expect(ics).toContain('ACTION:DISPLAY')
  })
  it('UID unik dan stabil (impor ulang tidak menggandakan)', () => {
    const uids = lines.filter((l) => l.startsWith('UID:'))
    expect(new Set(uids).size).toBe(uids.length)
    expect(buildIcs(buildReminderEvents(times, ALL, TODAY), NOW + 5000)).toContain(uids[0] ?? 'x')
  })
  it('DTSTAMP dalam UTC', () => {
    expect(utcStamp(NOW)).toBe('20261117T030000Z')
    expect(ics).toContain('DTSTAMP:20261117T030000Z')
  })
  it('tidak ada baris > 75 byte', () => {
    const enc = new TextEncoder()
    for (const l of lines) expect(enc.encode(l).length).toBeLessThanOrEqual(75)
  })
})
