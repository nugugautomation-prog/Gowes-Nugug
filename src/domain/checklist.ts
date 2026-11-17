export const MAX_CHECKLIST_TITLE = 60

/** Isi awal yang bisa dihapus (FR-071, OQ-P7 disetujui). */
export const DEFAULT_CHECKLIST = ['Minum air pagi', 'Peregangan', 'Jurnal malam'] as const

/** VAL-007: judul 1–60 karakter setelah dipangkas. Mengembalikan judul bersih atau pesan galat. */
export function validateChecklistTitle(
  raw: string,
): { ok: true; title: string } | { ok: false; error: string } {
  const title = raw.trim()
  if (title.length === 0) return { ok: false, error: 'Tulis nama rutinitas dulu' }
  if (title.length > MAX_CHECKLIST_TITLE)
    return { ok: false, error: `Maksimal ${MAX_CHECKLIST_TITLE} karakter` }
  return { ok: true, title }
}
