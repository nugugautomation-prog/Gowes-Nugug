// Hitungan timer yang tahan terhadap tab yang tertunda.

/** Sisa detik dari waktu mulai; tidak pernah negatif, aman terhadap tab yang tertunda. */
export function remainingSeconds(startedAt: number, now: number, totalSec: number): number {
  const elapsed = Math.floor((now - startedAt) / 1000)
  return Math.max(0, totalSec - Math.max(0, elapsed))
}
