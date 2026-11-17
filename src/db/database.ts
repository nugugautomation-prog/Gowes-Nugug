import Dexie, { type EntityTable, type Table } from 'dexie'
import type {
  ActivePoint,
  ActiveRecording,
  BodyLog,
  ChecklistDay,
  ChecklistItem,
  Hydration,
  Journal,
  KidCheck,
  Ride,
  SettingRow,
  TrackPoint,
} from './types'

export const SCHEMA_VERSION = 1

/**
 * Skema berversi. Perubahan skema = tambah `this.version(n+1)` + fungsi `.upgrade()` + uji
 * (DATA-MODEL bagian 5). Jangan mengubah deklarasi versi yang sudah dirilis.
 */
export class GowesDB extends Dexie {
  rides!: EntityTable<Ride, 'id'>
  track_points!: Table<TrackPoint, [string, number]>
  active_recording!: EntityTable<ActiveRecording, 'id'>
  active_points!: EntityTable<ActivePoint, 'seq'>
  journals!: EntityTable<Journal, 'date'>
  hydration!: EntityTable<Hydration, 'date'>
  body_logs!: EntityTable<BodyLog, 'date'>
  checklist_items!: EntityTable<ChecklistItem, 'id'>
  checklist_days!: Table<ChecklistDay, [string, string]>
  kid_checks!: EntityTable<KidCheck, 'activityId'>
  settings!: EntityTable<SettingRow, 'key'>

  constructor(name = 'gowessehat') {
    super(name)
    this.version(1).stores({
      rides: 'id, date, source',
      track_points: '[rideId+seq], rideId',
      active_recording: 'id',
      active_points: 'seq',
      journals: 'date',
      hydration: 'date',
      body_logs: 'date',
      checklist_items: 'id, order',
      checklist_days: '[date+itemId], date',
      kid_checks: 'activityId',
      settings: 'key',
    })
  }
}

export const db = new GowesDB()
