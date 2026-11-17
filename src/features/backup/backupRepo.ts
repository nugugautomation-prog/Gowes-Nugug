import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type GowesDB } from '../../db/database'
import { DEFAULT_SETTINGS, getSetting, setSetting } from '../../db/settings'
import type { Settings } from '../../db/types'
import { backupDue, buildBackup, type BackupData, type BackupDueInput } from '../../domain/backup'

const SETTING_KEYS = [
  'monthlyTargetKm',
  'idealWeightKg',
  'reminderTimes',
  'lastBackupAt',
  'lastImportAt',
  'backupSnoozeUntil',
  'mapStyleUrl',
  'safetyNoticeSeen',
] as const

/** Baca seluruh data (satu snapshot konsisten). */
export async function readAll(db: GowesDB = defaultDb): Promise<BackupData> {
  return db.transaction(
    'r',
    [
      db.rides,
      db.track_points,
      db.journals,
      db.hydration,
      db.body_logs,
      db.checklist_items,
      db.checklist_days,
      db.kid_checks,
      db.settings,
    ],
    async () => {
      const settings: Partial<Settings> = {}
      for (const k of SETTING_KEYS)
        (settings as Record<string, unknown>)[k] = await getSetting(db, k)
      return {
        rides: await db.rides.toArray(),
        trackPoints: await db.track_points.toArray(),
        journals: await db.journals.toArray(),
        hydration: await db.hydration.toArray(),
        bodyLogs: await db.body_logs.toArray(),
        checklistItems: await db.checklist_items.toArray(),
        checklistDays: await db.checklist_days.toArray(),
        kidChecks: await db.kid_checks.toArray(),
        settings,
      }
    },
  )
}

/** Teks JSON cadangan. Tidak mengubah `lastBackupAt` — itu dicatat setelah unduhan dimulai. */
export async function exportBackup(
  includeTracks: boolean,
  db: GowesDB = defaultDb,
  nowMs = Date.now(),
): Promise<string> {
  return JSON.stringify(buildBackup(await readAll(db), includeTracks, nowMs))
}

export async function markBackedUp(db: GowesDB = defaultDb, nowMs = Date.now()): Promise<void> {
  await setSetting(db, 'lastBackupAt', nowMs)
  await setSetting(db, 'backupSnoozeUntil', null)
}

export async function snoozeBackup(db: GowesDB = defaultDb, nowMs = Date.now()): Promise<void> {
  await setSetting(db, 'backupSnoozeUntil', nowMs + 864e5)
}

export class ImportBlockedError extends Error {}

/**
 * Impor = ganti semua data (D-22). Semua-atau-tidak-sama-sekali dalam satu transaksi;
 * ditolak bila ada rekaman aktif. `schemaVersion` mengikuti aplikasi ini.
 */
export async function importBackup(
  data: BackupData,
  db: GowesDB = defaultDb,
  nowMs = Date.now(),
): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.active_recording,
      db.rides,
      db.track_points,
      db.journals,
      db.hydration,
      db.body_logs,
      db.checklist_items,
      db.checklist_days,
      db.kid_checks,
      db.settings,
    ],
    async () => {
      if ((await db.active_recording.count()) > 0)
        throw new ImportBlockedError('Selesaikan atau batalkan rekaman yang sedang berjalan dulu.')
      await Promise.all(
        [
          db.rides,
          db.track_points,
          db.journals,
          db.hydration,
          db.body_logs,
          db.checklist_items,
          db.checklist_days,
          db.kid_checks,
          db.settings,
        ].map((t) => t.clear()),
      )
      await db.rides.bulkAdd(data.rides)
      await db.track_points.bulkAdd(data.trackPoints)
      await db.journals.bulkAdd(data.journals)
      await db.hydration.bulkAdd(data.hydration)
      await db.body_logs.bulkAdd(data.bodyLogs)
      await db.checklist_items.bulkAdd(data.checklistItems)
      await db.checklist_days.bulkAdd(data.checklistDays)
      await db.kid_checks.bulkAdd(data.kidChecks)
      const merged = { ...DEFAULT_SETTINGS, ...data.settings, lastImportAt: nowMs }
      merged.schemaVersion = DEFAULT_SETTINGS.schemaVersion
      await db.settings.bulkAdd(
        (Object.keys(merged) as (keyof Settings)[]).map((key) => ({ key, value: merged[key] })),
      )
    },
  )
}

export interface DataCounts {
  rides: number
  trackPoints: number
  journals: number
  bodyLogs: number
}

export const countsOf = (d: BackupData): DataCounts => ({
  rides: d.rides.length,
  trackPoints: d.trackPoints.length,
  journals: d.journals.length,
  bodyLogs: d.bodyLogs.length,
})

export async function currentCounts(db: GowesDB = defaultDb): Promise<DataCounts> {
  return {
    rides: await db.rides.count(),
    trackPoints: await db.track_points.count(),
    journals: await db.journals.count(),
    bodyLogs: await db.body_logs.count(),
  }
}

export async function recordingActive(db: GowesDB = defaultDb): Promise<boolean> {
  return (await db.active_recording.count()) > 0
}

/** Bahan BR-021 dari database. */
export async function readDueInput(
  db: GowesDB = defaultDb,
  nowMs = Date.now(),
): Promise<BackupDueInput> {
  const [rides, journals, bodies] = await Promise.all([
    db.rides.toArray(),
    db.journals.toArray(),
    db.body_logs.toArray(),
  ])
  const stamps = [
    ...rides.map((r) => r.createdAt),
    ...journals.map((j) => j.createdAt),
    ...bodies.map((b) => b.updatedAt),
  ]
  return {
    nowMs,
    lastBackupAt: await getSetting(db, 'lastBackupAt'),
    snoozeUntil: await getSetting(db, 'backupSnoozeUntil'),
    rideCreatedAts: rides.map((r) => r.createdAt),
    firstDataAt: stamps.length ? Math.min(...stamps) : null,
  }
}

/** Apakah pengingat cadangan perlu tampil; ikut menyegarkan saat data berubah. */
export function useBackupDue(nowMs: number): boolean {
  return useLiveQuery(async () => backupDue(await readDueInput(defaultDb, nowMs)), [nowMs]) ?? false
}
