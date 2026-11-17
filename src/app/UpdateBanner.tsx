import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '../ui/Button'

/**
 * Banner "Versi baru". Tidak pernah memuat ulang otomatis (T-6). Saat M10 selesai,
 * banner disembunyikan selama merekam dan baru muncul sesudahnya.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div role="status" className="mb-4 rounded-2xl border border-accent bg-card p-4">
      <p className="font-semibold">Versi baru tersedia</p>
      <p className="text-sm text-muted">Muat ulang untuk memakai versi terbaru.</p>
      <div className="mt-3 flex gap-3">
        <Button className="flex-1" onClick={() => updateServiceWorker(true)}>
          Muat ulang
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setNeedRefresh(false)}>
          Nanti
        </Button>
      </div>
    </div>
  )
}
