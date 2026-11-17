/**
 * Mengurai angka ketikan pengguna. Keyboard desimal Android bisa mengeluarkan `.` atau `,`
 * (tergantung bahasa HP), jadi keduanya diterima (AUDIT B-9 / D-24).
 * Mengembalikan null bila kosong atau bukan angka biasa (huruf, notasi ilmiah, dua pemisah, dst).
 */
export function parseAngka(input: string): number | null {
  const s = input.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Tampilan Indonesia: koma sebagai pemisah desimal. */
export function formatAngka(n: number, desimal = 1): string {
  return n.toFixed(desimal).replace('.', ',')
}
