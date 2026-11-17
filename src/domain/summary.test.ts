import { describe, expect, it } from 'vitest'
import type { BodyLog, ChecklistDay, Ride } from '../db/types'
import { balanceForMonth, dominantMood, weeklySummary, type SummaryData } from './summary'

const ride = (o: Partial<Ride>): Ride => ({
  id: Math.random().toString(),
  date: '2026-11-10',
  source: 'manual',
  distanceKm: 10,
  movingSec: 1800,
  elevationM: 50,
  category: 'hari_kerja',
  type: 'metime',
  condition: 1,
  hasTrack: false,
  createdAt: 0,
  updatedAt: 0,
  ...o,
})
const body = (o: Partial<BodyLog>): BodyLog => ({ date: '2026-11-10', updatedAt: 0, ...o })

const empty: SummaryData = {
  rides: [],
  bodyLogs: [],
  checklistDays: [],
  idealWeightKg: null,
}

// Senin 2026-11-09 .. Minggu 2026-11-15; pekan lalu mulai 2026-11-02.
const WEEK = '2026-11-09'

describe('weeklySummary — minggu kosong (AC-014)', () => {
  it('semua nilai null/0 tanpa NaN atau Infinity', () => {
    const s = weeklySummary(empty, WEEK, '2026-11-20')
    expect(s.hasData).toBe(false)
    expect(s.totals.count).toBe(0)
    expect(s.weightChangeKg).toBeNull()
    expect(s.mood).toBeNull()
    expect(s.checklistPercent).toBeNull()
    expect(s.comparison.perRideDelta).toBeNull()
    expect(JSON.stringify(s)).not.toMatch(/NaN|Infinity|null.*undefined/)
  })
})

describe('weeklySummary — pekan berjalan', () => {
  it('hari ke-3 → "baru 3 dari 7", perbandingan per hari', () => {
    const s = weeklySummary(
      {
        ...empty,
        rides: [
          ride({ date: '2026-11-09', distanceKm: 30 }),
          ride({ date: '2026-11-03', distanceKm: 70 }), // pekan lalu: 70 km → 10 km/hari
        ],
      },
      WEEK,
      '2026-11-11',
    )
    expect(s.daysElapsed).toBe(3)
    expect(s.partial).toBe(true)
    expect(s.comparison.basis).toBe('perHari')
    expect(s.comparison.distanceDelta).toBeCloseTo(0) // 30/3 − 70/7
  })

  it('hari Senin = hari ke-1; Minggu = penuh (tidak partial)', () => {
    expect(weeklySummary(empty, WEEK, WEEK).daysElapsed).toBe(1)
    const full = weeklySummary(empty, WEEK, '2026-11-15')
    expect(full.daysElapsed).toBe(7)
    expect(full.partial).toBe(false)
  })

  it('pekan lampau = total vs total', () => {
    const s = weeklySummary(
      {
        ...empty,
        rides: [
          ride({ date: '2026-11-10', distanceKm: 40 }),
          ride({ date: '2026-11-04', distanceKm: 25 }),
        ],
      },
      WEEK,
      '2026-11-30',
    )
    expect(s.comparison.basis).toBe('total')
    expect(s.comparison.distanceDelta).toBe(15)
    expect(s.comparison.perRideDelta).toBe(15)
    expect(s.comparison.hasPrevious).toBe(true)
  })

  it('pekan lalu kosong → hasPrevious false, tanpa NaN', () => {
    const s = weeklySummary({ ...empty, rides: [ride({})] }, WEEK, '2026-11-30')
    expect(s.comparison.hasPrevious).toBe(false)
    expect(s.comparison.perRideDelta).toBeNull()
  })
})

describe('weeklySummary — jumlah', () => {
  it('total gowes, km, elevasi pekan', () => {
    const s = weeklySummary(
      {
        ...empty,
        rides: [ride({ distanceKm: 12.5 }), ride({ distanceKm: 7.5, date: '2026-11-15' })],
      },
      WEEK,
      '2026-11-30',
    )
    expect(s.totals.count).toBe(2)
    expect(s.totals.distanceKm).toBe(20)
    expect(s.totals.elevationM).toBe(100)
  })
})

describe('weeklySummary — berat', () => {
  const logs = [
    body({ date: '2026-11-05', weightKg: 82 }),
    body({ date: '2026-11-09', weightKg: 81.5 }),
    body({ date: '2026-11-12', weightKg: 80.9 }),
  ]
  it('perubahan = berat terakhir pekan − berat terakhir sebelum pekan', () => {
    const s = weeklySummary({ ...empty, bodyLogs: logs, idealWeightKg: 78 }, WEEK, '2026-11-30')
    expect(s.latestWeightKg).toBe(80.9)
    expect(s.weightChangeKg).toBe(-1.1)
    expect(s.gapToIdealKg).toBe(2.9)
  })
  it('tanpa berat sebelum pekan → "belum ada data" (null)', () => {
    const s = weeklySummary({ ...empty, bodyLogs: logs.slice(1) }, WEEK, '2026-11-30')
    expect(s.weightChangeKg).toBeNull()
    expect(s.gapToIdealKg).toBeNull() // target belum diatur
  })
  it('tanpa berat pekan ini → null', () => {
    const s = weeklySummary({ ...empty, bodyLogs: logs.slice(0, 1) }, WEEK, '2026-11-30')
    expect(s.weightChangeKg).toBeNull()
    expect(s.latestWeightKg).toBeNull()
  })
})

describe('dominantMood', () => {
  it('paling sering menang', () => {
    expect(
      dominantMood([
        body({ date: '2026-11-09', mood: 0 }),
        body({ date: '2026-11-10', mood: 2 }),
        body({ date: '2026-11-11', mood: 2 }),
      ]),
    ).toBe(2)
  })
  it('seri → yang terbaru', () => {
    expect(
      dominantMood([
        body({ date: '2026-11-09', mood: 0 }),
        body({ date: '2026-11-10', mood: 0 }),
        body({ date: '2026-11-11', mood: 2 }),
        body({ date: '2026-11-12', mood: 2 }),
      ]),
    ).toBe(2)
    expect(
      dominantMood([
        body({ date: '2026-11-12', mood: 1 }), // urutan input acak
        body({ date: '2026-11-09', mood: 0 }),
      ]),
    ).toBe(1)
  })
  it('tanpa mood → null; baris tanpa mood diabaikan', () => {
    expect(dominantMood([])).toBeNull()
    expect(dominantMood([body({ weightKg: 80 })])).toBeNull()
  })
})

describe('weeklySummary — checklist', () => {
  const day = (date: string, itemId: string, done: boolean): ChecklistDay => ({
    date,
    itemId,
    title: itemId,
    done,
  })
  it('% hanya dari hari yang punya baris', () => {
    const s = weeklySummary(
      {
        ...empty,
        checklistDays: [
          day('2026-11-09', 'a', true),
          day('2026-11-09', 'b', false),
          day('2026-11-10', 'a', true),
          day('2026-11-10', 'b', true),
        ],
      },
      WEEK,
      '2026-11-30',
    )
    expect(s.checklistPercent).toBe(75) // 3 dari 4; 5 hari lain tak dihitung
  })
})

describe('balanceForMonth (BR-018)', () => {
  it('nol gowes → belum ada data', () => {
    const b = balanceForMonth([], '2026-11')
    expect(b.metimePercent).toBeNull()
    expect(b.kidPercent).toBeNull()
  })
  it('persentase menjumlah 100 dan hanya bulan itu', () => {
    const b = balanceForMonth(
      [
        ride({ type: 'metime' }),
        ride({ type: 'metime' }),
        ride({ type: 'bareng_anak' }),
        ride({ type: 'bareng_anak', date: '2026-10-30' }),
      ],
      '2026-11',
    )
    expect(b).toMatchObject({ total: 3, metime: 2, kid: 1, metimePercent: 67, kidPercent: 33 })
    expect((b.metimePercent ?? 0) + (b.kidPercent ?? 0)).toBe(100)
  })
})
