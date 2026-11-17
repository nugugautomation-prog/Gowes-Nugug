import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../app/App'
import { db } from '../../db/database'
import { ensureDefaults, getSetting } from '../../db/settings'
import { ToastProvider } from '../../ui/Toast'
import { Recorder, type GeoLike, type WakeLockLike } from './recorder'
import { RecordPage } from './RecordPage'
import { discardRecording, getActive, saveRecording, startRecording } from './recorderRepo'

const LAT0 = -6.2
const M_PER_DEG = 111_194.9
const north = (m: number) => LAT0 + m / M_PER_DEG

class FakeGeo implements GeoLike {
  ok: ((p: GeolocationPosition) => void) | null = null
  err: ((e: GeolocationPositionError) => void) | null = null
  cleared = 0
  watchPosition(
    ok: (p: GeolocationPosition) => void,
    err: (e: GeolocationPositionError) => void,
  ): number {
    this.ok = ok
    this.err = err
    return 1
  }
  clearWatch() {
    this.cleared++
  }
  emit(
    ts: number,
    meters: number,
    o: { acc?: number; speed?: number | null; ele?: number | null } = {},
  ) {
    this.ok?.({
      timestamp: ts,
      coords: {
        latitude: north(meters),
        longitude: 106.8,
        altitude: o.ele ?? null,
        accuracy: o.acc ?? 5,
        speed: o.speed === undefined ? 5 : o.speed,
      },
    } as unknown as GeolocationPosition)
  }
  deny() {
    this.err?.({ code: 1, message: 'denied' } as GeolocationPositionError)
  }
}

function fakeWake() {
  const sentinel = { released: false, release: vi.fn(async () => {}) }
  const wl: WakeLockLike & { calls: number } = {
    calls: 0,
    request: vi.fn(async () => {
      wl.calls++
      sentinel.released = false
      return sentinel
    }),
  }
  return { wl, sentinel }
}

const T0 = Date.now() - 600_000

async function resetDb() {
  for (const t of db.tables) await t.clear()
  await ensureDefaults(db)
}
beforeEach(resetDb)

/** Kirim `seconds` titik (1 Hz) bersepeda 5 m/s mulai dari `from` detik. */
function pedal(geo: FakeGeo, from: number, seconds: number) {
  for (let i = from; i <= from + seconds; i++) geo.emit(T0 + i * 1000, 5 * i)
}

describe('Recorder (WF-01)', () => {
  it('rekam → simpan: gowes "recorded" dengan jejak, kategori otomatis, rekaman aktif dihapus', async () => {
    const geo = new FakeGeo()
    const { wl } = fakeWake()
    const rec = new Recorder({ geo, wakeLock: wl, now: () => T0 })
    await rec.start()
    expect(rec.getView().phase).toBe('mencari')
    expect(wl.calls).toBe(1)
    pedal(geo, 0, 60)
    expect(rec.getView().phase).toBe('merekam')
    const stats = await rec.stop()
    expect(stats.distanceKm * 1000).toBeGreaterThan(290)
    expect(geo.cleared).toBe(1)

    const ride = await saveRecording({ type: 'bareng_anak', condition: 0 }, db, T0 + 70_000)
    expect(ride).toMatchObject({
      source: 'recorded',
      type: 'bareng_anak',
      condition: 0,
      hasTrack: true,
    })
    expect(ride.distanceKm).toBeGreaterThan(0.29)
    expect(ride.movingSec).toBeGreaterThanOrEqual(59)
    expect(ride.elapsedSec).toBe(60)
    expect(await db.rides.count()).toBe(1)
    expect(await db.track_points.where('rideId').equals(ride.id).count()).toBeGreaterThanOrEqual(12)
    expect(await getActive()).toBeUndefined()
    expect(await db.active_points.count()).toBe(0)
  })

  it('izin lokasi ditolak (ERR-001) → fase ditolak, GPS dihentikan', async () => {
    const geo = new FakeGeo()
    const rec = new Recorder({ geo, wakeLock: fakeWake().wl, now: () => T0 })
    await rec.start()
    geo.deny()
    expect(rec.getView().phase).toBe('ditolak')
    expect(geo.cleared).toBe(1)
  })

  it('tanpa GPS di perangkat → galat jelas', async () => {
    const rec = new Recorder({ geo: null, wakeLock: null, now: () => T0 })
    await rec.start()
    expect(rec.getView().phase).toBe('galat')
  })

  it('Wake Lock gagal (ERR-007) ditandai, rekaman tetap jalan', async () => {
    const geo = new FakeGeo()
    const wl: WakeLockLike = { request: vi.fn(async () => Promise.reject(new Error('x'))) }
    const rec = new Recorder({ geo, wakeLock: wl, now: () => T0 })
    await rec.start()
    await waitFor(() => expect(rec.getView().wakeLock).toBe('gagal'))
    pedal(geo, 0, 5)
    expect(rec.getView().phase).toBe('merekam')
  })

  it('Wake Lock diminta ulang saat layar kembali dan dilepas', async () => {
    const geo = new FakeGeo()
    const { wl, sentinel } = fakeWake()
    const rec = new Recorder({ geo, wakeLock: wl, now: () => T0 })
    await rec.start()
    expect(wl.calls).toBe(1)
    sentinel.released = true // dilepas sistem saat layar mati
    await rec.onVisible()
    expect(wl.calls).toBe(2)
  })

  it('jeda manual: tidak menambah jarak; lanjut berjalan lagi', async () => {
    const geo = new FakeGeo()
    const rec = new Recorder({ geo, wakeLock: fakeWake().wl, now: () => T0 })
    await rec.start()
    pedal(geo, 0, 10)
    rec.togglePause()
    expect(rec.getView().phase).toBe('jeda')
    const d = rec.getView().stats.distanceKm
    pedal(geo, 11, 10)
    expect(rec.getView().stats.distanceKm).toBe(d)
    rec.togglePause()
    expect(rec.getView().phase).toBe('merekam')
  })

  it('tutup paksa → Lanjutkan: angka dan titik tidak hilang, celah dihitung jeda (AC-024)', async () => {
    const geo1 = new FakeGeo()
    const rec1 = new Recorder({ geo: geo1, wakeLock: fakeWake().wl, now: () => T0 })
    await rec1.start()
    pedal(geo1, 0, 60)
    await rec1.flush()
    const km = rec1.getView().stats.distanceKm
    const saved = await getActive()
    expect(saved?.distanceKm).toBeGreaterThan(0.25) // sudah tertulis walau tak pernah stop()
    expect(await db.active_points.count()).toBeGreaterThanOrEqual(10)

    // "Aplikasi dibuka lagi" 5 menit kemudian: instance baru.
    const geo2 = new FakeGeo()
    const rec2 = new Recorder({ geo: geo2, wakeLock: fakeWake().wl, now: () => T0 + 360_000 })
    await rec2.start(true)
    expect(rec2.getView().stats.distanceKm).toBeGreaterThan(0.25)
    expect(rec2.getView().stats.distanceKm).toBeLessThanOrEqual(km)
    // Posisi pertama setelah lanjut jauh dari terakhir → tidak ada jarak lompat.
    geo2.emit(T0 + 361_000, 5000)
    expect(rec2.getView().stats.distanceKm).toBeLessThanOrEqual(km)
    geo2.emit(T0 + 362_000, 5005)
    await rec2.flush()
    expect((await getActive())?.pausedTotalSec).toBeGreaterThan(250)
  })

  it('hanya satu rekaman aktif sekaligus', async () => {
    await startRecording(db, T0)
    await expect(startRecording(db, T0)).rejects.toThrow()
  })

  it('menyimpan tanpa rekaman aktif ditolak', async () => {
    await expect(saveRecording({ type: 'metime', condition: 1 })).rejects.toThrow()
  })

  it('buang menghapus rekaman dan titiknya', async () => {
    const geo = new FakeGeo()
    const rec = new Recorder({ geo, wakeLock: fakeWake().wl, now: () => T0 })
    await rec.start()
    pedal(geo, 0, 20)
    await rec.stop()
    await discardRecording()
    expect(await getActive()).toBeUndefined()
    expect(await db.active_points.count()).toBe(0)
    expect(await db.rides.count()).toBe(0)
  })
})

function renderRecord(
  geo: FakeGeo,
  route: string | { pathname: string; state: unknown } = '/rekam',
) {
  const { wl } = fakeWake()
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <Routes>
          <Route path="/rekam" element={<RecordPage deps={{ geo, wakeLock: wl }} />} />
          <Route path="/gowes" element={<p>Halaman Gowes</p>} />
          <Route path="/" element={<p>Beranda</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('Layar Rekam', () => {
  it('AC-020/028: peringatan keselamatan sekali dan peringatan layar terkunci', async () => {
    const user = userEvent.setup()
    const geo = new FakeGeo()
    const first = renderRecord(geo)
    expect(await screen.findByText(/Jangan mengoperasikan HP sambil mengayuh/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Saya mengerti, mulai' }))
    expect(await screen.findByText('Mencari sinyal GPS…')).toBeInTheDocument()
    expect(screen.getByText(/bisa berhenti bila layar dikunci/)).toBeInTheDocument()
    await waitFor(async () => expect(await getSetting(db, 'safetyNoticeSeen')).toBe(true))
    first.unmount()
    await discardRecording()

    renderRecord(new FakeGeo())
    expect(await screen.findByRole('button', { name: 'Mulai gowes' })).toBeInTheDocument()
    expect(screen.queryByText(/Jangan mengoperasikan HP/)).toBeNull()
  })

  it('AC-021/025: angka besar, Selesai → jenis & kondisi → Simpan masuk ke riwayat', async () => {
    const user = userEvent.setup()
    const geo = new FakeGeo()
    renderRecord(geo)
    await user.click(await screen.findByRole('button', { name: /mulai/i }))
    await screen.findByText('Mencari sinyal GPS…')
    const base = Date.now() - 120_000
    act(() => {
      for (let i = 0; i <= 60; i++) geo.emit(base + i * 1000, 5 * i, { ele: 100 })
    })
    expect(await screen.findByText('Kecepatan')).toBeInTheDocument()
    expect(screen.getByText('Jarak')).toBeInTheDocument()
    expect(screen.getByText('Waktu bergerak')).toBeInTheDocument()
    expect(screen.getByText('Tanjakan')).toBeInTheDocument()
    expect(screen.getByText('18,0')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Selesai' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Selesai' }),
    )
    expect(await screen.findByText('Ringkasan gowes')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Bareng anak' }))
    await user.click(screen.getByRole('button', { name: 'Kondisi Capek' }))
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(await screen.findByText('Halaman Gowes')).toBeInTheDocument()
    const rides = await db.rides.toArray()
    expect(rides).toHaveLength(1)
    expect(rides[0]).toMatchObject({ source: 'recorded', type: 'bareng_anak', condition: 2 })
  })

  it('AC-029: izin ditolak → pesan dan jalan ke catat manual', async () => {
    const user = userEvent.setup()
    const geo = new FakeGeo()
    renderRecord(geo)
    await user.click(await screen.findByRole('button', { name: /mulai/i }))
    await screen.findByText('Mencari sinyal GPS…')
    act(() => geo.deny())
    expect(await screen.findByText('Izin lokasi ditolak')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Catat manual' }))
    expect(await screen.findByText('Halaman Gowes')).toBeInTheDocument()
    expect(await getActive()).toBeUndefined()
  })

  it('FR-139: rekaman tertunda menawarkan Lanjutkan/Simpan/Buang; Buang meminta konfirmasi', async () => {
    const user = userEvent.setup()
    await startRecording(db, Date.now() - 3_600_000)
    renderRecord(new FakeGeo())
    expect(await screen.findByText('Rekaman belum selesai')).toBeInTheDocument()
    for (const n of ['Lanjutkan', 'Simpan', 'Buang'])
      expect(screen.getByRole('button', { name: n })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Buang' }))
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Buang' }),
    )
    await waitFor(async () => expect(await getActive()).toBeUndefined())
  })

  it('Simpan dari rekaman tertunda → ringkasan memakai angka yang tersimpan', async () => {
    const user = userEvent.setup()
    await startRecording(db, Date.now() - 3_600_000)
    const rec = await getActive()
    await db.active_recording.put({ ...rec!, distanceKm: 12.34, movingSec: 2400, elevationM: 55 })
    renderRecord(new FakeGeo())
    await user.click(await screen.findByRole('button', { name: 'Simpan' }))
    expect(await screen.findByText('12,34')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    await screen.findByText('Halaman Gowes')
    expect((await db.rides.toArray())[0]).toMatchObject({ distanceKm: 12.34, source: 'recorded' })
  })
})

describe('Pemulihan saat aplikasi dibuka (FR-139)', () => {
  it('lembar pilihan muncul di Beranda bila ada rekaman tertunda', async () => {
    await startRecording(db, Date.now() - 3_600_000)
    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('dialog', { name: 'Rekaman belum selesai' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lanjutkan' })).toBeInTheDocument()
  })
  it('tidak muncul tanpa rekaman tertunda', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </MemoryRouter>,
    )
    await screen.findByRole('button', { name: 'Mulai Gowes' })
    expect(screen.queryByRole('dialog', { name: 'Rekaman belum selesai' })).toBeNull()
  })
})
