import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type GowesDB } from '../../db/database'
import type { ChecklistDay, ChecklistItem } from '../../db/types'
import { DEFAULT_CHECKLIST, validateChecklistTitle } from '../../domain/checklist'

export interface ChecklistRow extends ChecklistDay {
  order: number
}

/**
 * BR-020: membuat baris hari `date` untuk setiap item aktif yang belum punya baris
 * (nama disalin saat itu). Isi awal 3 contoh dibuat sekali, hanya bila tabel item masih kosong;
 * item yang dihapus hanya dinonaktifkan, jadi tidak pernah dibuat ulang diam-diam.
 */
export async function ensureChecklistDay(date: string, db: GowesDB = defaultDb): Promise<void> {
  await db.transaction('rw', db.checklist_items, db.checklist_days, async () => {
    if ((await db.checklist_items.count()) === 0) {
      const now = Date.now()
      await db.checklist_items.bulkAdd(
        DEFAULT_CHECKLIST.map((title, i) => ({
          id: crypto.randomUUID(),
          title,
          order: i,
          active: true,
          createdAt: now,
        })),
      )
    }
    const active = (await db.checklist_items.toArray()).filter((i) => i.active)
    for (const item of active) {
      const exists = await db.checklist_days.get([date, item.id])
      if (!exists)
        await db.checklist_days.add({ date, itemId: item.id, title: item.title, done: false })
    }
  })
}

/** Item baru muncul di hari itu juga (BR-020). */
export async function addChecklistItem(
  rawTitle: string,
  date: string,
  db: GowesDB = defaultDb,
): Promise<ChecklistItem> {
  const v = validateChecklistTitle(rawTitle)
  if (!v.ok) throw new Error(v.error)
  return db.transaction('rw', db.checklist_items, db.checklist_days, async () => {
    const all = await db.checklist_items.toArray()
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      title: v.title,
      order: all.reduce((m, i) => Math.max(m, i.order), -1) + 1,
      active: true,
      createdAt: Date.now(),
    }
    await db.checklist_items.add(item)
    await db.checklist_days.add({ date, itemId: item.id, title: item.title, done: false })
    return item
  })
}

export interface DeletedSnapshot {
  itemId: string
  date: string
  todayRow: ChecklistDay | undefined
}

/**
 * Hapus = nonaktifkan item (B11). Hasil hari-hari lalu tidak berubah; baris hari ini ikut dilepas
 * supaya item yang dihapus tidak tampil dan tidak terhitung belum selesai [ASSUMPTION].
 * Mengembalikan data untuk Urungkan.
 */
export async function deleteChecklistItem(
  itemId: string,
  date: string,
  db: GowesDB = defaultDb,
): Promise<DeletedSnapshot> {
  return db.transaction('rw', db.checklist_items, db.checklist_days, async () => {
    const todayRow = await db.checklist_days.get([date, itemId])
    await db.checklist_items.update(itemId, { active: false })
    await db.checklist_days.delete([date, itemId])
    return { itemId, date, todayRow }
  })
}

export async function restoreChecklistItem(
  s: DeletedSnapshot,
  db: GowesDB = defaultDb,
): Promise<void> {
  await db.transaction('rw', db.checklist_items, db.checklist_days, async () => {
    await db.checklist_items.update(s.itemId, { active: true })
    if (s.todayRow) await db.checklist_days.put(s.todayRow)
  })
}

export async function setChecklistDone(
  date: string,
  itemId: string,
  done: boolean,
  db: GowesDB = defaultDb,
): Promise<void> {
  await db.checklist_days.update([date, itemId], { done })
}

/** Baris hari ini, urut sesuai urutan item. */
export function useChecklist(date: string): ChecklistRow[] | undefined {
  const r = useLiveQuery(async () => {
    const [rows, items] = await Promise.all([
      defaultDb.checklist_days.where('date').equals(date).toArray(),
      defaultDb.checklist_items.toArray(),
    ])
    const order = new Map(items.map((i) => [i.id, i.order]))
    return {
      date,
      rows: rows
        .map((row) => ({ ...row, order: order.get(row.itemId) ?? Number.MAX_SAFE_INTEGER }))
        .sort((a, b) => a.order - b.order),
    }
  }, [date])
  return r && r.date === date ? r.rows : undefined
}
