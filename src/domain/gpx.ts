import type { Ride, TrackPoint } from '../db/types'
import { haversineM } from './gps'

export const TRIM_M = 200

/** Buang karakter yang dilarang XML 1.0 (kontrol selain tab/baris baru, serta U+FFFE/U+FFFF). */
function stripInvalidXml(s: string): string {
  let out = ''
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0
    if ((c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) || c === 0xfffe || c === 0xffff)
      continue
    out += ch
  }
  return out
}

/** Escape teks untuk XML (& < > " ') dan buang karakter yang dilarang XML 1.0. */
export function escapeXml(s: string): string {
  return stripInvalidXml(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Panjang lintasan (m) dari deretan titik. Titik jeda tetap dihitung bila berurutan. */
export function pathLengthM(points: { lat: number; lon: number }[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    if (a && b) total += haversineM(a, b)
  }
  return total
}

/** BR-024: opsi potong 200 m hanya bila total lintasan ≥ 400 m (selain itu tidak ada yang tersisa). */
export function canTrim(points: { lat: number; lon: number }[]): boolean {
  return pathLengthM(points) >= 2 * TRIM_M
}

/**
 * BR-024: buang titik dalam 200 m **jarak lintasan** dari awal dan dari akhir.
 * Titik tepat di 200 m dipertahankan. Bila total < 400 m, tidak memotong (opsi dinonaktifkan di UI).
 */
export function trimTrack<T extends { lat: number; lon: number }>(
  points: T[],
  trimM = TRIM_M,
): T[] {
  if (points.length === 0 || pathLengthM(points) < 2 * trimM) return points
  const cum: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as T
    const b = points[i] as T
    cum.push((cum[i - 1] as number) + haversineM(a, b))
  }
  const total = cum[cum.length - 1] as number
  return points.filter((_, i) => (cum[i] as number) >= trimM && (cum[i] as number) <= total - trimM)
}

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')
const fix = (n: number, d: number) => n.toFixed(d)

export interface GpxOptions {
  trim: boolean
  /** Nama jejak; teks pengguna di-escape. */
  name?: string
}

/**
 * GPX 1.1 satu jejak. Titik jeda manual/otomatis diberi segmen baru agar jarak tidak melompat di Strava.
 * Jejak GPS tidak pernah dikirim ke server mana pun (FR-147); ini hanya membuat teks file.
 */
export function buildGpx(
  ride: Pick<Ride, 'date' | 'startedAt' | 'note'>,
  points: TrackPoint[],
  opts: GpxOptions,
): string {
  const ordered = [...points].sort((a, b) => a.seq - b.seq)
  const used = opts.trim ? trimTrack(ordered) : ordered
  const name = escapeXml(opts.name ?? `Gowes ${ride.date}`)
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="GowesSehat" xmlns="http://www.topografix.com/GPX/1/1">',
  ]
  const startedAt = ride.startedAt
  lines.push(
    '  <metadata>',
    `    <name>${name}</name>`,
    ...(startedAt ? [`    <time>${iso(startedAt)}</time>`] : []),
    '  </metadata>',
    '  <trk>',
    `    <name>${name}</name>`,
    ...(ride.note ? [`    <desc>${escapeXml(ride.note)}</desc>`] : []),
  )
  let open = false
  const close = () => {
    if (open) lines.push('    </trkseg>')
    open = false
  }
  let prevPaused = false
  for (const p of used) {
    // Mulai segmen baru setelah masa jeda, agar jeda tidak menjadi garis lurus.
    if (!open || (prevPaused && !p.paused)) {
      close()
      lines.push('    <trkseg>')
      open = true
    }
    prevPaused = p.paused
    if (p.paused) continue // titik saat jeda tidak ikut
    lines.push(
      `      <trkpt lat="${fix(p.lat, 6)}" lon="${fix(p.lon, 6)}">` +
        (p.ele === undefined ? '' : `<ele>${fix(p.ele, 1)}</ele>`) +
        `<time>${iso(p.ts)}</time></trkpt>`,
    )
  }
  close()
  lines.push('  </trk>', '</gpx>', '')
  return lines.join('\n')
}
