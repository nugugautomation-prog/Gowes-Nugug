import type { BodyLog, Condition } from '../db/types'
import { addDays } from './stats'

export const MIN_WEIGHT = 20
export const MAX_WEIGHT = 300
export const MIN_WAIST = 30
export const MAX_WAIST = 200
export const WEIGH_REMINDER_DAYS = 7

export interface BodyInput {
  date: string
  weightKg: number | null
  waistCm: number | null
  mood: Condition | null
}

export type BodyErrors = Partial<Record<'date' | 'weightKg' | 'waistCm' | 'any', string>>

/** VAL-003: berat 20–300, pinggang 30–200, minimal satu dari berat/pinggang/mood terisi. */
export function validateBody(i: BodyInput, today: string): BodyErrors {
  const e: BodyErrors = {}
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date)) e.date = 'Pilih tanggal'
  else if (i.date > today) e.date = 'Tanggal tidak boleh di masa depan'
  if (i.weightKg !== null && (i.weightKg < MIN_WEIGHT || i.weightKg > MAX_WEIGHT))
    e.weightKg = `Berat harus antara ${MIN_WEIGHT} dan ${MAX_WEIGHT} kg`
  if (i.waistCm !== null && (i.waistCm < MIN_WAIST || i.waistCm > MAX_WAIST))
    e.waistCm = `Pinggang harus antara ${MIN_WAIST} dan ${MAX_WAIST} cm`
  if (i.weightKg === null && i.waistCm === null && i.mood === null)
    e.any = 'Isi minimal satu: berat, pinggang, atau mood'
  return e
}

/** Target berat ideal: rentang sama dengan berat badan. Mengembalikan pesan galat atau null. */
export function validateIdealWeight(kg: number | null): string | null {
  if (kg === null) return 'Isi target berat dalam kg'
  if (kg < MIN_WEIGHT || kg > MAX_WEIGHT)
    return `Target harus antara ${MIN_WEIGHT} dan ${MAX_WEIGHT} kg`
  return null
}

/** Satu desimal untuk berat (DATA-MODEL). */
export const roundWeight = (kg: number) => Math.round(kg * 10) / 10

/** Catatan berat terbaru (menurut tanggal) yang punya berat. */
export function latestWeightLog(logs: BodyLog[]): BodyLog | undefined {
  return logs
    .filter((l) => l.weightKg !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
}

export interface TargetGap {
  state: 'tepat' | 'di_atas' | 'di_bawah'
  /** Selisih mutlak dalam kg, 1 desimal. */
  kg: number
}

/** FR-062: jarak berat sekarang ke target. Netral, bukan saran medis (BR-004). */
export function gapToTarget(currentKg: number, idealKg: number): TargetGap {
  const diff = roundWeight(currentKg - idealKg)
  if (diff === 0) return { state: 'tepat', kg: 0 }
  return { state: diff > 0 ? 'di_atas' : 'di_bawah', kg: Math.abs(diff) }
}

/** FR-061: saran mingguan menimbang. true bila belum ada berat, atau terakhir ≥ 7 hari lalu. */
export function shouldSuggestWeighing(logs: BodyLog[], today: string): boolean {
  const last = latestWeightLog(logs)
  if (!last) return true
  return last.date <= addDays(today, -WEIGH_REMINDER_DAYS)
}
