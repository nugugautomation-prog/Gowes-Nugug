import { Map as MapLibreMap, LngLatBounds, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'

export type LonLat = [number, number]

export interface TrackMapProps {
  /** Jejak [lon, lat]. */
  track: LonLat[]
  /** Posisi saat ini (layar rekam). */
  current?: LonLat | null
  styleUrl: string
  /** 'follow' = ikuti posisi (rekam); 'fit' = tampilkan seluruh jejak (detail). */
  mode: 'follow' | 'fit'
  /** Berubah tiap jejak bertambah (jejak dimutasi di tempat agar murah). */
  version?: number
}

const TRACK_SRC = 'track'
const POS_SRC = 'pos'
let workerSet = false

function line(track: LonLat[]) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: track },
  }
}
function point(p: LonLat | null | undefined) {
  return {
    type: 'FeatureCollection' as const,
    features: p
      ? [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Point' as const, coordinates: p },
          },
        ]
      : [],
  }
}

/** Peta MapLibre: jejak + posisi. Bila peta gagal, area kosong dan aplikasi tetap jalan (ERR-005, FR-136). */
export default function TrackMapInner({
  track,
  current,
  styleUrl,
  mode,
  version = 0,
}: TrackMapProps) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const readyRef = useRef(false)
  const [failed, setFailed] = useState(false)
  const latest = useRef({ track, current, mode })

  const apply = () => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const { track: t, current: c, mode: m } = latest.current
    ;(map.getSource(TRACK_SRC) as { setData(d: unknown): void } | undefined)?.setData(line(t))
    ;(map.getSource(POS_SRC) as { setData(d: unknown): void } | undefined)?.setData(point(c))
    if (m === 'follow' && c) map.jumpTo({ center: c, zoom: Math.max(map.getZoom(), 15.5) })
    if (m === 'fit' && t.length > 0) {
      const b = t.reduce((acc, p) => acc.extend(p), new LngLatBounds(t[0], t[0]))
      map.fitBounds(b, { padding: 32, maxZoom: 17, duration: 0 })
    }
  }

  useEffect(() => {
    if (!box.current) return
    let map: MapLibreMap
    try {
      if (!workerSet) {
        setWorkerUrl(workerUrl)
        workerSet = true
      }
      const start = latest.current.current ?? latest.current.track[0] ?? [106.8, -6.2]
      map = new MapLibreMap({
        container: box.current,
        style: styleUrl,
        center: start,
        zoom: 15,
        attributionControl: false, // sumber dicantumkan manual di bawah (FR-137)
        interactive: latest.current.mode === 'fit',
      })
    } catch {
      // Perangkat tanpa WebGL: tampilkan area kosong (tidak boleh setState sinkron di efek).
      void Promise.resolve().then(() => setFailed(true))
      return
    }
    mapRef.current = map
    map.on('load', () => {
      map.addSource(TRACK_SRC, { type: 'geojson', data: line(latest.current.track) })
      map.addLayer({
        id: 'track-line',
        type: 'line',
        source: TRACK_SRC,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#e8743b', 'line-width': 5 },
      })
      map.addSource(POS_SRC, { type: 'geojson', data: point(latest.current.current) })
      map.addLayer({
        id: 'pos-dot',
        type: 'circle',
        source: POS_SRC,
        paint: {
          'circle-radius': 8,
          'circle-color': '#2979ff',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      })
      readyRef.current = true
      apply()
    })
    // Gambar peta gagal dimuat (offline/diblokir): rekaman tak terganggu.
    map.on('error', () => setFailed(true))
    return () => {
      readyRef.current = false
      mapRef.current = null
      map.remove()
    }
    // Peta dibuat sekali per gaya.
  }, [styleUrl])

  // Perbarui data terbaru ke ref, lalu gambar ulang setiap render (jejak bisa dimutasi di tempat).
  useEffect(() => {
    latest.current = { track, current, mode }
    apply()
  })
  void version

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-line bg-card">
      <div ref={box} className="absolute inset-0" aria-label="Peta jejak" role="img" />
      {failed ? (
        <p className="absolute inset-x-0 top-2 mx-auto w-fit rounded-lg bg-card px-3 py-1 text-sm text-muted">
          Peta tidak tersedia
        </p>
      ) : null}
      <p className="absolute right-1 bottom-1 rounded bg-card/80 px-1.5 text-[11px] text-muted">
        © OpenStreetMap contributors · OpenFreeMap
      </p>
    </div>
  )
}
