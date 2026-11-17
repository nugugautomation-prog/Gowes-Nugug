import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type GowesDB } from '../../db/database'
import type { Journal, Sleep } from '../../db/types'
import { addDays } from '../../domain/stats'
import { applyWater } from '../../domain/readiness'
import { computeReadiness, type Readiness } from '../../domain/readiness'

export interface JournalData {
  sleep: Sleep
  fruitPortions: number
  kidMinutes: number
}

/** Satu jurnal per tanggal; menyimpan ulang menimpa isi, createdAt dipertahankan. */
export async function saveJournal(
  date: string,
  data: JournalData,
  db: GowesDB = defaultDb,
): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.journals, async () => {
    const existing = await db.journals.get(date)
    await db.journals.put({ ...data, date, createdAt: existing?.createdAt ?? now, updatedAt: now })
  })
}

/** Tambah/kurangi air pada satu tanggal (BR-023). Mengembalikan total baru. */
export async function changeWater(
  date: string,
  deltaMl: number,
  db: GowesDB = defaultDb,
): Promise<number> {
  return db.transaction('rw', db.hydration, async () => {
    const current = (await db.hydration.get(date))?.ml ?? 0
    const ml = applyWater(current, deltaMl)
    await db.hydration.put({ date, ml })
    return ml
  })
}

/**
 * Jurnal satu tanggal; undefined = memuat, null = belum ada.
 * Hasil query lama (tanggal sebelumnya) tidak boleh bocor saat tanggal berganti.
 */
export function useJournal(date: string): Journal | null | undefined {
  const r = useLiveQuery(
    async () => ({ date, journal: (await defaultDb.journals.get(date)) ?? null }),
    [date],
  )
  return r && r.date === date ? r.journal : undefined
}

/** Total air satu tanggal (0 bila belum ada); undefined = memuat. */
export function useWater(date: string): number | undefined {
  return useLiveQuery(async () => (await defaultDb.hydration.get(date))?.ml ?? 0, [date])
}

/** Kesiapan hari ini (BR-001/011); dihitung ulang tiap jurnal/air berubah (EC-10). */
export function useReadiness(today: string, hour: number): Readiness | undefined {
  const yesterday = addDays(today, -1)
  return useLiveQuery(async () => {
    const [journal, todayRow, yesterdayRow] = await Promise.all([
      defaultDb.journals.get(yesterday),
      defaultDb.hydration.get(today),
      defaultDb.hydration.get(yesterday),
    ])
    return computeReadiness({
      journalYesterday: journal,
      hydrationTodayMl: todayRow?.ml ?? 0,
      hydrationYesterdayMl: yesterdayRow?.ml ?? 0,
      hour,
    })
  }, [today, yesterday, hour])
}
