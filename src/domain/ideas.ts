/**
 * Pilih ide acak yang BERBEDA dari yang sedang tampil (FR-091).
 * `rng` mengembalikan [0,1); disuntik agar bisa diuji. Satu ide saja → tetap itu.
 */
export function pickNext(
  ids: string[],
  currentId: string | null,
  rng: () => number = Math.random,
): string | null {
  if (ids.length === 0) return null
  const pool = ids.filter((id) => id !== currentId)
  if (pool.length === 0) return ids[0] ?? null
  const i = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  return pool[i] ?? null
}

/** Sisa detik dari waktu mulai; tidak pernah negatif, aman terhadap tab yang tertunda. */
export function remainingSeconds(startedAt: number, now: number, totalSec: number): number {
  const elapsed = Math.floor((now - startedAt) / 1000)
  return Math.max(0, totalSec - Math.max(0, elapsed))
}
