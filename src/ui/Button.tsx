import type { ComponentProps } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent font-semibold',
  secondary: 'border border-line bg-card text-text',
  danger: 'border border-danger bg-card text-danger font-semibold',
}

interface Props extends ComponentProps<'button'> {
  variant?: Variant
  /** Tombol besar (Layar Rekam memakai min 72 px). */
  large?: boolean
}

export function Button({
  variant = 'primary',
  large = false,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`rounded-xl px-5 transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${
        large ? 'min-h-[72px] text-xl' : 'min-h-12'
      } ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
