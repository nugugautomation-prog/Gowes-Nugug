import { cloneElement, useId, type ReactElement } from 'react'

interface Props {
  label: string
  error?: string
  /** Tepat satu elemen input/textarea; id dan aria-* dipasang otomatis. */
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>
}

/**
 * Label + kolom + pesan galat. Pesan galat sengaja di LUAR <label> supaya tidak ikut menjadi nama
 * kolom bagi pembaca layar; dihubungkan lewat aria-describedby.
 */
export function Field({ label, error, children }: Props) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-muted">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-describedby': error ? errId : undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <span id={errId} role="alert" className="mt-1 block text-sm text-danger">
          {error}
        </span>
      ) : null}
    </div>
  )
}
