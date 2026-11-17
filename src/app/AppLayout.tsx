import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { UpdateBanner } from './UpdateBanner'

/** Satu kolom, maks ±480 px dan dipusatkan (Design Brief bagian 7). */
export function AppLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <UpdateBanner />
      <main>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
