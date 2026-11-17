import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastApi {
  /** `action` = tombol di dalam toast (mis. Urungkan); toast dengan aksi tampil lebih lama. */
  show: (message: string, action?: ToastAction) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Umpan balik ringan yang tidak memblokir (Design Brief bagian 17). */
export function ToastProvider({
  children,
  durationMs = 3000,
}: {
  children: ReactNode
  durationMs?: number
}) {
  const [toast, setToast] = useState<{ message: string; action?: ToastAction } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback(
    (m: string, action?: ToastAction) => {
      setToast({ message: m, action })
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setToast(null), action ? durationMs * 2 : durationMs)
    },
    [durationMs],
  )
  useEffect(() => () => clearTimeout(timer.current), [])
  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
      >
        {toast ? (
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-text shadow-lg">
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="min-h-12 px-2 font-semibold text-brand"
                onClick={() => {
                  toast.action?.onClick()
                  setToast(null)
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus di dalam ToastProvider')
  return ctx
}
