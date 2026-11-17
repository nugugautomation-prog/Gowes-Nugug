import type { ReactNode } from 'react'

interface Props {
  value: ReactNode
  label: string
  unit?: string
  /** Ukuran angka: 'md' 28 px, 'lg' 48 px, 'xl' 80 px (Layar Rekam). */
  size?: 'md' | 'lg' | 'xl'
}

const sizes = { md: 'text-[28px]', lg: 'text-5xl', xl: 'text-[80px] leading-none' }

/** Angka dulu, penjelasan kemudian (Design Brief bagian 6). */
export function Stat({ value, label, unit, size = 'md' }: Props) {
  return (
    <div>
      <div className={`tabular font-bold ${sizes[size]}`}>
        {value}
        {unit ? <span className="ml-1 text-base font-normal text-muted">{unit}</span> : null}
      </div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}
