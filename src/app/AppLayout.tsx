import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { ActiveRecording } from '../db/types'
import { RecoveryChoices } from '../features/record/RecoveryChoices'
import { discardRecording, getActive } from '../features/record/recorderRepo'
import { Dialog } from '../ui/Dialog'
import { Sheet } from '../ui/Sheet'
import { BottomNav } from './BottomNav'
import { UpdateBanner } from './UpdateBanner'

/** Satu kolom, maks ±480 px dan dipusatkan (Design Brief bagian 7). */
export function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [pending, setPending] = useState<ActiveRecording | undefined>()
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const onRecord = pathname === '/rekam'

  // FR-139: saat aplikasi dibuka dan ada rekaman belum selesai, tawarkan Lanjutkan / Simpan / Buang.
  useEffect(() => {
    let alive = true
    if (pathname !== '/rekam')
      void getActive().then((rec) => {
        if (alive) setPending(rec)
      })
    return () => {
      alive = false
    }
    // Hanya saat aplikasi dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <UpdateBanner />
      <main>
        <Outlet />
      </main>
      {onRecord ? null : <BottomNav />}

      <Sheet
        open={pending !== undefined && !confirmDiscard}
        title="Rekaman belum selesai"
        onClose={() => setPending(undefined)}
      >
        {pending ? (
          <RecoveryChoices
            rec={pending}
            onResume={() => {
              setPending(undefined)
              navigate('/rekam', { state: { resume: true } })
            }}
            onSave={() => {
              setPending(undefined)
              navigate('/rekam', { state: { summary: true } })
            }}
            onDiscard={() => setConfirmDiscard(true)}
          />
        ) : null}
      </Sheet>
      <Dialog
        open={confirmDiscard}
        danger
        title="Buang rekaman?"
        message="Rekaman ini akan dihapus dan tidak bisa dikembalikan."
        confirmLabel="Buang"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={async () => {
          await discardRecording()
          setConfirmDiscard(false)
          setPending(undefined)
        }}
      />
    </div>
  )
}
