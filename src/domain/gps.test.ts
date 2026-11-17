import { describe, expect, it } from 'vitest'
import {
  GPS_CONFIG,
  haversineM,
  initialState,
  processFix,
  restoreState,
  setManualPause,
  statsOf,
  type EngineState,
  type Fix,
  type StoredPoint,
} from './gps'

const LAT0 = -6.2
const LON0 = 106.8
const M_PER_DEG = 111_194.9
const north = (m: number) => LAT0 + m / M_PER_DEG
const T0 = Date.UTC(2026, 10, 17, 1, 0, 0)

function run(
  fixes: Fix[],
  start: EngineState = initialState(),
): { state: EngineState; stored: StoredPoint[]; rejected: number } {
  let state = start
  const stored: StoredPoint[] = []
  let rejected = 0
  for (const f of fixes) {
    const r = processFix(state, f)
    state = r.state
    if (r.store) stored.push(r.store)
    if (!r.accepted) rejected++
  }
  return { state, stored, rejected }
}

/** Bersepeda lurus ke utara pada `mps` selama `seconds` detik, 1 titik/detik. */
function ride(
  mps: number,
  seconds: number,
  opts: Partial<Fix> & { t0?: number; m0?: number } = {},
) {
  const { t0 = T0, m0 = 0, ...rest } = opts
  return Array.from({ length: seconds + 1 }, (_, i): Fix => ({
    ts: t0 + i * 1000,
    lat: north(m0 + mps * i),
    lon: LON0,
    acc: 5,
    speed: mps,
    ...rest,
  }))
}

describe('haversineM', () => {
  it('1 derajat lintang ≈ 111,2 km', () => {
    expect(haversineM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111_195, -2)
  })
  it('titik sama = 0', () => {
    expect(haversineM({ lat: 1, lon: 2 }, { lat: 1, lon: 2 })).toBe(0)
  })
})

describe('jarak & waktu bergerak (BR-006, BR-015)', () => {
  it('bersepeda 18 km/jam selama 60 detik ≈ 300 m dan 60 detik bergerak', () => {
    const { state } = run(ride(5, 60))
    const s = statsOf(state)
    expect(s.distanceKm * 1000).toBeGreaterThan(290)
    expect(s.distanceKm * 1000).toBeLessThanOrEqual(300.5)
    expect(s.movingSec).toBeGreaterThanOrEqual(59)
    expect(state.status).toBe('merekam')
  })

  it('jarak dihitung dari semua titik valid walau akurasi besar (tidak ada jarak hilang)', () => {
    // 5 m/s dengan akurasi 8 m: pergeseran 1 dtk < akurasi, tapi jangkar mengumpulkannya.
    const { state } = run(ride(5, 120, { acc: 8, speed: null }))
    expect(state.distanceM).toBeGreaterThan(590)
    expect(state.distanceM).toBeLessThanOrEqual(600.5)
  })

  it('tanpa coords.speed, kecepatan ditaksir dari titik terakhir', () => {
    const { state } = run(ride(5, 30, { speed: null }))
    expect(state.status).toBe('merekam')
    expect(state.maxKmh).toBeGreaterThan(15)
  })

  it('kecepatan maksimum tercatat dan tidak melebihi batas wajar', () => {
    const { state } = run(ride(10, 20))
    expect(statsOf(state).maxSpeedKmh).toBeCloseTo(36, 0)
  })
})

describe('diam & jeda otomatis (BR-014, AC-022)', () => {
  const jitter = (n: number, extra: Partial<Fix> = {}): Fix[] =>
    Array.from({ length: n }, (_, i) => ({
      ts: T0 + i * 1000,
      lat: north(3 * Math.sin(i * 1.7)),
      lon: LON0 + (3 * Math.cos(i * 2.3)) / (M_PER_DEG * Math.cos((LAT0 * Math.PI) / 180)),
      acc: 8,
      speed: null,
      ...extra,
    }))

  it('GPS bergoyang ±3 m saat diam 2 menit: jarak tetap 0 dan masuk jeda', () => {
    const { state } = run(jitter(120))
    expect(state.distanceM).toBe(0)
    expect(state.status).toBe('jeda')
    expect(statsOf(state).movingSec).toBeLessThanOrEqual(6)
  })

  it('berhenti di lampu merah: waktu bergerak berhenti & jarak tidak bertambah', () => {
    const moving = ride(5, 30)
    const mid = run(moving).state
    const atLight = Array.from({ length: 60 }, (_, i) => ({
      ts: T0 + (31 + i) * 1000,
      lat: north(150 + 2 * Math.sin(i)),
      lon: LON0,
      acc: 6,
      speed: 0,
    }))
    const { state } = run(atLight, mid)
    expect(state.status).toBe('jeda')
    expect(state.distanceM - mid.distanceM).toBeLessThan(1)
    expect(statsOf(state).movingSec - statsOf(mid).movingSec).toBeLessThanOrEqual(5)
    expect(state.pausedMs).toBeGreaterThan(50_000)
  })

  it('bergerak lagi: kembali merekam dan jarak bertambah', () => {
    const idle = run(jitter(30)).state
    expect(idle.status).toBe('jeda')
    const { state } = run(ride(5, 20, { t0: T0 + 30_000, m0: 10 }), idle)
    expect(state.status).toBe('merekam')
    expect(state.distanceM).toBeGreaterThan(80)
  })

  it('jeda tidak terjadi bila diam kurang dari 5 detik', () => {
    const moving = run(ride(5, 20)).state
    const stop = Array.from({ length: 3 }, (_, i) => ({
      ts: T0 + (21 + i) * 1000,
      lat: north(100),
      lon: LON0,
      acc: 5,
      speed: 0,
    }))
    expect(run(stop, moving).state.status).toBe('merekam')
  })
})

describe('filter titik (BR-015)', () => {
  it('akurasi > 30 m dibuang', () => {
    const fixes = ride(5, 10)
    fixes[5] = { ...(fixes[5] as Fix), acc: 31 }
    const r = run(fixes)
    expect(r.rejected).toBe(1)
  })

  it('akurasi tepat 30 m masih diterima', () => {
    expect(run([{ ts: T0, lat: LAT0, lon: LON0, acc: GPS_CONFIG.MAX_ACCURACY_M }]).rejected).toBe(0)
  })

  it('lonjakan > 70 km/jam dibuang dan tidak menambah jarak', () => {
    const fixes = ride(5, 20)
    fixes.splice(10, 0, { ts: T0 + 9500, lat: north(1000), lon: LON0, acc: 5, speed: 5 })
    const clean = run(ride(5, 20)).state
    const r = run(fixes)
    expect(r.rejected).toBe(1)
    expect(Math.abs(r.state.distanceM - clean.distanceM)).toBeLessThan(10)
  })

  it('titik berurutan terbalik/duplikat dibuang', () => {
    const f = ride(5, 5)
    const r = run([...f, f[2] as Fix])
    expect(r.rejected).toBe(1)
  })

  it('koordinat tidak valid dibuang tanpa NaN', () => {
    const r = run([
      { ts: T0, lat: Number.NaN, lon: LON0, acc: 5 },
      { ts: T0 + 1000, lat: 95, lon: LON0, acc: 5 },
      { ts: T0 + 2000, lat: LAT0, lon: LON0, acc: Number.NaN },
    ])
    expect(r.rejected).toBe(3)
    expect(JSON.stringify(statsOf(r.state))).not.toMatch(/NaN|null/)
  })
})

describe('celah rekaman (BR-017, ERR-003)', () => {
  it('celah > 30 dtk tidak dihitung sebagai garis lurus panjang', () => {
    const a = ride(5, 20)
    const before = run(a).state
    // Sinyal hilang 60 dtk, muncul 600 m dari terakhir.
    const resume = ride(5, 10, { t0: T0 + 80_000, m0: 700 })
    const { state } = run(resume, before)
    expect(state.distanceM - before.distanceM).toBeLessThan(60) // hanya gerak setelah pulih
    expect(state.pausedMs - before.pausedMs).toBeGreaterThanOrEqual(59_000)
  })

  it('celah tepat ≤ 30 dtk masih satu segmen', () => {
    const before = run(ride(5, 10)).state
    const next = ride(5, 5, { t0: T0 + 40_000, m0: 200 }) // 30 dtk setelah titik terakhir
    const { state } = run(next, before)
    expect(state.distanceM).toBeGreaterThan(before.distanceM + 100)
  })
})

describe('jeda manual', () => {
  it('bergerak saat jeda manual tidak menambah jarak/waktu; lanjut memulai segmen baru', () => {
    let st = run(ride(5, 10)).state
    const dist = st.distanceM
    const moving = st.movingMs
    st = setManualPause(st, true)
    st = run(ride(5, 20, { t0: T0 + 11_000, m0: 55 }), st).state
    expect(st.distanceM).toBe(dist)
    expect(st.movingMs).toBe(moving)
    expect(st.status).toBe('jeda')
    st = setManualPause(st, false)
    expect(st.status).toBe('merekam')
    // Titik pertama setelah lanjut tidak menambah jarak dari posisi lama.
    const r = run([{ ts: T0 + 40_000, lat: north(900), lon: LON0, acc: 5, speed: 5 }], st)
    expect(r.state.distanceM).toBe(dist)
  })
})

describe('elevasi (BR-016)', () => {
  const withEle = (eles: number[]): Fix[] =>
    eles.map((e, i) => ({
      ts: T0 + i * 1000,
      lat: north(5 * i),
      lon: LON0,
      acc: 5,
      speed: 5,
      ele: e,
    }))

  it('getaran ±1 m tidak dihitung tanjakan', () => {
    const wiggle = Array.from({ length: 60 }, (_, i) => 100 + (i % 2 ? 1 : -1))
    expect(run(withEle(wiggle)).state.elevationM).toBe(0)
  })

  it('tanjakan landai 20 m terhitung mendekati 20 m', () => {
    const climb = Array.from({ length: 41 }, (_, i) => 100 + Math.min(i, 20))
    const gain = run(withEle(climb)).state.elevationM
    expect(gain).toBeGreaterThan(12)
    expect(gain).toBeLessThanOrEqual(20.5)
  })

  it('turunan tidak mengurangi tanjakan', () => {
    const down = Array.from({ length: 30 }, (_, i) => 100 - i)
    expect(run(withEle(down)).state.elevationM).toBe(0)
  })

  it('lonjakan GPS sesaat (median) diabaikan', () => {
    const eles = Array.from({ length: 30 }, () => 100)
    eles[15] = 160
    expect(run(withEle(eles)).state.elevationM).toBe(0)
  })

  it('tanpa data elevasi: 0, tanpa NaN', () => {
    const { state } = run(ride(5, 20))
    expect(statsOf(state).elevationM).toBe(0)
  })
})

describe('penyimpanan berkala (BR-015, FR-138)', () => {
  it('60 detik pada 1 Hz menyimpan ±1 titik per 5 detik', () => {
    const { stored } = run(ride(5, 60))
    expect(stored.length).toBeGreaterThanOrEqual(12)
    expect(stored.length).toBeLessThanOrEqual(14)
  })
  it('titik tersimpan menandai status jeda', () => {
    const idle = Array.from({ length: 30 }, (_, i) => ({
      ts: T0 + i * 1000,
      lat: LAT0,
      lon: LON0,
      acc: 8,
      speed: 0,
    }))
    const { stored } = run(idle)
    expect(stored.at(-1)?.paused).toBe(true)
  })
})

describe('pemulihan (FR-139)', () => {
  it('restoreState membawa angka lama dan titik pertama tidak melompatkan jarak', () => {
    const st = restoreState({ distanceKm: 1.5, movingSec: 400, elevationM: 20, pausedTotalSec: 30 })
    const { state } = run([{ ts: T0, lat: north(50_000), lon: LON0, acc: 5, speed: 5 }], st)
    expect(state.distanceM).toBe(1500)
    expect(statsOf(state).movingSec).toBe(400)
    expect(state.pausedMs).toBe(30_000)
  })
})
