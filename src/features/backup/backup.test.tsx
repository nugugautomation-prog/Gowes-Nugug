import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GowesDB, db } from '../../db/database'
import { ensureDefaults, getSetting, setSetting } from '../../db/settings'
import { backupDue, parseBackup } from '../../domain/backup'
import { ToastProvider } from '../../ui/Toast'
import { BackupBanner } from './BackupBanner'
import { BackupPage } from './BackupPage'
import {
  exportBackup,
  importBackup,
  markBackedUp,
  readAll,
  readDueInput,
  snoozeBackup,
} from './backupRepo'

const NOW = Date.UTC(2026, 10, 17, 3, 0, 0)
const DAY = 864e5

type Json = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

async function seed(d: GowesDB) {
  await d.rides.bulkAdd([
    {
      id: 'r1',
      date: '2026-11-10',
      source: 'recorded',
      distanceKm: 20.5,
      movingSec: 3600,
      elevationM: 80,
      category: 'hari_kerja',
      type: 'metime',
      condition: 1,
      note: '<img onerror=x> & "q"',
      startedAt: 1,
      elapsedSec: 4000,
      maxSpeedKmh: 40,
      hasTrack: true,
      createdAt: 1000,
      updatedAt: 1000,
    },
    {
      id: 'r2',
      date: '2026-11-11',
      source: 'manual',
      distanceKm: 10,
      movingSec: 1800,
      elevationM: 10,
      category: 'lainnya',
      type: 'bareng_anak',
      condition: 0,
      hasTrack: false,
      createdAt: 2000,
      updatedAt: 2000,
    },
  ])
  await d.track_points.bulkAdd([
    { rideId: 'r1', seq: 0, ts: 1, lat: -6.2, lon: 106.8, ele: 10, acc: 5, paused: false },
    { rideId: 'r1', seq: 1, ts: 2, lat: -6.2001, lon: 106.8001, acc: 6, paused: true },
  ])
  await d.journals.add({
    date: '2026-11-10',
    sleep: 'segar',
    fruitPortions: 3,
    kidMinutes: 30,
    createdAt: 1,
    updatedAt: 1,
  })
  await d.hydration.add({ date: '2026-11-10', ml: 1500 })
  await d.body_logs.add({ date: '2026-11-10', weightKg: 80.5, mood: 0, updatedAt: 1 })
  await d.checklist_items.add({
    id: 'c1',
    title: 'Peregangan',
    order: 0,
    active: true,
    createdAt: 1,
  })
  await d.checklist_days.add({ date: '2026-11-10', itemId: 'c1', title: 'Peregangan', done: true })
  await d.kid_checks.add({ activityId: 'lomba-balon', done: true, updatedAt: 5 })
  await setSetting(d, 'monthlyTargetKm', 150)
  await setSetting(d, 'idealWeightKg', 75)
}

async function clearAll(d: GowesDB) {
  for (const t of d.tables) await t.clear()
  await ensureDefaults(d)
}

async function goodFile(): Promise<Json> {
  await seed(db)
  return JSON.parse(await exportBackup(true, db, NOW)) as Json
}
const parse = (o: unknown) => parseBackup(JSON.stringify(o))

beforeEach(async () => {
  await clearAll(db)
})

describe('ekspor → impor (AC-018)', () => {
  it('di database bersih memulihkan semua data identik, termasuk titik GPS', async () => {
    await seed(db)
    const parsed = parseBackup(await exportBackup(true, db, NOW))
    if (!parsed.ok) throw new Error(parsed.reason)
    const fresh = new GowesDB('gowessehat-bersih')
    await fresh.open()
    await clearAll(fresh)
    await importBackup(parsed.data, fresh, NOW)

    const a = await readAll(db)
    const b = await readAll(fresh)
    const byId = <T,>(x: T[], k: (v: T) => string) =>
      [...x].sort((p, q) => k(p).localeCompare(k(q)))
    expect(byId(b.rides, (r) => r.id)).toEqual(byId(a.rides, (r) => r.id))
    expect(byId(b.trackPoints, (p) => `${p.rideId}${p.seq}`)).toEqual(
      byId(a.trackPoints, (p) => `${p.rideId}${p.seq}`),
    )
    expect(b.journals).toEqual(a.journals)
    expect(b.hydration).toEqual(a.hydration)
    expect(b.bodyLogs).toEqual(a.bodyLogs)
    expect(b.checklistItems).toEqual(a.checklistItems)
    expect(b.checklistDays).toEqual(a.checklistDays)
    expect(b.kidChecks).toEqual(a.kidChecks)
    expect(b.settings.monthlyTargetKm).toBe(150)
    expect(b.settings.idealWeightKg).toBe(75)
    expect(await getSetting(fresh, 'lastImportAt')).toBe(NOW)
    fresh.close()
  })

  it('teks bermuatan skrip tersimpan apa adanya (tidak dieksekusi)', async () => {
    await seed(db)
    const p = parseBackup(await exportBackup(true, db, NOW))
    expect(p.ok && p.data.rides.find((r) => r.id === 'r1')?.note).toBe('<img onerror=x> & "q"')
  })

  it('tanpa jejak GPS: titik dibuang dan hasTrack jadi false', async () => {
    await seed(db)
    const p = parseBackup(await exportBackup(false, db, NOW))
    if (!p.ok) throw new Error(p.reason)
    expect(p.data.trackPoints).toHaveLength(0)
    expect(p.data.rides.every((r) => !r.hasTrack)).toBe(true)
  })

  it('impor mengganti semua data lama', async () => {
    await seed(db)
    const p = parseBackup(await exportBackup(true, db, NOW))
    if (!p.ok) throw new Error(p.reason)
    await db.rides.add({ ...p.data.rides[0]!, id: 'ekstra' })
    await importBackup(p.data, db, NOW)
    expect(await db.rides.count()).toBe(2)
  })
})

describe('validasi impor (VAL-005, ERR-006)', () => {
  it('JSON rusak, bukan objek, atau app salah ditolak', () => {
    expect(parseBackup('{rusak').ok).toBe(false)
    expect(parseBackup('[]').ok).toBe(false)
    expect(parse({ app: 'lain' }).ok).toBe(false)
  })
  it('versi lebih baru ditolak dengan pesan perbarui aplikasi', async () => {
    const f = await goodFile()
    f.schemaVersion = 99
    const r = parse(f)
    expect(!r.ok && r.reason).toMatch(/Perbarui aplikasi/)
  })
  it('terlalu besar ditolak', () => {
    const r = parseBackup('x'.repeat(50 * 1024 * 1024 + 1))
    expect(!r.ok && r.reason).toMatch(/50 MB/)
  })
  it('nilai di luar rentang atau tipe salah ditolak', async () => {
    const mutations: ((f: Json) => void)[] = [
      (f) => (f.rides[0].distanceKm = -5),
      (f) => (f.rides[0].date = '10/11/2026'),
      (f) => (f.bodyLogs[0].weightKg = 5),
      (f) => (f.journals[0].sleep = 'ngantuk'),
      (f) => (f.trackPoints[0][3] = 999),
      (f) => delete f.rides,
    ]
    for (const mutate of mutations) {
      await clearAll(db)
      const f = await goodFile()
      mutate(f)
      expect(parse(f).ok).toBe(false)
    }
  })
  it('data ganda dan titik tanpa gowes ditolak', async () => {
    const f = await goodFile()
    f.rides.push({ ...f.rides[0] })
    expect(parse(f).ok).toBe(false)
    await clearAll(db)
    const g = await goodFile()
    g.trackPoints.push(['hantu', 0, 1, 0, 0, null, 1, 0])
    expect(parse(g).ok).toBe(false)
  })
  it('gagal di tengah transaksi = data lama utuh (rollback)', async () => {
    await seed(db)
    const p = parseBackup(await exportBackup(true, db, NOW))
    if (!p.ok) throw new Error(p.reason)
    const broken = { ...p.data, journals: [...p.data.journals, ...p.data.journals] } // kunci ganda
    await expect(importBackup(broken, db, NOW)).rejects.toThrow()
    expect(await db.rides.count()).toBe(2)
    expect(await db.track_points.count()).toBe(2)
    expect(await db.kid_checks.count()).toBe(1)
  })
  it('diblokir saat rekaman aktif', async () => {
    await seed(db)
    const p = parseBackup(await exportBackup(true, db, NOW))
    if (!p.ok) throw new Error(p.reason)
    await db.active_recording.add({
      id: 'current',
      startedAt: 1,
      state: 'merekam',
      pausedTotalSec: 0,
      lastPointTs: 1,
      distanceKm: 0,
      movingSec: 0,
      elevationM: 0,
    })
    await expect(importBackup(p.data, db, NOW)).rejects.toThrow(/rekaman/)
    expect(await db.rides.count()).toBe(2)
  })
})

describe('pengingat cadangan (BR-021, AC-019)', () => {
  const base = {
    nowMs: NOW,
    lastBackupAt: null,
    snoozeUntil: null,
    rideCreatedAts: [] as number[],
    firstDataAt: null,
  }
  it('tanpa data sama sekali tidak muncul', () => {
    expect(backupDue(base)).toBe(false)
  })
  it('belum pernah cadangan: acuan = data pertama', () => {
    expect(backupDue({ ...base, firstDataAt: NOW - 13 * DAY })).toBe(false)
    expect(backupDue({ ...base, firstDataAt: NOW - 14 * DAY })).toBe(true)
  })
  it('14 hari sejak cadangan terakhir', () => {
    expect(backupDue({ ...base, lastBackupAt: NOW - 13 * DAY, firstDataAt: 0 })).toBe(false)
    expect(backupDue({ ...base, lastBackupAt: NOW - 14 * DAY, firstDataAt: 0 })).toBe(true)
  })
  it('10 gowes baru sejak cadangan; gowes lama tidak dihitung', () => {
    const last = NOW - DAY
    const mk = (n: number) => Array.from({ length: n }, (_, i) => last + 1 + i)
    const t = { ...base, lastBackupAt: last, firstDataAt: 0 }
    expect(backupDue({ ...t, rideCreatedAts: mk(9) })).toBe(false)
    expect(backupDue({ ...t, rideCreatedAts: mk(10) })).toBe(true)
    expect(backupDue({ ...t, rideCreatedAts: Array<number>(20).fill(last - 5) })).toBe(false)
  })
  it('ditunda 1 hari', () => {
    const due = { ...base, firstDataAt: NOW - 30 * DAY }
    expect(backupDue({ ...due, snoozeUntil: NOW + 1000 })).toBe(false)
    expect(backupDue({ ...due, snoozeUntil: NOW - 1 })).toBe(true)
  })
  it('snoozeBackup menunda sehari; markBackedUp mereset', async () => {
    await db.journals.add({
      date: '2026-10-01',
      sleep: 'cukup',
      fruitPortions: 1,
      kidMinutes: 0,
      createdAt: NOW - 30 * DAY,
      updatedAt: 1,
    })
    expect(backupDue(await readDueInput(db, NOW))).toBe(true)
    await snoozeBackup(db, NOW)
    expect(backupDue(await readDueInput(db, NOW))).toBe(false)
    expect(backupDue(await readDueInput(db, NOW + 2 * DAY))).toBe(true)
    await markBackedUp(db, NOW)
    expect(backupDue(await readDueInput(db, NOW + 2 * DAY))).toBe(false)
  })
})

describe('UI Cadangan', () => {
  let blobs: Blob[] = []
  beforeEach(() => {
    blobs = []
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
      blobs.push(b as Blob)
      return 'blob:x'
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ToastProvider>
          <BackupPage />
        </ToastProvider>
      </MemoryRouter>,
    )

  it('Ekspor JSON mengunduh file dan mencatat waktu cadangan', async () => {
    await seed(db)
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Ekspor JSON' }))
    await waitFor(() => expect(blobs).toHaveLength(1))
    expect((JSON.parse(await blobs[0]!.text()) as Json).app).toBe('gowessehat')
    await waitFor(async () => expect(await getSetting(db, 'lastBackupAt')).not.toBeNull())
  })

  it('impor: pratinjau + konfirmasi, lalu data diganti', async () => {
    await seed(db)
    const text = await exportBackup(true, db, NOW)
    await db.rides.delete('r2')
    const user = userEvent.setup()
    renderPage()
    await user.upload(
      screen.getByLabelText('Pilih file cadangan'),
      new File([text], 'c.json', { type: 'application/json' }),
    )
    const dlg = await screen.findByRole('alertdialog')
    expect(dlg).toHaveTextContent('Sekarang: 1 gowes')
    expect(dlg).toHaveTextContent('Dari file: 2 gowes')
    expect(await db.rides.count()).toBe(1) // belum berubah sebelum konfirmasi
    await user.click(within(dlg).getByRole('button', { name: 'Ganti semua' }))
    await waitFor(async () => expect(await db.rides.count()).toBe(2))
  })

  it('file rusak ditolak dengan alasan dan data utuh', async () => {
    await seed(db)
    const user = userEvent.setup()
    renderPage()
    await user.upload(
      screen.getByLabelText('Pilih file cadangan'),
      new File(['{bukan json'], 'x.json', { type: 'application/json' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(/rusak.*Data lama tidak berubah/)
    expect(await db.rides.count()).toBe(2)
  })
})

describe('BackupBanner di Beranda', () => {
  const renderBanner = () =>
    render(
      <MemoryRouter>
        <BackupBanner />
      </MemoryRouter>,
    )
  it('muncul bila jatuh tempo, "Besok saja" menyembunyikan', async () => {
    await db.journals.add({
      date: '2026-01-01',
      sleep: 'cukup',
      fruitPortions: 1,
      kidMinutes: 0,
      createdAt: 1000,
      updatedAt: 1,
    })
    const user = userEvent.setup()
    renderBanner()
    expect(await screen.findByText('Waktunya cadangkan data')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Besok saja' }))
    await waitFor(() => expect(screen.queryByText('Waktunya cadangkan data')).toBeNull())
  })
  it('tidak muncul tanpa data', async () => {
    renderBanner()
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText('Waktunya cadangkan data')).toBeNull()
  })
})
