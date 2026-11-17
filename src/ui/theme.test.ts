import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../domain/contrast'

// Vitest dijalankan dari akar proyek (import.meta.url bukan URL file di lingkungan jsdom).
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

/** Ambil isi blok { ... } pertama setelah penanda. */
function block(marker: string): Record<string, string> {
  const start = css.indexOf(marker)
  if (start < 0) throw new Error(`Penanda tidak ditemukan: ${marker}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  const out: Record<string, string> = {}
  for (const m of css.slice(open + 1, close).matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[m[1]!] = m[2]!
  }
  return out
}

const dark = block(":root[data-theme='dark']")
const light = block(":root[data-theme='light']")
const system = block(":root[data-theme='system']")

describe.each([
  ['gelap', dark],
  ['terang', light],
] as const)('kontras tema %s', (_name, t) => {
  it('punya semua token', () => {
    for (const k of [
      'bg',
      'card',
      'text',
      'muted',
      'line',
      'accent',
      'on-accent',
      'brand',
      'warn',
      'danger',
    ]) {
      expect(t[k], k).toBeTruthy()
    }
  })
  it('teks utama dan redup >= 4,5:1 di latar dan kartu (AA)', () => {
    for (const surface of [t.bg!, t.card!]) {
      expect(contrastRatio(t.text!, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(t.muted!, surface)).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('teks hijau/peringatan/bahaya >= 4,5:1', () => {
    for (const k of ['brand', 'warn', 'danger']) {
      expect(contrastRatio(t[k]!, t.bg!), k).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(t[k]!, t.card!), k).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('teks di atas tombol neon >= 7:1 (terbaca di terik)', () => {
    expect(contrastRatio(t['on-accent']!, t.accent!)).toBeGreaterThanOrEqual(7)
  })
})

describe('tema', () => {
  it('angka layar rekam (teks di latar gelap) >= 7:1', () => {
    expect(contrastRatio(dark.text!, dark.bg!)).toBeGreaterThanOrEqual(7)
  })
  it("mode 'sistem' (terang) sama persis dengan tema terang", () => {
    expect(system).toEqual(light)
  })
})
