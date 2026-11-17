import { Component, lazy, Suspense, type ReactNode } from 'react'
import type { TrackMapProps } from './TrackMapInner'

const Inner = lazy(() => import('./TrackMapInner'))

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex h-72 w-full flex-col items-center justify-center rounded-2xl border border-line bg-card">
      <p className="text-sm text-muted">{text}</p>
      <p className="mt-2 text-[11px] text-muted">© OpenStreetMap contributors · OpenFreeMap</p>
    </div>
  )
}

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <Placeholder text="Peta tidak tersedia" /> : this.props.children
  }
}

/** Pembungkus malas: kode peta (±1 MB) baru dimuat saat dibutuhkan, dan galatnya tidak merusak halaman. */
export function TrackMap(props: TrackMapProps) {
  return (
    <MapBoundary>
      <Suspense fallback={<Placeholder text="Memuat peta…" />}>
        <Inner {...props} />
      </Suspense>
    </MapBoundary>
  )
}
