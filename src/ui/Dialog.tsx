import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'

interface Props {
  open: boolean
  title: string
  message: string
  /** Nama aksi yang jelas (mis. "Hapus"), bukan "Ya". */
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Dialog konfirmasi (Design Brief bagian 18). Fokus awal di tombol Batal agar aman. */
export function Dialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId()
  const msgId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={msgId}
        className="relative w-full max-w-[400px] rounded-2xl border border-line bg-card p-5"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p id={msgId} className="mt-2 text-muted">
          {message}
        </p>
        <div className="mt-5 flex gap-3">
          <Button ref={cancelRef} variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
