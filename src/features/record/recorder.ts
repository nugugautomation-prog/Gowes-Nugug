import { db as defaultDb, type GowesDB } from '../../db/database'
import {
  initialState,
  processFix,
  restoreState,
  setManualPause,
  statsOf,
  type EngineState,
  type Stats,
} from '../../domain/gps'
import { activePoints, getActive, saveProgress, startRecording } from './recorderRepo'

/** Bagian API Geolocation yang dipakai (dapat diganti saat uji). */
export interface GeoLike {
  watchPosition(
    ok: (p: GeolocationPosition) => void,
    err: (e: GeolocationPositionError) => void,
    opts?: PositionOptions,
  ): number
  clearWatch(id: number): void
}

export interface WakeLockLike {
  request(type: 'screen'): Promise<{ release(): Promise<void>; released?: boolean }>
}

export type Phase =
  | 'idle'
  | 'mencari' // menunggu titik GPS valid pertama (ERR-002)
  | 'merekam'
  | 'jeda'
  | 'ditolak' // izin lokasi ditolak (ERR-001)
  | 'galat'

export interface RecorderView {
  phase: Phase
  stats: Stats
  /** Kecepatan saat ini (km/jam); 0 saat jeda. */
  speedKmh: number
  startedAt: number | null
  /** Waktu titik valid terakhir (untuk indikator sinyal hilang, ERR-003). */
  lastFixAt: number | null
  autoPaused: boolean
  manualPaused: boolean
  wakeLock: 'tidak-diminta' | 'aktif' | 'gagal'
  error: string | null
}

export interface RecorderDeps {
  geo?: GeoLike | null
  wakeLock?: WakeLockLike | null
  db?: GowesDB
  now?: () => number
}

const GEO_OPTS: PositionOptions = { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 }

/** Pengendali rekaman: GPS → mesin → penyimpanan berkala. Satu instance per sesi rekam. */
export class Recorder {
  private engine: EngineState = initialState()
  private watchId: number | null = null
  private sentinel: { release(): Promise<void>; released?: boolean } | null = null
  private queue: Promise<void> = Promise.resolve()
  private listeners = new Set<() => void>()
  private view: RecorderView
  private readonly geo: GeoLike | null
  private readonly wake: WakeLockLike | null
  private readonly db: GowesDB
  private readonly now: () => number

  constructor(deps: RecorderDeps = {}) {
    this.geo =
      deps.geo === undefined
        ? typeof navigator !== 'undefined'
          ? (navigator.geolocation ?? null)
          : null
        : deps.geo
    this.wake =
      deps.wakeLock === undefined
        ? typeof navigator !== 'undefined' && 'wakeLock' in navigator
          ? navigator.wakeLock
          : null
        : deps.wakeLock
    this.db = deps.db ?? defaultDb
    this.now = deps.now ?? Date.now
    this.view = {
      phase: 'idle',
      stats: statsOf(this.engine),
      speedKmh: 0,
      startedAt: null,
      lastFixAt: null,
      autoPaused: false,
      manualPaused: false,
      wakeLock: 'tidak-diminta',
      error: null,
    }
  }

  getView = (): RecorderView => this.view

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private set(patch: Partial<RecorderView>) {
    this.view = { ...this.view, ...patch }
    this.listeners.forEach((l) => l())
  }

  /** Mulai rekaman baru, atau lanjutkan yang terputus (`resume`). */
  async start(resume = false): Promise<void> {
    if (!this.geo) {
      this.set({ phase: 'galat', error: 'Perangkat ini tidak mendukung GPS.' })
      return
    }
    try {
      if (resume) {
        const rec = await getActive(this.db)
        if (!rec) throw new Error('Rekaman tidak ditemukan')
        const gapSec = Math.max(0, Math.round((this.now() - rec.lastPointTs) / 1000))
        this.engine = restoreState({
          distanceKm: rec.distanceKm,
          movingSec: rec.movingSec,
          elevationM: rec.elevationM,
          pausedTotalSec: rec.pausedTotalSec + gapSec, // celah dihitung jeda (WF-01)
        })
        this.engine.maxKmh = rec.maxSpeedKmh ?? 0
        this.set({ startedAt: rec.startedAt, stats: statsOf(this.engine) })
      } else {
        const rec = await startRecording(this.db, this.now())
        this.engine = initialState()
        this.set({ startedAt: rec.startedAt, stats: statsOf(this.engine) })
      }
    } catch (e) {
      this.set({ phase: 'galat', error: e instanceof Error ? e.message : 'Gagal memulai rekaman' })
      return
    }
    this.set({ phase: 'mencari', error: null })
    void this.acquireWakeLock()
    this.watch()
  }

  private watch() {
    if (!this.geo || this.watchId !== null) return
    this.watchId = this.geo.watchPosition(
      (p) => this.onPosition(p),
      (e) => this.onError(e),
      GEO_OPTS,
    )
  }

  private unwatch() {
    if (this.geo && this.watchId !== null) this.geo.clearWatch(this.watchId)
    this.watchId = null
  }

  private onError(e: GeolocationPositionError) {
    if (e.code === 1) {
      this.unwatch()
      this.set({ phase: 'ditolak', error: 'Izin lokasi ditolak.' })
    }
    // code 2/3 (posisi tak tersedia / timeout): biarkan menunggu; indikator sinyal di UI.
  }

  private onPosition(p: GeolocationPosition) {
    if (this.view.phase === 'idle' || this.view.phase === 'ditolak' || this.view.phase === 'galat')
      return
    const c = p.coords
    const r = processFix(this.engine, {
      ts: p.timestamp,
      lat: c.latitude,
      lon: c.longitude,
      ele: c.altitude,
      acc: c.accuracy,
      speed: c.speed,
    })
    this.engine = r.state
    if (!r.accepted) return
    const phase: Phase = this.engine.status === 'jeda' ? 'jeda' : 'merekam'
    this.set({
      phase,
      stats: statsOf(this.engine),
      speedKmh: this.engine.status === 'jeda' ? 0 : this.engine.kmh,
      lastFixAt: p.timestamp,
      autoPaused: this.engine.status === 'jeda' && !this.engine.manualPause,
      manualPaused: this.engine.manualPause,
    })
    if (r.store) this.persist(r.store, p.timestamp)
  }

  private persist(point: Parameters<typeof saveProgress>[0]['point'], ts: number) {
    const snapshot = { ...this.engine }
    const stats = statsOf(snapshot)
    this.queue = this.queue
      .then(() =>
        saveProgress(
          {
            state: snapshot.status,
            pausedTotalSec: snapshot.pausedMs / 1000,
            stats,
            point,
            lastPointTs: ts,
          },
          this.db,
        ),
      )
      .catch(() => {
        this.set({ error: 'Gagal menyimpan titik. Penyimpanan HP mungkin penuh.' })
      })
  }

  togglePause() {
    if (this.view.phase !== 'merekam' && this.view.phase !== 'jeda') return
    this.engine = setManualPause(this.engine, !this.engine.manualPause)
    this.set({
      phase: this.engine.status === 'jeda' ? 'jeda' : 'merekam',
      manualPaused: this.engine.manualPause,
      autoPaused: false,
      speedKmh: 0,
    })
    this.persist(null, this.engine.lastTs ?? this.now())
  }

  /** Hentikan GPS dan simpan angka terakhir. Mengembalikan statistik akhir. */
  async stop(): Promise<Stats> {
    this.unwatch()
    await this.releaseWakeLock()
    const stats = statsOf(this.engine)
    this.persist(null, this.engine.lastTs ?? this.now())
    await this.queue
    this.set({ phase: 'idle', stats })
    return stats
  }

  /** Lepas sumber daya tanpa menyentuh data (mis. saat meninggalkan layar). */
  async dispose(): Promise<void> {
    this.unwatch()
    await this.releaseWakeLock()
    await this.queue
  }

  // --- Wake Lock (PER-002, ERR-007) ---
  async acquireWakeLock(): Promise<void> {
    if (!this.wake) return this.set({ wakeLock: 'gagal' })
    try {
      this.sentinel = await this.wake.request('screen')
      this.set({ wakeLock: 'aktif' })
    } catch {
      this.set({ wakeLock: 'gagal' })
    }
  }

  private async releaseWakeLock() {
    try {
      await this.sentinel?.release()
    } catch {
      /* diabaikan */
    }
    this.sentinel = null
  }

  /** Layar kembali aktif: minta Wake Lock lagi dan pastikan pemantauan GPS berjalan. */
  async onVisible(): Promise<void> {
    const p = this.view.phase
    if (p !== 'mencari' && p !== 'merekam' && p !== 'jeda') return
    if (!this.sentinel || this.sentinel.released) await this.acquireWakeLock()
    this.watch()
  }

  /** Tunggu penulisan ke penyimpanan selesai. */
  flush(): Promise<void> {
    return this.queue
  }

  /** Titik-titik tersimpan (untuk ringkasan/peta). */
  points() {
    return activePoints(this.db)
  }
}
