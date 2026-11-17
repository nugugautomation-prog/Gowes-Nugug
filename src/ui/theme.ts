// Preferensi tema: localStorage hanya untuk preferensi kecil ini (SYSTEM-DESIGN bagian 14).
export type ThemePref = 'dark' | 'light' | 'system'

export const THEME_KEY = 'gowessehat.theme'
export const DEFAULT_THEME: ThemePref = 'dark' // D-16: gelap bawaan

export function isThemePref(v: unknown): v is ThemePref {
  return v === 'dark' || v === 'light' || v === 'system'
}

export function readTheme(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return isThemePref(v) ? v : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function applyTheme(pref: ThemePref): void {
  document.documentElement.dataset.theme = pref
}

export function saveTheme(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_KEY, pref)
  } catch {
    // penyimpanan diblokir: tema tetap berlaku untuk sesi ini
  }
  applyTheme(pref)
}
