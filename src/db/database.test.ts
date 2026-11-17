import { afterEach, describe, expect, it } from 'vitest'
import { GowesDB, SCHEMA_VERSION } from './database'
import { DEFAULT_SETTINGS, ensureDefaults, getSetting, setSetting } from './settings'

let n = 0
const opened: GowesDB[] = []
function freshDb(name = `uji-${++n}-${Math.random()}`): GowesDB {
  const d = new GowesDB(name)
  opened.push(d)
  return d
}
afterEach(async () => {
  for (const d of opened.splice(0)) {
    d.close()
    await d.delete()
  }
})

describe('skema Dexie', () => {
  it('membuat semua object store sesuai DATA-MODEL', async () => {
    const db = freshDb()
    await db.open()
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'active_points',
        'active_recording',
        'body_logs',
        'checklist_days',
        'checklist_items',
        'hydration',
        'journals',
        'kid_checks',
        'rides',
        'settings',
        'track_points',
      ].sort(),
    )
    expect(db.verno).toBe(SCHEMA_VERSION)
  })

  it('rides bisa dicari lewat indeks date dan source', async () => {
    const db = freshDb()
    const base = {
      distanceKm: 10,
      movingSec: 1800,
      elevationM: 50,
      category: 'hari_kerja' as const,
      type: 'metime' as const,
      condition: 0 as const,
      hasTrack: false,
      createdAt: 1,
      updatedAt: 1,
    }
    await db.rides.bulkAdd([
      { ...base, id: 'a', date: '2026-11-17', source: 'manual' },
      { ...base, id: 'b', date: '2026-11-17', source: 'recorded', hasTrack: true },
      { ...base, id: 'c', date: '2026-11-18', source: 'manual' },
    ])
    expect(await db.rides.where('date').equals('2026-11-17').count()).toBe(2)
    expect(await db.rides.where('source').equals('recorded').count()).toBe(1)
  })

  it('kunci majemuk: track_points [rideId+seq] dan checklist_days [date+itemId]', async () => {
    const db = freshDb()
    await db.track_points.put({
      rideId: 'r',
      seq: 0,
      ts: 1,
      lat: -6.2,
      lon: 106.8,
      acc: 5,
      paused: false,
    })
    await db.track_points.put({
      rideId: 'r',
      seq: 0,
      ts: 2,
      lat: -6.2,
      lon: 106.8,
      acc: 5,
      paused: false,
    })
    await db.track_points.put({
      rideId: 'r',
      seq: 1,
      ts: 3,
      lat: -6.2,
      lon: 106.8,
      acc: 5,
      paused: false,
    })
    expect(await db.track_points.where('rideId').equals('r').count()).toBe(2)

    await db.checklist_days.put({ date: '2026-11-17', itemId: 'x', title: 'Minum', done: false })
    await db.checklist_days.put({ date: '2026-11-17', itemId: 'x', title: 'Minum', done: true })
    expect(await db.checklist_days.where('date').equals('2026-11-17').count()).toBe(1)
  })

  it('data bertahan setelah database ditutup dan dibuka lagi', async () => {
    const name = `uji-ulang-${Math.random()}`
    const a = freshDb(name)
    await a.hydration.put({ date: '2026-11-17', ml: 750 })
    a.close()
    const b = freshDb(name)
    expect((await b.hydration.get('2026-11-17'))?.ml).toBe(750)
  })
})

describe('pengaturan', () => {
  it('mengisi nilai awal', async () => {
    const db = freshDb()
    await ensureDefaults(db)
    expect(await getSetting(db, 'monthlyTargetKm')).toBe(100)
    expect(await getSetting(db, 'schemaVersion')).toBe(SCHEMA_VERSION)
    expect(await db.settings.count()).toBe(Object.keys(DEFAULT_SETTINGS).length)
  })

  it('tidak menimpa nilai yang sudah ada', async () => {
    const db = freshDb()
    await setSetting(db, 'monthlyTargetKm', 130)
    await ensureDefaults(db)
    expect(await getSetting(db, 'monthlyTargetKm')).toBe(130)
  })

  it('getSetting memberi nilai awal bila belum ada baris', async () => {
    const db = freshDb()
    expect(await getSetting(db, 'monthlyTargetKm')).toBe(100)
  })
})
