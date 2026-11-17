import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './database'
import { DEFAULT_SETTINGS, getSetting } from './settings'
import type { Settings } from './types'

/** Nilai pengaturan yang memperbarui diri. Selama memuat, memakai nilai awal. */
export function useSetting<K extends keyof Settings>(key: K): Settings[K] {
  const v = useLiveQuery(() => getSetting(db, key), [key])
  return (v === undefined ? DEFAULT_SETTINGS[key] : v) as Settings[K]
}
