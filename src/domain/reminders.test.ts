import { describe, expect, it } from 'vitest'
import type { Reminder } from '../db/types'
import {
  groupReminders,
  isOverdue,
  nextOccurrence,
  nextWeekday,
  occursOn,
  relativeDay,
  validDate,
  validateReminder,
  validTime,
} from './reminders'

const mk = (o: Partial<Reminder>): Reminder => ({
  id: Math.random().toString(),
  title: 'x',
  date: '2026-11-17',
  time: '09:00',
  repeat: 'none',
  done: false,
  createdAt: 1,
  updatedAt: 1,
  ...o,
})

describe('validTime / validDate', () => {
  it('jam 00:00–23:59', () => {
    for (const t of ['00:00', '09:05', '23:59']) expect(validTime(t)).toBe(true)
    for (const t of ['24:00', '9:00', '12:60', '', 'abc']) expect(validTime(t)).toBe(false)
  })
  it('tanggal nyata saja', () => {
    expect(validDate('2026-11-17')).toBe(true)
    expect(validDate('2026-02-30')).toBe(false)
    expect(validDate('2026-13-01')).toBe(false)
    expect(validDate('17/11/2026')).toBe(false)
    expect(validDate('')).toBe(false)
  })
})

describe('validateReminder', () => {
  const ok = { title: 'Servis', date: '2026-11-20', time: '08:00', repeat: 'none' as const }
  it('data benar lolos', () => {
    expect(validateReminder(ok)).toEqual({})
  })
  it('judul kosong / terlalu panjang', () => {
    expect(validateReminder({ ...ok, title: '   ' }).title).toBeTruthy()
    expect(validateReminder({ ...ok, title: 'x'.repeat(81) }).title).toBeTruthy()
    expect(validateReminder({ ...ok, title: 'x'.repeat(80) }).title).toBeUndefined()
  })
  it('catatan > 280, tanggal dan jam salah', () => {
    expect(validateReminder({ ...ok, note: 'x'.repeat(281) }).note).toBeTruthy()
    expect(validateReminder({ ...ok, date: '2026-02-30' }).date).toBeTruthy()
    expect(validateReminder({ ...ok, time: '25:00' }).time).toBeTruthy()
  })
})

describe('occursOn', () => {
  it('sekali: hanya pada tanggalnya', () => {
    const r = { date: '2026-11-17', repeat: 'none' as const }
    expect(occursOn(r, '2026-11-17')).toBe(true)
    expect(occursOn(r, '2026-11-18')).toBe(false)
  })
  it('tidak pernah sebelum tanggal mulai', () => {
    expect(occursOn({ date: '2026-11-17', repeat: 'daily' }, '2026-11-16')).toBe(false)
  })
  it('harian', () => {
    expect(occursOn({ date: '2026-11-17', repeat: 'daily' }, '2027-03-01')).toBe(true)
  })
  it('mingguan: hari yang sama dalam pekan', () => {
    const r = { date: '2026-11-17', repeat: 'weekly' as const } // Selasa
    expect(occursOn(r, '2026-11-24')).toBe(true)
    expect(occursOn(r, '2026-11-25')).toBe(false)
  })
  it('bulanan: tanggal sama; tanggal 31 jatuh di akhir bulan pendek', () => {
    const r = { date: '2026-01-31', repeat: 'monthly' as const }
    expect(occursOn(r, '2026-02-28')).toBe(true)
    expect(occursOn(r, '2026-02-27')).toBe(false)
    expect(occursOn(r, '2026-03-31')).toBe(true)
    expect(occursOn(r, '2026-04-30')).toBe(true)
    expect(occursOn({ date: '2026-11-17', repeat: 'monthly' }, '2026-12-17')).toBe(true)
  })
})

describe('nextOccurrence', () => {
  it('sekali: di masa depan → itu sendiri; sudah lewat → null', () => {
    const r = mk({ date: '2026-11-20', time: '08:00' })
    expect(nextOccurrence(r, '2026-11-17', '10:00')).toEqual({ date: '2026-11-20', time: '08:00' })
    expect(nextOccurrence(r, '2026-11-20', '08:00')).toEqual({ date: '2026-11-20', time: '08:00' })
    expect(nextOccurrence(r, '2026-11-20', '08:01')).toBeNull()
  })
  it('harian: hari ini bila jam belum lewat, kalau sudah → besok', () => {
    const r = mk({ repeat: 'daily', date: '2026-11-01', time: '20:00' })
    expect(nextOccurrence(r, '2026-11-17', '19:59')?.date).toBe('2026-11-17')
    expect(nextOccurrence(r, '2026-11-17', '20:01')?.date).toBe('2026-11-18')
  })
  it('mulai di masa depan: kejadian pertama = tanggal mulai', () => {
    const r = mk({ repeat: 'daily', date: '2026-12-01' })
    expect(nextOccurrence(r, '2026-11-17', '10:00')?.date).toBe('2026-12-01')
  })
  it('mingguan dan bulanan', () => {
    expect(
      nextOccurrence(
        mk({ repeat: 'weekly', date: '2026-11-07', time: '16:30' }),
        '2026-11-17',
        '10:00',
      )?.date,
    ).toBe('2026-11-21') // Sabtu
    expect(
      nextOccurrence(mk({ repeat: 'monthly', date: '2026-01-31' }), '2026-02-01', '00:00')?.date,
    ).toBe('2026-02-28')
  })
})

describe('isOverdue & groupReminders', () => {
  const now = ['2026-11-17', '12:00'] as const
  it('hanya pengingat sekali yang belum selesai dan sudah lewat', () => {
    expect(isOverdue(mk({ date: '2026-11-16' }), ...now)).toBe(true)
    expect(isOverdue(mk({ date: '2026-11-17', time: '11:59' }), ...now)).toBe(true)
    expect(isOverdue(mk({ date: '2026-11-17', time: '12:00' }), ...now)).toBe(false)
    expect(isOverdue(mk({ date: '2026-11-16', done: true }), ...now)).toBe(false)
    expect(isOverdue(mk({ date: '2026-11-16', repeat: 'daily' }), ...now)).toBe(false)
  })
  it('mengelompokkan dan mengurutkan: terlewat, terdekat dulu, selesai', () => {
    const late = mk({ title: 'lewat', date: '2026-11-10' })
    const far = mk({ title: 'jauh', date: '2026-12-25' })
    const soon = mk({ title: 'dekat', date: '2026-11-18' })
    const daily = mk({ title: 'harian', repeat: 'daily', date: '2026-01-01', time: '18:00' })
    const done = mk({ title: 'beres', date: '2026-11-01', done: true })
    const g = groupReminders([far, late, done, soon, daily], ...now)
    expect(g.overdue.map((r) => r.title)).toEqual(['lewat'])
    expect(g.upcoming.map((u) => u.reminder.title)).toEqual(['harian', 'dekat', 'jauh'])
    expect(g.done.map((r) => r.title)).toEqual(['beres'])
  })
  it('daftar kosong aman', () => {
    expect(groupReminders([], ...now)).toEqual({ overdue: [], upcoming: [], done: [] })
  })
})

describe('util tanggal', () => {
  it('nextWeekday: Sabtu/Minggu terdekat, hari ini bila cocok', () => {
    expect(nextWeekday('2026-11-17', 5)).toBe('2026-11-21')
    expect(nextWeekday('2026-11-21', 5)).toBe('2026-11-21')
    expect(nextWeekday('2026-11-22', 5)).toBe('2026-11-28')
    expect(nextWeekday('2026-11-17', 6)).toBe('2026-11-22')
  })
  it('relativeDay', () => {
    expect(relativeDay('2026-11-17', '2026-11-17')).toBe('hari_ini')
    expect(relativeDay('2026-11-18', '2026-11-17')).toBe('besok')
    expect(relativeDay('2026-11-19', '2026-11-17')).toBeNull()
  })
})
