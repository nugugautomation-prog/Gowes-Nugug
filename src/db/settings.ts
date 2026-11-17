import { SCHEMA_VERSION, type GowesDB } from './database'
import type { Settings } from './types'

/** Nilai awal (DATA-MODEL bagian 2; jam pengingat dari FR-111). */
export const DEFAULT_SETTINGS: Settings = {
  monthlyTargetKm: 100,
  idealWeightKg: null,
  reminderTimes: {
    minum: ['09:00', '11:00', '13:00', '15:00'],
    jurnal: '20:00',
    sabtu: '16:30',
    minggu: '06:00',
  },
  lastBackupAt: null,
  lastImportAt: null,
  backupSnoozeUntil: null,
  mapStyleUrl: 'https://tiles.openfreemap.org/styles/liberty',
  safetyNoticeSeen: false,
  schemaVersion: SCHEMA_VERSION,
}

/** Isi pengaturan yang belum ada. Tidak pernah menimpa nilai yang sudah tersimpan. */
export async function ensureDefaults(db: GowesDB): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if ((await db.settings.get(key)) === undefined) {
        await db.settings.add({ key, value: DEFAULT_SETTINGS[key] })
      }
    }
  })
}

export async function getSetting<K extends keyof Settings>(
  db: GowesDB,
  key: K,
): Promise<Settings[K]> {
  const row = await db.settings.get(key)
  return (row ? row.value : DEFAULT_SETTINGS[key]) as Settings[K]
}

export async function setSetting<K extends keyof Settings>(
  db: GowesDB,
  key: K,
  value: Settings[K],
): Promise<void> {
  await db.settings.put({ key, value })
}
