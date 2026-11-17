import { db as defaultDb, type GowesDB } from '../../db/database'
import type {
  ActivePoint,
  ActiveRecording,
  Condition,
  Ride,
  RideType,
  TrackPoint,
} from '../../db/types'
import { type StoredPoint, type Stats } from '../../domain/gps'
import { categoryFor, toLocalDate } from '../../domain/ride'

export const CURRENT = 'current' as const

export async function getActive(db: GowesDB = defaultDb): Promise<ActiveRecording | undefined> {
  return db.active_recording.get(CURRENT)
}

/** Mulai rekaman baru. Hanya satu rekaman aktif sekaligus (WORKFLOW bagian 2). */
export async function startRecording(
  db: GowesDB = defaultDb,
  nowMs = Date.now(),
): Promise<ActiveRecording> {
  return db.transaction('rw', db.active_recording, db.active_points, async () => {
    if (await db.active_recording.get(CURRENT))
      throw new Error('Masih ada rekaman yang belum selesai')
    await db.active_points.clear()
    const rec: ActiveRecording = {
      id: CURRENT,
      startedAt: nowMs,
      state: 'merekam',
      pausedTotalSec: 0,
      lastPointTs: nowMs,
      distanceKm: 0,
      movingSec: 0,
      elevationM: 0,
    }
    await db.active_recording.add(rec)
    return rec
  })
}

export interface Progress {
  state: 'merekam' | 'jeda'
  pausedTotalSec: number
  stats: Pick<Stats, 'distanceKm' | 'movingSec' | 'elevationM' | 'maxSpeedKmh'>
  /** Titik yang ikut disimpan (dijarangkan oleh mesin), bila ada. */
  point?: StoredPoint | null
  lastPointTs: number
}

/** Simpan kemajuan: titik + angka berjalan, dalam satu transaksi (FR-138). */
export async function saveProgress(p: Progress, db: GowesDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.active_recording, db.active_points, async () => {
    const rec = await db.active_recording.get(CURRENT)
    if (!rec) return // sudah dibuang/disimpan
    if (p.point) {
      const last = await db.active_points.orderBy('seq').last()
      const pt: ActivePoint = { seq: (last?.seq ?? -1) + 1, ...p.point }
      await db.active_points.add(pt)
    }
    await db.active_recording.put({
      ...rec,
      state: p.state,
      pausedTotalSec: Math.round(p.pausedTotalSec),
      lastPointTs: p.lastPointTs,
      distanceKm: p.stats.distanceKm,
      movingSec: p.stats.movingSec,
      elevationM: p.stats.elevationM,
      maxSpeedKmh: p.stats.maxSpeedKmh,
    })
  })
}

export async function activePoints(db: GowesDB = defaultDb): Promise<ActivePoint[]> {
  return db.active_points.orderBy('seq').toArray()
}

export interface SaveInput {
  type: RideType
  condition: Condition
  note?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Simpan rekaman menjadi gowes (FR-141): rides + track_points, lalu hapus rekaman aktif,
 * semuanya dalam satu transaksi. Angka dikunci (BR-009) karena source = 'recorded'.
 */
export async function saveRecording(
  input: SaveInput,
  db: GowesDB = defaultDb,
  nowMs = Date.now(),
): Promise<Ride> {
  return db.transaction(
    'rw',
    db.active_recording,
    db.active_points,
    db.rides,
    db.track_points,
    async () => {
      const rec = await db.active_recording.get(CURRENT)
      if (!rec) throw new Error('Tidak ada rekaman untuk disimpan')
      const points = await db.active_points.orderBy('seq').toArray()
      const started = new Date(rec.startedAt)
      const date = toLocalDate(started)
      const endTs = Math.max(rec.lastPointTs, rec.startedAt)
      const note = input.note?.trim()
      const id = crypto.randomUUID()
      const ride: Ride = {
        id,
        date,
        source: 'recorded',
        distanceKm: round2(rec.distanceKm),
        movingSec: Math.round(rec.movingSec),
        elevationM: Math.round(rec.elevationM),
        category: categoryFor(date, started.getHours()),
        type: input.type,
        condition: input.condition,
        ...(note ? { note } : {}),
        startedAt: rec.startedAt,
        elapsedSec: Math.max(0, Math.round((endTs - rec.startedAt) / 1000)),
        ...(rec.maxSpeedKmh ? { maxSpeedKmh: rec.maxSpeedKmh } : {}),
        hasTrack: points.length > 0,
        createdAt: nowMs,
        updatedAt: nowMs,
      }
      await db.rides.add(ride)
      const tps: TrackPoint[] = points.map((p, i) => ({
        rideId: id,
        seq: i,
        ts: p.ts,
        lat: p.lat,
        lon: p.lon,
        ...(p.ele === undefined ? {} : { ele: p.ele }),
        acc: p.acc,
        paused: p.paused,
      }))
      if (tps.length) await db.track_points.bulkAdd(tps)
      await db.active_points.clear()
      await db.active_recording.delete(CURRENT)
      return ride
    },
  )
}

/** Buang rekaman aktif beserta titiknya. */
export async function discardRecording(db: GowesDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.active_recording, db.active_points, async () => {
    await db.active_points.clear()
    await db.active_recording.delete(CURRENT)
  })
}
