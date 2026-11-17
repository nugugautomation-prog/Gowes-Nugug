// Tipe data sesuai docs/DATA-MODEL.md. date = 'YYYY-MM-DD' (lokal); ts = ms epoch.

export type RideSource = 'recorded' | 'manual'
export type RideCategory = 'hari_kerja' | 'sabtu_sore' | 'minggu_pagi' | 'lainnya'
export type RideType = 'metime' | 'bareng_anak'
export type Condition = 0 | 1 | 2 // 😄 😐 😫

export interface Ride {
  id: string
  date: string
  source: RideSource
  distanceKm: number
  movingSec: number
  elevationM: number
  category: RideCategory
  type: RideType
  condition: Condition
  note?: string
  startedAt?: number
  elapsedSec?: number
  maxSpeedKmh?: number
  hasTrack: boolean
  createdAt: number
  updatedAt: number
}

export interface TrackPoint {
  rideId: string
  seq: number
  ts: number
  lat: number
  lon: number
  ele?: number
  acc: number
  paused: boolean
}

export interface ActivePoint {
  seq: number
  ts: number
  lat: number
  lon: number
  ele?: number
  acc: number
  paused: boolean
}

export interface ActiveRecording {
  id: 'current'
  startedAt: number
  state: 'merekam' | 'jeda' | 'terputus'
  pausedTotalSec: number
  lastPointTs: number
  distanceKm: number
  movingSec: number
  elevationM: number
  maxSpeedKmh?: number
}

export type Sleep = 'segar' | 'cukup' | 'kurang'

export interface Journal {
  date: string
  sleep: Sleep
  fruitPortions: number
  kidMinutes: number
  createdAt: number
  updatedAt: number
}

export interface Hydration {
  date: string
  ml: number
}

export interface BodyLog {
  date: string
  weightKg?: number
  waistCm?: number
  mood?: Condition
  updatedAt: number
}

export interface ChecklistItem {
  id: string
  title: string
  order: number
  active: boolean
  createdAt: number
}

export interface ChecklistDay {
  date: string
  itemId: string
  title: string
  done: boolean
}

export interface KidCheck {
  activityId: string
  done: boolean
  updatedAt: number
}

export interface ReminderTimes {
  minum: string[]
  jurnal: string
  sabtu: string
  minggu: string
}

/** Pengaturan (kunci-nilai). Nilai awal ada di settings.ts. */
export interface Settings {
  monthlyTargetKm: number
  idealWeightKg: number | null
  reminderTimes: ReminderTimes
  lastBackupAt: number | null
  lastImportAt: number | null
  backupSnoozeUntil: number | null
  mapStyleUrl: string
  safetyNoticeSeen: boolean
  schemaVersion: number
}

export interface SettingRow {
  key: keyof Settings
  value: Settings[keyof Settings]
}
