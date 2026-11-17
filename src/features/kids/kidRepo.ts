import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type GowesDB } from '../../db/database'

/** Centang aktivitas anak; tersimpan di IndexedDB sehingga bertahan setelah aplikasi ditutup. */
export async function setKidDone(
  activityId: string,
  done: boolean,
  db: GowesDB = defaultDb,
): Promise<void> {
  await db.kid_checks.put({ activityId, done, updatedAt: Date.now() })
}

/** Himpunan id aktivitas yang sudah dicentang; undefined = memuat. */
export function useKidDone(): Set<string> | undefined {
  return useLiveQuery(async () => {
    const rows = await defaultDb.kid_checks.toArray()
    return new Set(rows.filter((r) => r.done).map((r) => r.activityId))
  }, [])
}
