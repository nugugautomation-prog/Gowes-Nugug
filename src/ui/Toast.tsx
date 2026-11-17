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

interface ToastApi {
  show: (message: string) => void
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
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback(
    (m: string) => {
      setMessage(m)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setMessage(null), durationMs)
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
        {message ? (
          <div className="rounded-xl border border-line bg-card px-4 py-3 text-text shadow-lg">
            {message}
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
