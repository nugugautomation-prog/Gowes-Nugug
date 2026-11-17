import { useLiveQuery } from 'dexie-react-hooks'
import { db as defaultDb, type GowesDB } from '../../db/database'
import type { Reminder } from '../../db/types'
import { validateReminder, type ReminderInput } from '../../domain/reminders'

function clean(i: ReminderInput): ReminderInput {
  const note = i.note?.trim()
  return { ...i, title: i.title.trim(), note: note ? note : undefined }
}

function assertValid(i: ReminderInput) {
  const errors = validateReminder(i)
  if (Object.keys(errors).length > 0) throw new Error('Data pengingat tidak valid')
}

export async function addReminder(
  input: ReminderInput,
  db: GowesDB = defaultDb,
): Promise<Reminder> {
  assertValid(input)
  const c = clean(input)
  const now = Date.now()
  const r: Reminder = {
    id: crypto.randomUUID(),
    title: c.title,
    date: c.date,
    time: c.time,
    repeat: c.repeat,
    done: false,
    createdAt: now,
    updatedAt: now,
    ...(c.note ? { note: c.note } : {}),
  }
  await db.reminders.add(r)
  return r
}

export async function updateReminder(
  id: string,
  input: ReminderInput,
  db: GowesDB = defaultDb,
): Promise<void> {
  assertValid(input)
  const c = clean(input)
  await db.transaction('rw', db.reminders, async () => {
    const existing = await db.reminders.get(id)
    if (!existing) throw new Error('Pengingat tidak ditemukan')
    const next: Reminder = {
      ...existing,
      title: c.title,
      date: c.date,
      time: c.time,
      repeat: c.repeat,
      // Waktu diubah → tidak lagi dianggap selesai.
      done: existing.date === c.date && existing.time === c.time ? existing.done : false,
      updatedAt: Date.now(),
    }
    if (c.note) next.note = c.note
    else delete next.note
    await db.reminders.put(next)
  })
}

export async function setReminderDone(id: string, done: boolean, db: GowesDB = defaultDb) {
  await db.reminders.update(id, { done, updatedAt: Date.now() })
}

/** Hapus; mengembalikan salinan untuk "Urungkan". */
export async function deleteReminder(
  id: string,
  db: GowesDB = defaultDb,
): Promise<Reminder | undefined> {
  const r = await db.reminders.get(id)
  await db.reminders.delete(id)
  return r
}

export async function restoreReminder(r: Reminder, db: GowesDB = defaultDb) {
  await db.reminders.put(r)
}

/** Semua pengingat; undefined = memuat. */
export function useReminders(): Reminder[] | undefined {
  return useLiveQuery(() => defaultDb.reminders.toArray(), [])
}
