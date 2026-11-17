import type { Journal, Sleep } from '../db/types'

export const WATER_TARGET_ML = 2500
/** Ambang air "cukup" di akhir hari (BR-011). */
export const WATER_FULL_THRESHOLD_ML = 2000
export const MORNING_CUTOFF_HOUR = 11
export const WATER_RAMP_START_HOUR = 7
export const WATER_RAMP_END_HOUR = 19
export const MAX_KID_MINUTES = 1440

/** BR-011: ambangAir(jam) = 2000 × clamp((jam − 07:00) / (19:00 − 07:00), 0, 1). `hour` desimal. */
export function waterThreshold(hour: number): number {
  const t = (hour - WATER_RAMP_START_HOUR) / (WATER_RAMP_END_HOUR - WATER_RAMP_START_HOUR)
  return WATER_FULL_THRESHOLD_ML * Math.min(1, Math.max(0, t))
}

const SLEEP_POINTS: Record<Sleep, number> = { segar: 2, cukup: 1, kurang: 0 }

export type ReadinessStatus = 'netral' | 'siap' | 'santai' | 'istirahat'

export interface Readiness {
  status: ReadinessStatus
  /** 0–4; null bila netral (jurnal kemarin belum ada). */
  score: number | null
}

export interface ReadinessInput {
  /** Jurnal kemarin; undefined = belum diisi → netral (B8, AC-007). */
  journalYesterday: Pick<Journal, 'sleep' | 'fruitPortions'> | undefined
  hydrationTodayMl: number
  hydrationYesterdayMl: number
  /** Jam lokal saat ini, desimal (16:30 → 16.5). */
  hour: number
}

/**
 * BR-001 + BR-011 (+ D-20). Sebelum 11:00 poin air memakai total kemarin (≥ 2.000 ml);
 * sejak 11:00 memakai ambang proporsional jam terhadap total hari ini.
 */
export function computeReadiness(i: ReadinessInput): Readiness {
  const j = i.journalYesterday
  if (!j) return { status: 'netral', score: null }
  const waterOk =
    i.hour < MORNING_CUTOFF_HOUR
      ? i.hydrationYesterdayMl >= WATER_FULL_THRESHOLD_ML
      : i.hydrationTodayMl >= waterThreshold(i.hour)
  const score = SLEEP_POINTS[j.sleep] + (j.fruitPortions >= 2 ? 1 : 0) + (waterOk ? 1 : 0)
  const status: ReadinessStatus = score >= 3 ? 'siap' : score === 2 ? 'santai' : 'istirahat'
  return { status, score }
}

/** BR-023: koreksi mengurangi dengan batas bawah 0. */
export function applyWater(currentMl: number, deltaMl: number): number {
  return Math.max(0, Math.round(currentMl + deltaMl))
}

export type JournalErrors = Partial<Record<'sleep' | 'fruitPortions' | 'kidMinutes', string>>

/** VAL-004: buah dan menit bilangan bulat ≥ 0 (menit ≤ 1.440); tidur wajib dipilih. */
export function validateJournal(v: {
  sleep: Sleep | null
  fruitPortions: number
  kidMinutes: number
}): JournalErrors {
  const e: JournalErrors = {}
  if (!v.sleep) e.sleep = 'Pilih kualitas tidur'
  if (!Number.isInteger(v.fruitPortions) || v.fruitPortions < 0)
    e.fruitPortions = 'Porsi buah harus bilangan bulat 0 atau lebih'
  if (!Number.isInteger(v.kidMinutes) || v.kidMinutes < 0 || v.kidMinutes > MAX_KID_MINUTES)
    e.kidMinutes = `Menit harus antara 0 dan ${MAX_KID_MINUTES}`
  return e
}

/** Teks status ramah, bukan medis (BR-004). Ikon + teks; warna hanya pendukung. */
export const READINESS_TEXT: Record<
  ReadinessStatus,
  { icon: string; label: string; sentence: string }
> = {
  siap: { icon: '✓', label: 'Siap', sentence: 'Kondisimu bagus untuk gowes hari ini.' },
  santai: { icon: '~', label: 'Santai', sentence: 'Cukup santai saja hari ini.' },
  istirahat: {
    icon: '!',
    label: 'Istirahat',
    sentence: 'Hari ini cocok untuk lebih santai dan memulihkan diri.',
  },
  netral: {
    icon: '–',
    label: 'Belum ada data',
    sentence: 'Isi jurnal kemarin di tab Harian untuk melihat kesiapanmu.',
  },
}
