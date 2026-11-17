import type { Condition, Ride, RideCategory, RideType } from '../db/types'

export const MAX_DISTANCE_KM = 300
export const MAX_ELEVATION_M = 10_000
export const MAX_AVG_SPEED_KMH = 70
export const MAX_NOTE_LENGTH = 280

/** 'YYYY-MM-DD' menurut waktu lokal HP (bukan UTC). */
export function toLocalDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Hari dalam pekan (0 = Minggu) dari teks 'YYYY-MM-DD', tanpa pergeseran zona waktu. */
function weekday(date: string): number {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

/**
 * BR-010 kategori waktu otomatis. `startHour` = jam mulai (0–23, waktu lokal).
 * Form manual tidak punya jam mulai, jadi Sabtu → sabtu_sore dan Minggu → minggu_pagi
 * (pola gowes yang dituju); pengguna bisa menggantinya (FR-015).
 */
export function categoryFor(date: string, startHour?: number): RideCategory {
  const day = weekday(date)
  if (day >= 1 && day <= 5) return 'hari_kerja'
  if (day === 6) return startHour === undefined || startHour >= 12 ? 'sabtu_sore' : 'lainnya'
  return startHour === undefined || startHour < 12 ? 'minggu_pagi' : 'lainnya'
}

/** BR-006: kecepatan rata-rata = jarak ÷ waktu bergerak. 0 bila waktu 0 (tanpa NaN/Infinity). */
export function avgSpeedKmh(distanceKm: number, movingSec: number): number {
  if (!(movingSec > 0) || !(distanceKm >= 0)) return 0
  return distanceKm / (movingSec / 3600)
}

export interface RideInput {
  date: string
  distanceKm: number | null
  movingSec: number | null
  elevationM: number | null
  note: string
}

export type RideErrors = Partial<
  Record<'date' | 'distanceKm' | 'movingSec' | 'elevationM' | 'note', string>
>

/** VAL-001 dan VAL-002. `today` = tanggal lokal hari ini. Pesan berbahasa sehari-hari. */
export function validateRide(input: RideInput, today: string): RideErrors {
  const e: RideErrors = {}
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) e.date = 'Pilih tanggal gowes'
  else if (input.date > today) e.date = 'Tanggal tidak boleh di masa depan'

  if (input.distanceKm === null) e.distanceKm = 'Isi jarak dalam km'
  else if (input.distanceKm <= 0) e.distanceKm = 'Jarak harus lebih dari 0'
  else if (input.distanceKm > MAX_DISTANCE_KM) e.distanceKm = `Jarak maksimal ${MAX_DISTANCE_KM} km`

  if (input.movingSec === null || input.movingSec <= 0) e.movingSec = 'Waktu harus lebih dari 0'

  if (input.elevationM === null) e.elevationM = 'Isi elevasi (0 jika datar)'
  else if (input.elevationM < 0) e.elevationM = 'Elevasi tidak boleh negatif'
  else if (input.elevationM > MAX_ELEVATION_M)
    e.elevationM = `Elevasi maksimal ${MAX_ELEVATION_M} m`

  if (input.note.length > MAX_NOTE_LENGTH) e.note = `Catatan maksimal ${MAX_NOTE_LENGTH} karakter`
  return e
}

/** VAL-001: peringatan (tidak memblokir) bila kecepatan rata-rata tak masuk akal. */
export function isSpeedSuspicious(distanceKm: number, movingSec: number): boolean {
  return avgSpeedKmh(distanceKm, movingSec) > MAX_AVG_SPEED_KMH
}

/** BR-022: duplikat = gowes lain dengan tanggal, jarak, dan waktu bergerak sama persis. */
export function findDuplicate(
  rides: Ride[],
  cand: { date: string; distanceKm: number; movingSec: number },
  ignoreId?: string,
): Ride | undefined {
  return rides.find(
    (r) =>
      r.id !== ignoreId &&
      r.date === cand.date &&
      r.distanceKm === cand.distanceKm &&
      r.movingSec === cand.movingSec,
  )
}

/** Jam + menit (kolom form) → detik. Kolom kosong dianggap 0; isi bukan angka → null. */
export function toMovingSec(
  hours: string,
  minutes: string,
  parse: (s: string) => number | null,
): number | null {
  const h = hours.trim() === '' ? 0 : parse(hours)
  const m = minutes.trim() === '' ? 0 : parse(minutes)
  if (h === null || m === null) return null
  return Math.round(h * 3600 + m * 60)
}

export function formatDuration(sec: number): string {
  const total = Math.round(sec / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h} j ${m} mnt` : `${m} mnt`
}

export const CATEGORY_LABEL: Record<RideCategory, string> = {
  hari_kerja: 'Hari Kerja',
  sabtu_sore: 'Sabtu Sore',
  minggu_pagi: 'Minggu Pagi',
  lainnya: 'Lainnya',
}
export const TYPE_LABEL: Record<RideType, string> = {
  metime: 'Me-time',
  bareng_anak: 'Bareng anak',
}
export const CONDITION_EMOJI: Record<Condition, string> = { 0: '😄', 1: '😐', 2: '😫' }
export const CONDITION_LABEL: Record<Condition, string> = { 0: 'Segar', 1: 'Biasa', 2: 'Capek' }
