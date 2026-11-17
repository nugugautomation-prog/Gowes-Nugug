// Mesin perekaman GPS (BR-014…017). Fungsi murni: tanpa DB, jam, atau API browser,
// sehingga bisa diuji dengan data sintetis. Semua ambang ada di GPS_CONFIG agar mudah dikalibrasi.

export const GPS_CONFIG = {
  /** BR-015: titik dengan akurasi horizontal lebih buruk dari ini dibuang. */
  MAX_ACCURACY_M: 30,
  /** BR-014: di bawah kecepatan ini dianggap diam. */
  PAUSE_SPEED_KMH: 2,
  /** BR-014: lamanya diam berturut-turut sebelum jeda otomatis. */
  PAUSE_AFTER_MS: 5000,
  /** BR-015: loncatan yang menyiratkan kecepatan di atas ini dibuang. */
  MAX_SPEED_KMH: 70,
  /** BR-017: celah antartitik lebih lama dari ini = segmen baru, tanpa garis lurus. */
  GAP_MS: 30_000,
  /** BR-015: titik disimpan paling sering sekali per interval ini. */
  STORE_EVERY_MS: 5000,
  /** BR-016: kenaikan elevasi di bawah ini diabaikan (getaran kecil). */
  ELEVATION_STEP_M: 2,
  /** BR-016: jendela median untuk menghaluskan elevasi. */
  ELEVATION_WINDOW: 5,
  /** Jumlah titik terakhir untuk menaksir kecepatan bila coords.speed kosong (D-21). */
  SPEED_WINDOW: 4,
} as const

export interface Fix {
  /** Epoch ms. */
  ts: number
  lat: number
  lon: number
  ele?: number | null
  /** Akurasi horizontal (m). */
  acc: number
  /** coords.speed (m/s) atau null/undefined bila tidak ada. */
  speed?: number | null
}

export type RecStatus = 'merekam' | 'jeda'

export interface EngineState {
  status: RecStatus
  manualPause: boolean
  distanceM: number
  movingMs: number
  pausedMs: number
  elevationM: number
  maxKmh: number
  /** Kecepatan terakhir (km/jam), untuk tampilan. */
  kmh: number
  /** Jangkar geometri: jarak hanya bertambah bila posisi bergeser melebihi akurasi dari sini. */
  anchor: Fix | null
  lastTs: number | null
  segmentBreak: boolean
  slowSinceTs: number | null
  recent: Fix[]
  eleWindow: number[]
  /** Beberapa median terakhir; dirata-rata agar ayunan bolak-balik tidak jadi tanjakan. */
  eleMed: number[]
  eleRef: number | null
  lastStoredTs: number | null
}

export function initialState(): EngineState {
  return {
    status: 'merekam',
    manualPause: false,
    distanceM: 0,
    movingMs: 0,
    pausedMs: 0,
    elevationM: 0,
    maxKmh: 0,
    kmh: 0,
    anchor: null,
    lastTs: null,
    segmentBreak: false,
    slowSinceTs: null,
    recent: [],
    eleWindow: [],
    eleMed: [],
    eleRef: null,
    lastStoredTs: null,
  }
}

const R = 6_371_008.8

/** Jarak Haversine (meter). */
export function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function median(values: number[]): number {
  const s = [...values].sort((x, y) => x - y)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2
}

function validFix(f: Fix): boolean {
  return (
    Number.isFinite(f.ts) &&
    Number.isFinite(f.lat) &&
    Number.isFinite(f.lon) &&
    Math.abs(f.lat) <= 90 &&
    Math.abs(f.lon) <= 180 &&
    Number.isFinite(f.acc) &&
    f.acc >= 0
  )
}

export interface StoredPoint {
  ts: number
  lat: number
  lon: number
  ele?: number
  acc: number
  paused: boolean
}

export interface FixResult {
  state: EngineState
  /** Titik yang perlu disimpan ke penyimpanan (dijarangkan tiap ±5 dtk), atau null. */
  store: StoredPoint | null
  accepted: boolean
}

const reject = (state: EngineState): FixResult => ({ state, store: null, accepted: false })

function toStored(f: Fix, paused: boolean): StoredPoint {
  return {
    ts: f.ts,
    lat: f.lat,
    lon: f.lon,
    ...(f.ele === null || f.ele === undefined ? {} : { ele: f.ele }),
    acc: f.acc,
    paused,
  }
}

function maybeStore(s: EngineState, f: Fix, force = false): [EngineState, StoredPoint | null] {
  if (!force && s.lastStoredTs !== null && f.ts - s.lastStoredTs < GPS_CONFIG.STORE_EVERY_MS)
    return [s, null]
  return [{ ...s, lastStoredTs: f.ts }, toStored(f, s.status === 'jeda')]
}

/** Memproses satu titik GPS. Tidak mengubah `state` masukan. */
export function processFix(prev: EngineState, f: Fix): FixResult {
  const C = GPS_CONFIG
  if (!validFix(f) || f.acc > C.MAX_ACCURACY_M) return reject(prev)
  if (prev.lastTs !== null && f.ts <= prev.lastTs) return reject(prev)
  let s: EngineState = { ...prev }

  // Titik pertama, atau awal segmen baru (setelah jeda manual / pemulihan): tanpa jarak.
  if (s.anchor === null || s.lastTs === null) {
    s = { ...s, anchor: f, lastTs: f.ts, recent: [f], segmentBreak: false, slowSinceTs: null }
    s = { ...s, ...withElevation(s, f, true) }
    const [n, store] = maybeStore(s, f, true)
    return { state: n, store, accepted: true }
  }

  const dtMs = f.ts - s.lastTs

  // Jeda manual: waktu masuk jeda, tidak ada jarak; segmen baru saat lanjut.
  if (s.manualPause) {
    s = { ...s, pausedMs: s.pausedMs + dtMs, lastTs: f.ts, segmentBreak: true, kmh: 0 }
    const [n, store] = maybeStore(s, f)
    return { state: n, store, accepted: true }
  }

  // BR-017: celah panjang atau awal segmen baru → tidak ada garis lurus; hitung sebagai jeda.
  if (s.segmentBreak || dtMs > C.GAP_MS) {
    s = {
      ...s,
      anchor: f,
      lastTs: f.ts,
      recent: [f],
      segmentBreak: false,
      slowSinceTs: null,
      pausedMs: s.pausedMs + dtMs,
      status: 'merekam',
      kmh: 0,
    }
    const [n, store] = maybeStore(s, f, true)
    return { state: n, store, accepted: true }
  }

  // BR-015: buang lonjakan tak masuk akal (dibandingkan dengan titik valid terakhir).
  const lastFix = s.recent[s.recent.length - 1] ?? s.anchor
  const stepM = haversineM(lastFix, f)
  if ((stepM / (dtMs / 1000)) * 3.6 > C.MAX_SPEED_KMH) return reject(prev)

  // Kecepatan (D-21): coords.speed bila ada; kalau tidak, dari jarak beberapa titik terakhir.
  const recent = [...s.recent, f].slice(-C.SPEED_WINDOW)
  let kmh: number
  if (f.speed !== null && f.speed !== undefined && Number.isFinite(f.speed) && f.speed >= 0) {
    kmh = f.speed * 3.6
  } else {
    const first = recent[0] as Fix
    const winM = haversineM(first, f)
    const winS = (f.ts - first.ts) / 1000
    kmh = winS > 0 && winM >= f.acc ? (winM / winS) * 3.6 : 0 // pergeseran < akurasi = diam
  }
  if (kmh > C.MAX_SPEED_KMH) kmh = C.MAX_SPEED_KMH
  s = { ...s, recent, lastTs: f.ts, maxKmh: Math.max(s.maxKmh, kmh), kmh }

  // BR-014: jeda otomatis.
  if (kmh < C.PAUSE_SPEED_KMH) {
    const since = s.slowSinceTs ?? f.ts
    s.slowSinceTs = since
    if (s.status === 'merekam' && f.ts - since >= C.PAUSE_AFTER_MS) {
      // Masa tenggang diam sebelum jeda ikut dihitung jeda, bukan waktu bergerak.
      const grace = Math.min(s.movingMs, f.ts - since - dtMs)
      s = {
        ...s,
        status: 'jeda',
        movingMs: s.movingMs - Math.max(0, grace),
        pausedMs: s.pausedMs + Math.max(0, grace),
      }
    }
  } else {
    s = { ...s, slowSinceTs: null, status: 'merekam' }
  }

  if (s.status === 'jeda') {
    s = { ...s, pausedMs: s.pausedMs + dtMs }
  } else {
    s = { ...s, movingMs: s.movingMs + dtMs }
    // Jarak hanya bertambah bila bergeser melebihi akurasi dari jangkar (abaikan getaran saat diam).
    const fromAnchor = haversineM(s.anchor as Fix, f)
    if (fromAnchor >= f.acc) s = { ...s, distanceM: s.distanceM + fromAnchor, anchor: f }
    s = { ...s, ...withElevation(s, f, false) }
  }
  const [n, store] = maybeStore(s, f)
  return { state: n, store, accepted: true }
}

/** BR-016: median jendela kecil, dirata-rata 3 nilai, lalu hitung kenaikan dengan ambang per langkah. */
function withElevation(
  s: EngineState,
  f: Fix,
  init: boolean,
): Pick<EngineState, 'eleWindow' | 'eleMed' | 'eleRef' | 'elevationM'> {
  if (f.ele === null || f.ele === undefined || !Number.isFinite(f.ele)) {
    return { eleWindow: s.eleWindow, eleMed: s.eleMed, eleRef: s.eleRef, elevationM: s.elevationM }
  }
  const eleWindow = [...s.eleWindow, f.ele].slice(-GPS_CONFIG.ELEVATION_WINDOW)
  const eleMed = [...s.eleMed, median(eleWindow)].slice(-3)
  const smooth = eleMed.reduce((a, b) => a + b, 0) / eleMed.length
  if (init || s.eleRef === null)
    return { eleWindow, eleMed, eleRef: smooth, elevationM: s.elevationM }
  const diff = smooth - s.eleRef
  if (diff >= GPS_CONFIG.ELEVATION_STEP_M)
    return { eleWindow, eleMed, eleRef: smooth, elevationM: s.elevationM + diff }
  if (diff <= -GPS_CONFIG.ELEVATION_STEP_M)
    return { eleWindow, eleMed, eleRef: smooth, elevationM: s.elevationM }
  return { eleWindow, eleMed, eleRef: s.eleRef, elevationM: s.elevationM }
}

/** Jeda/lanjut manual. Saat lanjut, titik berikutnya memulai segmen baru. */
export function setManualPause(s: EngineState, on: boolean): EngineState {
  if (on) return { ...s, manualPause: true, status: 'jeda', slowSinceTs: null }
  return { ...s, manualPause: false, status: 'merekam', segmentBreak: true, slowSinceTs: null }
}

export interface Stats {
  distanceKm: number
  movingSec: number
  elevationM: number
  maxSpeedKmh: number
}

export function statsOf(s: EngineState): Stats {
  return {
    distanceKm: s.distanceM / 1000,
    movingSec: Math.round(s.movingMs / 1000),
    elevationM: Math.round(s.elevationM),
    maxSpeedKmh: Math.round(s.maxKmh * 10) / 10,
  }
}

/** Pulihkan mesin dari rekaman tersimpan; titik berikutnya memulai segmen baru (tanpa lompatan jarak). */
export function restoreState(saved: {
  distanceKm: number
  movingSec: number
  elevationM: number
  pausedTotalSec: number
}): EngineState {
  return {
    ...initialState(),
    distanceM: saved.distanceKm * 1000,
    movingMs: saved.movingSec * 1000,
    elevationM: saved.elevationM,
    pausedMs: saved.pausedTotalSec * 1000,
    segmentBreak: true,
    anchor: null,
    lastTs: null,
  }
}
