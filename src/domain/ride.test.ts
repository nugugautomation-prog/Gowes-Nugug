import { describe, expect, it } from 'vitest'
import type { Ride } from '../db/types'
import { formatAngka, parseAngka } from './angka'
import {
  avgSpeedKmh,
  categoryFor,
  findDuplicate,
  formatDuration,
  isSpeedSuspicious,
  toLocalDate,
  toMovingSec,
  validateRide,
} from './ride'

describe('parseAngka', () => {
  it('menerima koma dan titik', () => {
    expect(parseAngka('12,5')).toBe(12.5)
    expect(parseAngka('12.5')).toBe(12.5)
    expect(parseAngka(' 7 ')).toBe(7)
    expect(parseAngka('.5')).toBe(0.5)
  })
  it('menolak yang bukan angka', () => {
    for (const s of ['', '  ', 'abc', '1,2,3', '1.2.3', '-5', '1e3', '12 km', 'Infinity']) {
      expect(parseAngka(s), s).toBeNull()
    }
  })
  it('formatAngka memakai koma', () => expect(formatAngka(12.5)).toBe('12,5'))
})

describe('categoryFor (BR-010)', () => {
  // 2026-11-16 Senin … 2026-11-21 Sabtu, 2026-11-22 Minggu
  it('Senin–Jumat = hari_kerja', () => {
    for (const d of ['2026-11-16', '2026-11-18', '2026-11-20'])
      expect(categoryFor(d, 6)).toBe('hari_kerja')
  })
  it('Sabtu: batas 12:00', () => {
    expect(categoryFor('2026-11-21', 12)).toBe('sabtu_sore')
    expect(categoryFor('2026-11-21', 11)).toBe('lainnya')
  })
  it('Minggu: batas 12:00', () => {
    expect(categoryFor('2026-11-22', 11)).toBe('minggu_pagi')
    expect(categoryFor('2026-11-22', 12)).toBe('lainnya')
  })
  it('tanpa jam mulai: Sabtu sore, Minggu pagi', () => {
    expect(categoryFor('2026-11-21')).toBe('sabtu_sore')
    expect(categoryFor('2026-11-22')).toBe('minggu_pagi')
  })
})

describe('kecepatan rata-rata (BR-006)', () => {
  it('jarak ÷ waktu', () => expect(avgSpeedKmh(18, 3600)).toBe(18))
  it('waktu 0 tidak menghasilkan NaN/Infinity', () => expect(avgSpeedKmh(10, 0)).toBe(0))
  it('peringatan > 70 km/jam', () => {
    expect(isSpeedSuspicious(71, 3600)).toBe(true)
    expect(isSpeedSuspicious(70, 3600)).toBe(false)
  })
})

describe('validateRide (VAL-001/002)', () => {
  const ok = { date: '2026-11-17', distanceKm: 18, movingSec: 3600, elevationM: 120, note: '' }
  const today = '2026-11-17'
  it('data wajar lolos', () => expect(validateRide(ok, today)).toEqual({}))
  it('batas jarak', () => {
    expect(validateRide({ ...ok, distanceKm: 0 }, today).distanceKm).toBeTruthy()
    expect(validateRide({ ...ok, distanceKm: 300 }, today).distanceKm).toBeUndefined()
    expect(validateRide({ ...ok, distanceKm: 300.01 }, today).distanceKm).toBeTruthy()
    expect(validateRide({ ...ok, distanceKm: null }, today).distanceKm).toBeTruthy()
  })
  it('waktu harus > 0', () => {
    expect(validateRide({ ...ok, movingSec: 0 }, today).movingSec).toBeTruthy()
    expect(validateRide({ ...ok, movingSec: null }, today).movingSec).toBeTruthy()
  })
  it('batas elevasi', () => {
    expect(validateRide({ ...ok, elevationM: 0 }, today).elevationM).toBeUndefined()
    expect(validateRide({ ...ok, elevationM: 10_001 }, today).elevationM).toBeTruthy()
    expect(validateRide({ ...ok, elevationM: null }, today).elevationM).toBeTruthy()
  })
  it('tanggal masa depan ditolak, hari ini boleh', () => {
    expect(validateRide({ ...ok, date: '2026-11-18' }, today).date).toBeTruthy()
    expect(validateRide({ ...ok, date: '' }, today).date).toBeTruthy()
  })
  it('catatan maksimal 280', () => {
    expect(validateRide({ ...ok, note: 'a'.repeat(280) }, today).note).toBeUndefined()
    expect(validateRide({ ...ok, note: 'a'.repeat(281) }, today).note).toBeTruthy()
  })
})

describe('findDuplicate (BR-022)', () => {
  const r = { id: 'a', date: '2026-11-17', distanceKm: 18, movingSec: 3600 } as Ride
  const cand = { date: '2026-11-17', distanceKm: 18, movingSec: 3600 }
  it('sama persis → duplikat', () => expect(findDuplicate([r], cand)).toBe(r))
  it('beda salah satu → bukan duplikat', () => {
    expect(findDuplicate([r], { ...cand, distanceKm: 18.1 })).toBeUndefined()
    expect(findDuplicate([r], { ...cand, movingSec: 3601 })).toBeUndefined()
    expect(findDuplicate([r], { ...cand, date: '2026-11-16' })).toBeUndefined()
  })
  it('mengabaikan dirinya sendiri saat edit', () =>
    expect(findDuplicate([r], cand, 'a')).toBeUndefined())
})

describe('util', () => {
  it('toMovingSec', () => {
    expect(toMovingSec('1', '30', parseAngka)).toBe(5400)
    expect(toMovingSec('', '45', parseAngka)).toBe(2700)
    expect(toMovingSec('x', '5', parseAngka)).toBeNull()
  })
  it('toLocalDate memakai waktu lokal', () => {
    expect(toLocalDate(new Date(2026, 10, 7, 23, 59))).toBe('2026-11-07')
  })
  it('formatDuration', () => {
    expect(formatDuration(5400)).toBe('1 j 30 mnt')
    expect(formatDuration(2700)).toBe('45 mnt')
    expect(formatDuration(3599)).toBe('1 j 0 mnt')
  })
})
