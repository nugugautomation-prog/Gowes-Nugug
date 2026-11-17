import type { BodyLog, ChecklistDay, Condition, Hydration, Journal, Ride, Sleep } from '../db/types'
import { addDays, totalsForWeek, type WeekTotals } from './stats'

/** Bahan ringkasan: semua data mentah; fungsi di sini murni (tanpa DB/jam). */
export interface SummaryData {
  rides: Ride[]
  journals: Journal[]
  hydration: Hydration[]
  bodyLogs: BodyLog[]
  checklistDays: ChecklistDay[]
  idealWeightKg: number | null
}

const SLEEP_SCORE: Record<Sleep, number> = { segar: 2, cukup: 1, kurang: 0 }

export type SleepWord = 'Segar' | 'Cukup' | 'Kurang'

/** Rata-rata skor tidur (2/1/0) dipetakan ke kata. */
export function sleepWord(avg: number): SleepWord {
  if (avg >= 1.5) return 'Segar'
  if (avg >= 0.5) return 'Cukup'
  return 'Kurang'
}

const inWeek = (date: string, start: string) => date >= start && date <= addDays(start, 6)

/** Rata-rata; daftar kosong → null (bukan NaN). */
export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

/** Mood paling sering; seri → yang terbaru (BR-019). */
export function dominantMood(logs: BodyLog[]): Condition | null {
  const withMood = logs
    .filter((l) => l.mood !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (withMood.length === 0) return null
  const count: Record<number, number> = {}
  let best: Condition | null = null
  for (const l of withMood) {
    const m = l.mood as Condition
    count[m] = (count[m] ?? 0) + 1
  }
  // Urut lama → baru; `>=` membuat mood yang lebih baru menang saat seri.
  let bestCount = 0
  for (const l of withMood) {
    const m = l.mood as Condition
    const c = count[m] ?? 0
    if (c >= bestCount) {
      best = m
      bestCount = c
    }
  }
  return best
}

export interface WeekComparison {
  /** 'total' = dua pekan penuh dibandingkan; 'perHari' = pekan berjalan (adil per hari). */
  basis: 'total' | 'perHari'
  /** Selisih jarak (km): total, atau rata-rata per hari. */
  distanceDelta: number
  /** Selisih rata-rata jarak per gowes; null bila salah satu pekan tak punya gowes. */
  perRideDelta: number | null
  /** Pekan lalu kosong → perbandingan tak bermakna. */
  hasPrevious: boolean
}

export interface WeeklySummary {
  weekStart: string
  weekEnd: string
  /** Pekan berjalan: berapa hari sudah berlalu (1–7); pekan lengkap = 7. */
  daysElapsed: number
  partial: boolean
  totals: WeekTotals
  comparison: WeekComparison
  sleepAvg: number | null
  fruitAvg: number | null
  waterAvgMl: number | null
  kidMinutes: number
  weightChangeKg: number | null
  latestWeightKg: number | null
  gapToIdealKg: number | null
  mood: Condition | null
  checklistPercent: number | null
  /** Ada data sama sekali di pekan ini? */
  hasData: boolean
}

function daysElapsedIn(start: string, today: string): number {
  if (today < start) return 0
  const [y1 = 0, m1 = 1, d1 = 1] = start.split('-').map(Number)
  const [y2 = 0, m2 = 1, d2 = 1] = today.split('-').map(Number)
  const diff = Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 864e5,
  )
  return Math.min(7, diff + 1)
}

/** BR-019. `start` = Senin pekan yang dilihat; `today` menentukan label "baru N dari 7 hari". */
export function weeklySummary(data: SummaryData, start: string, today: string): WeeklySummary {
  const end = addDays(start, 6)
  const daysElapsed = daysElapsedIn(start, today)
  const partial = daysElapsed < 7
  const totals = totalsForWeek(data.rides, start)
  const prev = totalsForWeek(data.rides, addDays(start, -7))

  const perDay = (km: number, days: number) => (days > 0 ? km / days : 0)
  const perRide = (w: WeekTotals) => (w.count > 0 ? w.distanceKm / w.count : null)
  const curPer = perRide(totals)
  const prevPer = perRide(prev)
  const comparison: WeekComparison = {
    basis: partial ? 'perHari' : 'total',
    distanceDelta: partial
      ? perDay(totals.distanceKm, daysElapsed) - prev.distanceKm / 7
      : totals.distanceKm - prev.distanceKm,
    perRideDelta: curPer !== null && prevPer !== null ? curPer - prevPer : null,
    hasPrevious: prev.count > 0,
  }

  const journals = data.journals.filter((j) => inWeek(j.date, start))
  const waters = data.hydration.filter((h) => inWeek(h.date, start))
  const bodies = data.bodyLogs.filter((b) => inWeek(b.date, start))

  const weights = data.bodyLogs
    .filter((b) => b.weightKg !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
  const lastInWeek = [...weights].filter((b) => b.date >= start && b.date <= end).pop()
  const lastBefore = [...weights].filter((b) => b.date < start).pop()
  const latestWeightKg = lastInWeek?.weightKg ?? null
  const weightChangeKg =
    lastInWeek?.weightKg !== undefined && lastBefore?.weightKg !== undefined
      ? Math.round((lastInWeek.weightKg - lastBefore.weightKg) * 10) / 10
      : null
  const gapToIdealKg =
    latestWeightKg !== null && data.idealWeightKg !== null
      ? Math.round((latestWeightKg - data.idealWeightKg) * 10) / 10
      : null

  const cl = data.checklistDays.filter((c) => inWeek(c.date, start))
  const checklistPercent =
    cl.length > 0 ? (cl.filter((c) => c.done).length * 100) / cl.length : null

  const hasData =
    totals.count > 0 ||
    journals.length > 0 ||
    waters.length > 0 ||
    bodies.length > 0 ||
    cl.length > 0

  return {
    weekStart: start,
    weekEnd: end,
    daysElapsed,
    partial,
    totals,
    comparison,
    sleepAvg: mean(journals.map((j) => SLEEP_SCORE[j.sleep])),
    fruitAvg: mean(journals.map((j) => j.fruitPortions)),
    waterAvgMl: mean(waters.map((h) => h.ml)),
    kidMinutes: journals.reduce((s, j) => s + j.kidMinutes, 0),
    weightChangeKg,
    latestWeightKg,
    gapToIdealKg,
    mood: dominantMood(bodies),
    checklistPercent,
    hasData,
  }
}

export interface Balance {
  total: number
  metime: number
  kid: number
  /** Persen bulat; metime + kid = 100. null bila belum ada gowes. */
  metimePercent: number | null
  kidPercent: number | null
}

/** BR-018: porsi jumlah gowes Me-time vs Bareng anak pada bulan `month` ('YYYY-MM'). */
export function balanceForMonth(rides: Ride[], month: string): Balance {
  const m = rides.filter((r) => r.date.startsWith(month))
  const metime = m.filter((r) => r.type === 'metime').length
  const kid = m.length - metime
  if (m.length === 0) return { total: 0, metime: 0, kid: 0, metimePercent: null, kidPercent: null }
  const metimePercent = Math.round((metime * 100) / m.length)
  return { total: m.length, metime, kid, metimePercent, kidPercent: 100 - metimePercent }
}
