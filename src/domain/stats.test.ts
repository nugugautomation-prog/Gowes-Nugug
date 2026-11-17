import { describe, expect, it } from 'vitest'
import type { Ride } from '../db/types'
import {
  addDays,
  lastWeeks,
  monthProgress,
  totalsForWeek,
  validateTarget,
  weekAvgSpeed,
  weekStart,
  weeklyTargetKm,
  weeksInMonth,
} from './stats'

const ride = (date: string, km: number, sec = 3600, ele = 10): Ride =>
  ({ id: date + km, date, distanceKm: km, movingSec: sec, elevationM: ele }) as Ride

describe('pekan (BR-002)', () => {
  it('weekStart = Senin', () => {
    expect(weekStart('2026-11-16')).toBe('2026-11-16') // Senin
    expect(weekStart('2026-11-22')).toBe('2026-11-16') // Minggu
    expect(weekStart('2026-11-17')).toBe('2026-11-16') // Selasa
    expect(weekStart('2026-11-01')).toBe('2026-10-26') // Minggu, lintas bulan
  })
  it('addDays lintas bulan dan tahun', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('weeksInMonth (BR-012)', () => {
  it('bulan 30 hari mulai Kamis = 5 pekan (contoh BR-012)', () => {
    // Juni 2023: 30 hari, mulai Kamis → pekan: 29/5, 5/6, 12/6, 19/6, 26/6 = 5
    expect(weeksInMonth(2023, 6)).toBe(5)
  })
  it('Nov 2026 (mulai Minggu, 30 hari) = 6 pekan', () => expect(weeksInMonth(2026, 11)).toBe(6))
  it('Feb 2027 (28 hari, mulai Senin) = 4 pekan', () => expect(weeksInMonth(2027, 2)).toBe(4))
})

describe('weeklyTargetKm (AC-005)', () => {
  it('130 ÷ jumlah pekan bulan itu', () => {
    expect(weeklyTargetKm(130, 2023, 6)).toBe(26)
    expect(weeklyTargetKm(130, 2027, 2)).toBe(32.5)
  })
})

describe('agregasi pekan', () => {
  const rides = [
    ride('2026-11-15', 99), // Minggu pekan lalu
    ride('2026-11-16', 10, 1800, 50), // Senin
    ride('2026-11-16', 5, 900, 20), // dua gowes di hari sama
    ride('2026-11-22', 20, 3600, 100), // Minggu
    ride('2026-11-23', 99), // Senin pekan depan
  ]
  it('total satu pekan Senin–Minggu', () => {
    const w = totalsForWeek(rides, '2026-11-16')
    expect(w).toMatchObject({ count: 3, distanceKm: 35, movingSec: 6300, elevationM: 170 })
  })
  it('lastWeeks selalu 8 batang, terlama → berjalan, kosong = 0', () => {
    const ws = lastWeeks(rides, '2026-11-18')
    expect(ws).toHaveLength(8)
    expect(ws[7]?.weekStart).toBe('2026-11-16')
    expect(ws[0]?.weekStart).toBe('2026-09-28')
    expect(ws[0]?.distanceKm).toBe(0)
    expect(ws[7]?.distanceKm).toBe(35)
  })
  it('lastWeeks tanpa data tidak menghasilkan NaN', () => {
    const ws = lastWeeks([], '2026-11-18')
    expect(ws.every((w) => w.distanceKm === 0 && weekAvgSpeed(w) === 0)).toBe(true)
  })
  it('weekAvgSpeed = total jarak ÷ total waktu', () => {
    expect(weekAvgSpeed(totalsForWeek(rides, '2026-11-16'))).toBeCloseTo(35 / 1.75)
  })
})

describe('monthProgress (BR-013)', () => {
  it('menghitung total bulan berjalan dan persen', () => {
    const p = monthProgress([ride('2026-11-02', 42), ride('2026-10-30', 50)], '2026-11', 100)
    expect(p.totalKm).toBe(42)
    expect(p.percent).toBe(42)
    expect(p.barPercent).toBe(42)
  })
  it('lebih dari target: angka asli tampil, batang maksimum 100', () => {
    const p = monthProgress([ride('2026-11-02', 112)], '2026-11', 100)
    expect(p.percent).toBe(112)
    expect(p.barPercent).toBe(100)
  })
  it('target 0 tidak menghasilkan Infinity', () => {
    expect(monthProgress([ride('2026-11-02', 5)], '2026-11', 0).percent).toBe(0)
  })
})

describe('validateTarget', () => {
  it('batas', () => {
    expect(validateTarget(130)).toBeNull()
    expect(validateTarget(null)).toBeTruthy()
    expect(validateTarget(0)).toBeTruthy()
    expect(validateTarget(10_001)).toBeTruthy()
  })
})
