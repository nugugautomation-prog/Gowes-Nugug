import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type GowesDB } from '../../db/database'
import type { Ride } from '../../db/types'

/** Isi yang diisi pengguna pada form gowes manual. */
export type ManualRideData = Pick<
  Ride,
  'date' | 'distanceKm' | 'movingSec' | 'elevationM' | 'category' | 'type' | 'condition' | 'note'
>

function clean(data: ManualRideData): ManualRideData {
  const note = data.note?.trim()
  return {
    ...data,
    distanceKm: Math.round(data.distanceKm * 100) / 100, // 2 desimal (DATA-MODEL)
    movingSec: Math.round(data.movingSec),
    note: note ? note : undefined,
  }
}

export async function addManualRide(data: ManualRideData, db: GowesDB = defaultDb): Promise<Ride> {
  const now = Date.now()
  const ride: Ride = {
    ...clean(data),
    id: crypto.randomUUID(),
    source: 'manual',
    hasTrack: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.rides.add(ride)
  return ride
}

/** BR-009: hanya gowes manual yang boleh diubah angkanya. */
export async function updateManualRide(
  id: string,
  data: ManualRideData,
  db: GowesDB = defaultDb,
): Promise<void> {
  const existing = await db.rides.get(id)
  if (!existing) throw new Error('Gowes tidak ditemukan')
  if (existing.source !== 'manual') throw new Error('Gowes rekaman tidak bisa diubah angkanya')
  await db.rides.put({ ...existing, ...clean(data), updatedAt: Date.now() })
}

/** BR-009/FR-142: pada gowes rekaman hanya kategori, jenis, kondisi, dan catatan yang boleh diubah. */
export type RecordedMeta = Pick<Ride, 'category' | 'type' | 'condition' | 'note'>

export async function updateRecordedMeta(
  id: string,
  meta: RecordedMeta,
  db: GowesDB = defaultDb,
): Promise<void> {
  await db.transaction('rw', db.rides, async () => {
    const existing = await db.rides.get(id)
    if (!existing) throw new Error('Gowes tidak ditemukan')
    if (existing.source !== 'recorded') throw new Error('Hanya untuk gowes rekaman')
    const note = meta.note?.trim()
    const next: Ride = {
      ...existing,
      category: meta.category,
      type: meta.type,
      condition: meta.condition,
      updatedAt: Date.now(),
    }
    if (note) next.note = note
    else delete next.note
    await db.rides.put(next) // jarak, waktu, elevasi, jejak tidak tersentuh
  })
}

/** Hapus gowes beserta jejaknya (bila ada) dalam satu transaksi. */
export async function deleteRide(id: string, db: GowesDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.rides, db.track_points, async () => {
    await db.track_points.where('rideId').equals(id).delete()
    await db.rides.delete(id)
  })
}

/** Semua gowes, terbaru di atas; memperbarui diri saat data berubah. undefined = memuat. */
export function useRides(): Ride[] | undefined {
  return useLiveQuery(async () => {
    const all = await defaultDb.rides.toArray()
    return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  }, [])
}
