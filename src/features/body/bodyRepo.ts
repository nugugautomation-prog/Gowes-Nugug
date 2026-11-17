import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type GowesDB } from '../../db/database'
import type { BodyLog, Condition } from '../../db/types'
import { roundWeight } from '../../domain/body'

export interface BodyData {
  weightKg?: number
  waistCm?: number
  mood?: Condition
}

/**
 * Satu catatan per tanggal (gabungan).
 * - 'merge': nilai yang diberikan menimpa, sisanya dipertahankan (mood cepat tak menghapus berat).
 * - 'replace': isi persis seperti `data` (edit dari form; kolom yang dikosongkan ikut hilang).
 * Minimal satu nilai harus ada (VAL-003).
 */
export async function saveBodyLog(
  date: string,
  data: BodyData,
  mode: 'merge' | 'replace' = 'merge',
  db: GowesDB = defaultDb,
): Promise<BodyLog> {
  return db.transaction('rw', db.body_logs, async () => {
    const existing = mode === 'merge' ? await db.body_logs.get(date) : undefined
    const merged: BodyLog = {
      date,
      weightKg: data.weightKg !== undefined ? roundWeight(data.weightKg) : existing?.weightKg,
      waistCm: data.waistCm ?? existing?.waistCm,
      mood: data.mood ?? existing?.mood,
      updatedAt: Date.now(),
    }
    if (merged.weightKg === undefined && merged.waistCm === undefined && merged.mood === undefined)
      throw new Error('Isi minimal satu: berat, pinggang, atau mood')
    // Hilangkan kunci undefined agar baris bersih.
    const row = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined),
    ) as unknown as BodyLog
    await db.body_logs.put(row)
    return row
  })
}

export async function deleteBodyLog(date: string, db: GowesDB = defaultDb): Promise<void> {
  await db.body_logs.delete(date)
}

/** Semua catatan tubuh, terbaru di atas. */
export function useBodyLogs(): BodyLog[] | undefined {
  return useLiveQuery(async () => {
    const all = await defaultDb.body_logs.toArray()
    return all.sort((a, b) => b.date.localeCompare(a.date))
  }, [])
}

export function useBodyLog(date: string): BodyLog | null | undefined {
  const r = useLiveQuery(
    async () => ({ date, log: (await defaultDb.body_logs.get(date)) ?? null }),
    [date],
  )
  return r && r.date === date ? r.log : undefined
}
