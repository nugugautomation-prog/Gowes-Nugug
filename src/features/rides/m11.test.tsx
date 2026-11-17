import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Gowes } from '../../app/pages/Gowes'
import { db } from '../../db/database'
import { ensureDefaults } from '../../db/settings'
import type { Ride, TrackPoint } from '../../db/types'
import { ToastProvider } from '../../ui/Toast'
import { TrackMap } from '../map/TrackMap'
import { RecordedRideDetail } from './RecordedRideDetail'
import { addManualRide, updateRecordedMeta } from './rideRepo'

// MapLibre palsu: jsdom tidak punya WebGL. `mapState` mengatur perilaku uji.
const mapState = {
  throwOnCreate: false,
  handlers: {} as Record<string, () => void>,
  setData: vi.fn(),
}
vi.mock('maplibre-gl', () => {
  class FakeMap {
    constructor() {
      if (mapState.throwOnCreate) throw new Error('WebGL tidak tersedia')
    }
    on(ev: string, fn: () => void) {
      mapState.handlers[ev] = fn
    }
    addSource() {}
    addLayer() {}
    getSource() {
      return { setData: mapState.setData }
    }
    getZoom() {
      return 15
    }
    jumpTo() {}
    fitBounds() {}
    remove() {}
  }
  class FakeBounds {
    extend() {
      return this
    }
  }
  return { Map: FakeMap, LngLatBounds: FakeBounds, setWorkerUrl: () => {} }
})

const M_PER_DEG = 111_194.9
const T0 = Date.UTC(2026, 10, 17, 1, 0, 0)

function track(rideId: string, meters: number): TrackPoint[] {
  return Array.from({ length: meters / 10 + 1 }, (_, i) => ({
    rideId,
    seq: i,
    ts: T0 + i * 2000,
    lat: -6.2 + (i * 10) / M_PER_DEG,
    lon: 106.8,
    acc: 5,
    paused: false,
  }))
}

function recordedRide(over: Partial<Ride> = {}): Ride {
  return {
    id: 'rec1',
    date: '2026-11-17',
    source: 'recorded',
    distanceKm: 12.34,
    movingSec: 2400,
    elevationM: 55,
    category: 'hari_kerja',
    type: 'metime',
    condition: 1,
    startedAt: T0,
    elapsedSec: 2600,
    hasTrack: true,
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }
}

let blobs: Blob[] = []
beforeEach(async () => {
  for (const t of db.tables) await t.clear()
  await ensureDefaults(db)
  mapState.throwOnCreate = false
  mapState.handlers = {}
  mapState.setData = vi.fn()
  blobs = []
  URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
    blobs.push(b as Blob)
    return 'blob:x'
  })
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

const wrap = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>,
  )

describe('TrackMap (FR-135…137, ERR-005)', () => {
  const props = {
    styleUrl: 'https://x/style',
    mode: 'fit' as const,
    track: [[106.8, -6.2] as [number, number]],
  }

  it('mencantumkan sumber peta', async () => {
    render(<TrackMap {...props} />)
    expect(await screen.findByText(/OpenStreetMap contributors · OpenFreeMap/)).toBeInTheDocument()
  })

  it('peta gagal dibuat (tanpa WebGL) → "Peta tidak tersedia", tidak crash', async () => {
    mapState.throwOnCreate = true
    render(<TrackMap {...props} />)
    expect(await screen.findByText('Peta tidak tersedia')).toBeInTheDocument()
  })

  it('gambar peta gagal dimuat (offline) → pesan, aplikasi tetap jalan (AC-023)', async () => {
    render(<TrackMap {...props} />)
    await screen.findByLabelText('Peta jejak')
    mapState.handlers.error?.()
    expect(await screen.findByText('Peta tidak tersedia')).toBeInTheDocument()
  })
})

describe('updateRecordedMeta (AC-026)', () => {
  it('mengubah kategori/jenis/kondisi/catatan tanpa menyentuh angka', async () => {
    await db.rides.add(recordedRide())
    await updateRecordedMeta('rec1', {
      category: 'sabtu_sore',
      type: 'bareng_anak',
      condition: 2,
      note: '  hujan  ',
    })
    expect(await db.rides.get('rec1')).toMatchObject({
      category: 'sabtu_sore',
      type: 'bareng_anak',
      condition: 2,
      note: 'hujan',
      distanceKm: 12.34,
      movingSec: 2400,
      elevationM: 55,
      source: 'recorded',
    })
  })
  it('catatan dikosongkan menghapus catatan', async () => {
    await db.rides.add(recordedRide({ note: 'lama' }))
    await updateRecordedMeta('rec1', {
      category: 'lainnya',
      type: 'metime',
      condition: 1,
      note: ' ',
    })
    expect(await db.rides.get('rec1')).not.toHaveProperty('note')
  })
  it('menolak gowes manual dan yang tidak ada', async () => {
    const m = await addManualRide({
      date: '2026-11-10',
      distanceKm: 5,
      movingSec: 900,
      elevationM: 0,
      category: 'hari_kerja',
      type: 'metime',
      condition: 1,
    })
    await expect(
      updateRecordedMeta(m.id, { category: 'lainnya', type: 'metime', condition: 1 }),
    ).rejects.toThrow()
    await expect(
      updateRecordedMeta('nihil', { category: 'lainnya', type: 'metime', condition: 1 }),
    ).rejects.toThrow()
  })
})

describe('RecordedRideDetail', () => {
  async function open(meters: number) {
    const ride = recordedRide()
    await db.rides.add(ride)
    await db.track_points.bulkAdd(track(ride.id, meters))
    const onClose = vi.fn()
    wrap(<RecordedRideDetail ride={ride} onClose={onClose} onDelete={() => {}} />)
    return { ride, onClose }
  }

  it('menampilkan angka terkunci, peta dengan atribusi, dan tidak ada input angka', async () => {
    await open(1000)
    expect(await screen.findByText('12,34 km')).toBeInTheDocument()
    expect(screen.getByText(/dikunci/)).toBeInTheDocument()
    expect(await screen.findByLabelText('Peta jejak')).toBeInTheDocument()
    expect(screen.getByText(/OpenFreeMap/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Jarak|Waktu|Tanjakan/)).toBeNull()
  })

  it('AC-026: ubah kategori, jenis, kondisi, catatan lalu Simpan', async () => {
    const user = userEvent.setup()
    const { onClose } = await open(1000)
    await user.click(await screen.findByRole('button', { name: 'Bareng anak' }))
    await user.click(screen.getByRole('button', { name: 'Kondisi Capek' }))
    await user.type(screen.getByLabelText('Catatan'), 'Seru')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    await waitFor(async () =>
      expect(await db.rides.get('rec1')).toMatchObject({
        type: 'bareng_anak',
        condition: 2,
        note: 'Seru',
        distanceKm: 12.34,
      }),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('catatan > 280 karakter ditolak', async () => {
    const user = userEvent.setup()
    await open(1000)
    const box = await screen.findByLabelText('Catatan')
    await user.click(box)
    await user.paste('x'.repeat(281))
    expect(await screen.findByText(/Maksimal 280/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled()
  })

  it('AC-027: Ekspor GPX menghasilkan file valid; potong 200 m membuang ujungnya', async () => {
    const user = userEvent.setup()
    await open(1000)
    await user.click(await screen.findByRole('button', { name: 'Ekspor GPX' }))
    await waitFor(() => expect(blobs).toHaveLength(1))
    const full = new DOMParser().parseFromString(await blobs[0]!.text(), 'application/xml')
    expect(full.querySelector('parsererror')).toBeNull()
    expect(full.querySelectorAll('trkpt')).toHaveLength(101)

    await user.click(screen.getByRole('button', { name: 'Potong 200 m awal dan akhir' }))
    await user.click(screen.getByRole('button', { name: 'Ekspor GPX' }))
    await waitFor(() => expect(blobs).toHaveLength(2))
    const cut = new DOMParser().parseFromString(await blobs[1]!.text(), 'application/xml')
    expect(cut.querySelectorAll('trkpt')).toHaveLength(61)
  })

  it('BR-024: jejak < 400 m menonaktifkan opsi potong dengan penjelasan', async () => {
    await open(300)
    const chip = await screen.findByRole('button', { name: 'Potong 200 m awal dan akhir' })
    expect(chip).toBeDisabled()
    expect(screen.getByText(/kurang dari 400 m/)).toBeInTheDocument()
  })

  it('tanpa titik tersimpan: pesan jelas dan tanpa tombol ekspor', async () => {
    const ride = recordedRide({ hasTrack: false })
    await db.rides.add(ride)
    wrap(<RecordedRideDetail ride={ride} onClose={() => {}} onDelete={() => {}} />)
    expect(await screen.findByText(/Jejak GPS tidak tersimpan/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ekspor GPX' })).toBeNull()
  })
})

describe('Halaman Gowes: detail', () => {
  it('gowes rekaman membuka detail rekaman; gowes manual tetap panel lama', async () => {
    const user = userEvent.setup()
    await db.rides.add(recordedRide())
    await addManualRide({
      date: '2026-11-10',
      distanceKm: 5,
      movingSec: 900,
      elevationM: 0,
      category: 'hari_kerja',
      type: 'metime',
      condition: 1,
    })
    wrap(<Gowes />)
    const items = await screen.findAllByRole('button', { name: /km/ })
    const rec = items.find((b) => b.textContent?.includes('12,3'))
    expect(rec).toBeDefined()
    await user.click(rec!)
    const dlg = await screen.findByRole('dialog')
    expect(within(dlg).getByRole('button', { name: 'Simpan' })).toBeInTheDocument()
    expect(within(dlg).getByText(/dikunci/)).toBeInTheDocument()
  })
})
