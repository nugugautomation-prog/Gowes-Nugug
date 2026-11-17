import type { Ride } from '../db/types'
import { avgSpeedKmh } from './ride'

export const QUICK_TARGETS = [80, 100, 120, 150] as const
export const MAX_MONTHLY_TARGET_KM = 10_000
export const CHART_WEEKS = 8

function parse(date: string): Date {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(date: string, n: number): string {
  const d = parse(date)
  d.setDate(d.getDate() + n) // setDate menangani pergantian bulan/tahun & DST
  return fmt(d)
}

/** BR-002: pekan dimulai Senin. Mengembalikan tanggal Senin pekan itu. */
export function weekStart(date: string): string {
  const day = parse(date).getDay() // 0 = Minggu
  return addDays(date, -((day + 6) % 7))
}

/** BR-012: jumlah pekan (Senin–Minggu) yang beririsan dengan bulan itu. month = 1..12. */
export function weeksInMonth(year: number, month: number): number {
  const first = fmt(new Date(year, month - 1, 1))
  const last = fmt(new Date(year, month, 0))
  const days = (a: string, b: string) =>
    Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5)
  return days(weekStart(first), weekStart(last)) / 7 + 1
}

/** BR-008/012: garis target mingguan = target bulanan ÷ jumlah pekan bulan itu. */
export function weeklyTargetKm(monthlyKm: number, year: number, month: number): number {
  return monthlyKm / weeksInMonth(year, month)
}

export interface WeekTotals {
  weekStart: string
  count: number
  distanceKm: number
  movingSec: number
  elevationM: number
}

function emptyWeek(start: string): WeekTotals {
  return { weekStart: start, count: 0, distanceKm: 0, movingSec: 0, elevationM: 0 }
}

/** Total satu pekan (Senin `start` s/d Minggu) dari daftar gowes. */
export function totalsForWeek(rides: Ride[], start: string): WeekTotals {
  const end = addDays(start, 6)
  const w = emptyWeek(start)
  for (const r of rides) {
    if (r.date < start || r.date > end) continue
    w.count += 1
    w.distanceKm += r.distanceKm
    w.movingSec += r.movingSec
    w.elevationM += r.elevationM
  }
  return w
}

/** 8 pekan terakhir (terlama → pekan berjalan), selalu 8 batang walau kosong. */
export function lastWeeks(rides: Ride[], today: string, count = CHART_WEEKS): WeekTotals[] {
  const current = weekStart(today)
  return Array.from({ length: count }, (_, i) =>
    totalsForWeek(rides, addDays(current, -7 * (count - 1 - i))),
  )
}

export interface MonthProgress {
  totalKm: number
  targetKm: number
  /** Persen sebenarnya (bisa > 100). */
  percent: number
  /** Untuk lebar batang: maksimum 100 (BR-013). */
  barPercent: number
}

/** BR-013. `month` = 'YYYY-MM'. */
export function monthProgress(rides: Ride[], month: string, targetKm: number): MonthProgress {
  const totalKm = rides
    .filter((r) => r.date.startsWith(month))
    .reduce((s, r) => s + r.distanceKm, 0)
  const percent = targetKm > 0 ? (totalKm * 100) / targetKm : 0
  return { totalKm, targetKm, percent, barPercent: Math.min(100, percent) }
}

/** FR-020: kecepatan rata-rata total pekan, tanpa NaN. */
export function weekAvgSpeed(w: WeekTotals): number {
  return avgSpeedKmh(w.distanceKm, w.movingSec)
}

/** VAL target: angka > 0 dan ≤ batas wajar. Mengembalikan pesan galat atau null. */
export function validateTarget(km: number | null): string | null {
  if (km === null) return 'Isi target dalam km'
  if (km <= 0) return 'Target harus lebih dari 0'
  if (km > MAX_MONTHLY_TARGET_KM) return `Target maksimal ${MAX_MONTHLY_TARGET_KM} km`
  return null
}
