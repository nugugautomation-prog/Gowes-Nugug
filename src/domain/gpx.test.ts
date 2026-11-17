import { describe, expect, it } from 'vitest'
import type { TrackPoint } from '../db/types'
import { buildGpx, canTrim, escapeXml, pathLengthM, trimTrack } from './gpx'

const M_PER_DEG = 111_194.9
const T0 = Date.UTC(2026, 10, 17, 1, 0, 0)

/** Titik tiap 10 m ke utara sepanjang `meters`. */
function line(meters: number, rideId = 'r'): TrackPoint[] {
  return Array.from({ length: meters / 10 + 1 }, (_, i) => ({
    rideId,
    seq: i,
    ts: T0 + i * 2000,
    lat: -6.2 + (i * 10) / M_PER_DEG,
    lon: 106.8,
    ele: 10 + i * 0.01,
    acc: 5,
    paused: false,
  }))
}

const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml')
const ride = { date: '2026-11-17', startedAt: T0, note: undefined }

describe('escapeXml', () => {
  it('meloloskan & < > " \' dan membuang karakter kontrol', () => {
    expect(escapeXml(`a&b<c>"d"'e'`)).toBe('a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;')
    expect(escapeXml('x\u0000y\u0008z')).toBe('xyz')
  })
  it('emoji dan baris baru dibiarkan', () => {
    expect(escapeXml('🚴\nok')).toBe('🚴\nok')
  })
})

describe('pathLengthM & canTrim (BR-024)', () => {
  it('1000 m ≈ 1000 m; < 400 m tidak bisa dipotong; ≥ 400 m bisa', () => {
    expect(pathLengthM(line(1000))).toBeCloseTo(1000, -1)
    expect(canTrim(line(390))).toBe(false)
    expect(canTrim(line(400))).toBe(true)
    expect(canTrim([])).toBe(false)
  })
})

describe('trimTrack', () => {
  it('membuang titik dalam 200 m dari awal dan akhir', () => {
    const t = trimTrack(line(1000))
    const first = t[0]
    const last = t[t.length - 1]
    expect(first?.seq).toBe(20) // 200 m
    expect(last?.seq).toBe(80) // 800 m
    expect(t).toHaveLength(61)
  })
  it('total < 400 m tidak dipotong', () => {
    const l = line(300)
    expect(trimTrack(l)).toHaveLength(l.length)
  })
  it('tepat 400 m menyisakan satu titik tengah (200 m)', () => {
    expect(trimTrack(line(400))).toHaveLength(1)
  })
  it('kosong tetap kosong', () => {
    expect(trimTrack([])).toEqual([])
  })
})

describe('buildGpx (AC-027)', () => {
  it('menghasilkan XML yang valid dengan semua titik', () => {
    const xml = buildGpx(ride, line(500), { trim: false })
    const doc = parse(xml)
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(doc.documentElement.tagName).toBe('gpx')
    expect(doc.documentElement.getAttribute('version')).toBe('1.1')
    expect(doc.querySelectorAll('trkpt')).toHaveLength(51)
    const first = doc.querySelector('trkpt')
    expect(first?.getAttribute('lat')).toBe('-6.200000')
    expect(first?.querySelector('time')?.textContent).toBe('2026-11-17T01:00:00Z')
    expect(first?.querySelector('ele')).not.toBeNull()
  })

  it('opsi potong aktif: 200 m awal dan akhir tidak ada di file', () => {
    const l = line(1000)
    const doc = parse(buildGpx(ride, l, { trim: true }))
    const pts = [...doc.querySelectorAll('trkpt')]
    expect(pts).toHaveLength(61)
    const lats = pts.map((p) => Number(p.getAttribute('lat')))
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    expect((minLat - -6.2) * M_PER_DEG).toBeGreaterThanOrEqual(199)
    expect((maxLat - -6.2) * M_PER_DEG).toBeLessThanOrEqual(801)
  })

  it('opsi potong pada jejak pendek tidak mengosongkan file', () => {
    const doc = parse(buildGpx(ride, line(300), { trim: true }))
    expect(doc.querySelectorAll('trkpt')).toHaveLength(31)
  })

  it('catatan dan nama bermuatan karakter khusus ter-escape (tidak jadi markup)', () => {
    const xml = buildGpx(
      { ...ride, note: `<img src=x onerror=alert(1)> & "q" 'a' 🚴` },
      line(100),
      { trim: false, name: `A&B <c>` },
    )
    const doc = parse(xml)
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(doc.querySelector('desc')?.textContent).toBe(`<img src=x onerror=alert(1)> & "q" 'a' 🚴`)
    expect(doc.querySelector('trk > name')?.textContent).toBe('A&B <c>')
    expect(doc.querySelector('img')).toBeNull()
    expect(xml).not.toContain('<img')
  })

  it('titik saat jeda dibuang dan jeda memulai segmen baru', () => {
    const l = line(300)
    for (let i = 10; i < 15; i++) (l[i] as TrackPoint).paused = true
    const doc = parse(buildGpx(ride, l, { trim: false }))
    expect(doc.querySelectorAll('trkseg')).toHaveLength(2)
    expect(doc.querySelectorAll('trkpt')).toHaveLength(31 - 5)
  })

  it('urutan titik mengikuti seq walau masukan acak', () => {
    const l = line(100).reverse()
    const doc = parse(buildGpx(ride, l, { trim: false }))
    const times = [...doc.querySelectorAll('trkpt time')].map((t) => t.textContent ?? '')
    expect([...times].sort()).toEqual(times)
  })

  it('tanpa titik: tetap XML valid tanpa NaN', () => {
    const xml = buildGpx(ride, [], { trim: true })
    expect(parse(xml).querySelector('parsererror')).toBeNull()
    expect(xml).not.toMatch(/NaN|undefined/)
  })
})
