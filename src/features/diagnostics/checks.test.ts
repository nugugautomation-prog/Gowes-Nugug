import { describe, expect, it } from 'vitest'
import { SAMPLE_GPX, SAMPLE_ICS, checkIndexedDb, checkSecureContext, checkWebGL } from './checks'

describe('uji kelayakan: pemeriksaan tidak melempar galat', () => {
  it('IndexedDB tulis/baca lulus (fake-indexeddb)', async () => {
    expect((await checkIndexedDb()).status).toBe('ok')
  })
  it('WebGL di jsdom = gagal dengan pesan, bukan crash', () => {
    const r = checkWebGL()
    expect(['ok', 'fail']).toContain(r.status)
    expect(r.detail.length).toBeGreaterThan(0)
  })
  it('konteks aman mengembalikan hasil berstatus', () => {
    expect(['ok', 'fail']).toContain(checkSecureContext().status)
  })
})

describe('contoh file uji', () => {
  it('ICS berformat CRLF dan memuat RRULE + VALARM', () => {
    expect(SAMPLE_ICS).toContain('\r\n')
    expect(SAMPLE_ICS).toContain('RRULE:FREQ=WEEKLY')
    expect(SAMPLE_ICS).toContain('BEGIN:VALARM')
    expect(SAMPLE_ICS.startsWith('BEGIN:VCALENDAR')).toBe(true)
  })
  it('GPX berisi 3 titik dan namespace GPX 1.1', () => {
    expect(SAMPLE_GPX).toContain('http://www.topografix.com/GPX/1/1')
    expect(SAMPLE_GPX.match(/<trkpt /g)).toHaveLength(3)
  })
})
