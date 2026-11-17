import { describe, expect, it } from 'vitest'
import { contrastRatio, luminance } from './contrast'

describe('contrastRatio', () => {
  it('hitam vs putih = 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })
  it('simetris dan 1 untuk warna sama', () => {
    expect(contrastRatio('#39ff14', '#0c100d')).toBeCloseTo(contrastRatio('#0c100d', '#39ff14'), 6)
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 6)
  })
  it('neon di atas putih gagal AA (alasan neon tidak jadi teks di tema terang)', () => {
    expect(contrastRatio('#39ff14', '#ffffff')).toBeLessThan(4.5)
  })
  it('menolak warna tidak valid', () => {
    expect(() => luminance('hijau')).toThrow()
  })
})
