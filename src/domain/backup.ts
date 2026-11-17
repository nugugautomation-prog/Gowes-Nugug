import { z } from 'zod'
import type {
  BodyLog,
  ChecklistDay,
  ChecklistItem,
  Hydration,
  Journal,
  KidCheck,
  Ride,
  Settings,
  TrackPoint,
} from '../db/types'

export const BACKUP_APP = 'gowessehat'
export const BACKUP_SCHEMA_VERSION = 1
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024
export const BACKUP_DAYS = 14
export const BACKUP_RIDES = 10

/** Titik ringkas: [rideId, seq, ts, lat, lon, ele|null, acc, paused 0/1]. */
export type PackedPoint = [string, number, number, number, number, number | null, number, 0 | 1]

export interface BackupData {
  rides: Ride[]
  trackPoints: TrackPoint[]
  journals: Journal[]
  hydration: Hydration[]
  bodyLogs: BodyLog[]
  checklistItems: ChecklistItem[]
  checklistDays: ChecklistDay[]
  kidChecks: KidCheck[]
  settings: Partial<Settings>
}

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const ts = z.number().int().nonnegative().finite()
const num = (min: number, max: number) => z.number().finite().min(min).max(max)
const cond = z.union([z.literal(0), z.literal(1), z.literal(2)])
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

const rideS = z.object({
  id: z.string().min(1).max(100),
  date,
  source: z.enum(['recorded', 'manual']),
  distanceKm: num(0, 10_000),
  movingSec: num(0, 10_000_000),
  elevationM: num(0, 100_000),
  category: z.enum(['hari_kerja', 'sabtu_sore', 'minggu_pagi', 'lainnya']),
  type: z.enum(['metime', 'bareng_anak']),
  condition: cond,
  note: z.string().max(280).optional(),
  startedAt: ts.optional(),
  elapsedSec: num(0, 10_000_000).optional(),
  maxSpeedKmh: num(0, 500).optional(),
  hasTrack: z.boolean(),
  createdAt: ts,
  updatedAt: ts,
})

const pointS = z.tuple([
  z.string().min(1).max(100),
  z.number().int().nonnegative(),
  ts,
  num(-90, 90),
  num(-180, 180),
  num(-1000, 10_000).nullable(),
  num(0, 100_000),
  z.union([z.literal(0), z.literal(1)]),
])

const journalS = z.object({
  date,
  sleep: z.enum(['segar', 'cukup', 'kurang']),
  fruitPortions: z.number().int().min(0).max(50),
  kidMinutes: z.number().int().min(0).max(1440),
  createdAt: ts,
  updatedAt: ts,
})
const hydrationS = z.object({ date, ml: num(0, 20_000) })
const bodyS = z.object({
  date,
  weightKg: num(20, 300).optional(),
  waistCm: num(20, 300).optional(),
  mood: cond.optional(),
  updatedAt: ts,
})
const itemS = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(60),
  order: z.number().finite(),
  active: z.boolean(),
  createdAt: ts,
})
const dayS = z.object({
  date,
  itemId: z.string().min(1).max(100),
  title: z.string().max(60),
  done: z.boolean(),
})
const kidS = z.object({ activityId: z.string().min(1).max(100), done: z.boolean(), updatedAt: ts })

const settingsS = z
  .object({
    monthlyTargetKm: num(1, 10_000),
    idealWeightKg: num(20, 300).nullable(),
    reminderTimes: z.object({
      minum: z.array(time).max(12),
      jurnal: time,
      sabtu: time,
      minggu: time,
    }),
    lastBackupAt: ts.nullable(),
    lastImportAt: ts.nullable(),
    backupSnoozeUntil: ts.nullable(),
    mapStyleUrl: z.string().max(500),
    safetyNoticeSeen: z.boolean(),
  })
  .partial()

const fileS = z.object({
  app: z.literal(BACKUP_APP),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  includesTracks: z.boolean(),
  rides: z.array(rideS),
  trackPoints: z.array(pointS),
  journals: z.array(journalS),
  hydration: z.array(hydrationS),
  bodyLogs: z.array(bodyS),
  checklistItems: z.array(itemS),
  checklistDays: z.array(dayS),
  kidChecks: z.array(kidS),
  settings: settingsS,
})

export function packPoint(p: TrackPoint): PackedPoint {
  return [p.rideId, p.seq, p.ts, p.lat, p.lon, p.ele ?? null, p.acc, p.paused ? 1 : 0]
}

/** Isi file cadangan (objek). Tanpa jejak: titik dibuang dan `hasTrack` jadi false agar konsisten. */
export function buildBackup(data: BackupData, includeTracks: boolean, nowMs: number) {
  return {
    app: BACKUP_APP,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(nowMs).toISOString(),
    includesTracks: includeTracks,
    rides: includeTracks ? data.rides : data.rides.map((r) => ({ ...r, hasTrack: false })),
    trackPoints: includeTracks ? data.trackPoints.map(packPoint) : [],
    journals: data.journals,
    hydration: data.hydration,
    bodyLogs: data.bodyLogs,
    checklistItems: data.checklistItems,
    checklistDays: data.checklistDays,
    kidChecks: data.kidChecks,
    settings: data.settings,
  }
}

export type ParseResult = { ok: true; data: BackupData } | { ok: false; reason: string }

const fail = (reason: string): ParseResult => ({ ok: false, reason })

function dupes<T>(rows: T[], key: (r: T) => string): boolean {
  const seen = new Set<string>()
  for (const r of rows) {
    const k = key(r)
    if (seen.has(k)) return true
    seen.add(k)
  }
  return false
}

/** VAL-005: validasi menyeluruh; satu pelanggaran = tolak seluruhnya. */
export function parseBackup(text: string): ParseResult {
  if (text.length > MAX_BACKUP_BYTES) return fail('File terlalu besar (maksimal 50 MB).')
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return fail('File bukan JSON yang valid atau rusak.')
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== BACKUP_APP)
    return fail('Ini bukan file cadangan GowesSehat.')
  const ver = (raw as { schemaVersion?: unknown }).schemaVersion
  if (typeof ver === 'number' && ver > BACKUP_SCHEMA_VERSION)
    return fail('File dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi dulu.')

  const r = fileS.safeParse(raw)
  if (!r.success) {
    const i = r.error.issues[0]
    return fail(`Isi file tidak valid (${i ? i.path.join('.') : 'struktur'}).`)
  }
  const f = r.data
  if (
    dupes(f.rides, (x) => x.id) ||
    dupes(f.journals, (x) => x.date) ||
    dupes(f.hydration, (x) => x.date) ||
    dupes(f.bodyLogs, (x) => x.date) ||
    dupes(f.checklistItems, (x) => x.id) ||
    dupes(f.checklistDays, (x) => `${x.date}|${x.itemId}`) ||
    dupes(f.kidChecks, (x) => x.activityId) ||
    dupes(f.trackPoints, (x) => `${x[0]}|${x[1]}`)
  )
    return fail('File memuat data ganda.')
  const rideIds = new Set(f.rides.map((x) => x.id))
  if (f.trackPoints.some((p) => !rideIds.has(p[0])))
    return fail('Ada titik GPS yang tidak punya gowes.')

  const trackPoints: TrackPoint[] = f.trackPoints.map(
    ([rideId, seq, t, lat, lon, ele, acc, paused]) => ({
      rideId,
      seq,
      ts: t,
      lat,
      lon,
      ...(ele === null ? {} : { ele }),
      acc,
      paused: paused === 1,
    }),
  )
  return {
    ok: true,
    data: {
      rides: f.rides,
      trackPoints,
      journals: f.journals,
      hydration: f.hydration,
      bodyLogs: f.bodyLogs,
      checklistItems: f.checklistItems,
      checklistDays: f.checklistDays,
      kidChecks: f.kidChecks,
      settings: f.settings,
    },
  }
}

export interface BackupDueInput {
  nowMs: number
  lastBackupAt: number | null
  snoozeUntil: number | null
  /** createdAt semua gowes. */
  rideCreatedAts: number[]
  /** Waktu data paling awal (acuan bila belum pernah cadangan); null = belum ada data. */
  firstDataAt: number | null
}

/** BR-021: ≥ 14 hari atau ≥ 10 gowes baru sejak cadangan; belum pernah → acuan data pertama; bisa ditunda. */
export function backupDue(i: BackupDueInput): boolean {
  if (i.snoozeUntil !== null && i.nowMs < i.snoozeUntil) return false
  const ref = i.lastBackupAt ?? i.firstDataAt
  if (ref === null) return false
  const days = Math.floor((i.nowMs - ref) / 864e5)
  const newRides = i.rideCreatedAts.filter(
    (c) => i.lastBackupAt === null || c > i.lastBackupAt,
  ).length
  return days >= BACKUP_DAYS || newRides >= BACKUP_RIDES
}
