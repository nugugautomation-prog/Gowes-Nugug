import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** Pilihan satu-ketukan (pengganti dropdown). Status dibaca lewat aria-pressed, bukan warna saja. */
export function Chip({ selected = false, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`min-h-12 rounded-full border px-4 ${
        selected
          ? 'border-accent bg-accent font-semibold text-on-accent'
          : 'border-line bg-card text-text'
      } ${className}`}
      {...rest}
    >
      {selected ? <span aria-hidden="true">✓ </span> : null}
      {children}
    </button>
  )
}
