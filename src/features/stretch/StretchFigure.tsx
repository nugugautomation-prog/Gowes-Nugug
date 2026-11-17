import type { FigureId } from '../../content/content'

/**
 * Ilustrasi figur sederhana tiap gerakan (SVG). Bagian yang diregangkan diberi warna aksen.
 * `side="kiri"` mencerminkan gambar. Tampilan dari depan; panah menunjukkan arah gerak.
 */
export function StretchFigure({
  id,
  side,
  className = 'h-40 w-32',
}: {
  id: FigureId
  side?: 'kanan' | 'kiri'
  className?: string
}) {
  const body = {
    stroke: 'currentColor',
    strokeWidth: 4,
    fill: 'none',
    strokeLinecap: 'round',
  } as const
  const hot = {
    stroke: 'var(--brand)',
    strokeWidth: 5,
    fill: 'none',
    strokeLinecap: 'round',
  } as const
  // Gambar dibuat untuk sisi kanan; sisi kiri dicerminkan.
  const mirror = side === 'kiri' ? 'translate(120 0) scale(-1 1)' : undefined

  return (
    <svg
      viewBox="0 0 120 160"
      className={className}
      role="img"
      aria-label={`Ilustrasi peregangan ${id}`}
    >
      <g transform={mirror}>
        {id === 'leher' ? (
          <>
            {/* kepala miring ke kanan */}
            <circle cx="70" cy="26" r="11" {...body} />
            <path d="M64 37 L60 46" {...hot} />
            <path d="M60 46 L60 96 M60 50 L38 62 M60 50 L82 62" {...body} />
            <path d="M60 96 L48 150 M60 96 L72 150" {...body} />
            <path d="M46 14 Q62 2 80 12" {...hot} />
            <path d="M76 8 L82 13 L74 16" {...hot} />
          </>
        ) : null}
        {id === 'bahu' ? (
          <>
            <circle cx="60" cy="24" r="11" {...body} />
            <path d="M60 35 L60 96" {...body} />
            <path d="M38 50 L82 50" {...hot} />
            <path d="M38 50 L32 90 M82 50 L88 90" {...body} />
            <path d="M60 96 L48 150 M60 96 L72 150" {...body} />
            <path d="M24 44 Q18 34 28 30" {...hot} />
            <path d="M96 44 Q102 34 92 30" {...hot} />
            <path d="M25 26 L30 30 L24 34 M95 26 L90 30 L96 34" {...hot} />
          </>
        ) : null}
        {id === 'pergelangan' ? (
          <>
            <circle cx="50" cy="24" r="11" {...body} />
            <path d="M50 35 L50 96 M50 96 L40 150 M50 96 L62 150" {...body} />
            {/* lengan kanan lurus ke depan, telapak dibengkokkan oleh tangan lain */}
            <path d="M50 52 L96 52" {...body} />
            <path d="M96 52 L106 40" {...hot} />
            <path d="M50 56 L84 70 L104 46" {...body} />
            <path d="M100 30 L108 36 L98 40" {...hot} />
          </>
        ) : null}
        {id === 'paha' ? (
          <>
            {/* tampak samping menghadap kanan: badan tegak, kaki tumpu lurus */}
            <circle cx="62" cy="22" r="11" {...body} />
            <path d="M62 33 L62 88" {...body} />
            <path d="M62 88 L66 150" {...body} />
            {/* paha turun, betis ditekuk ke belakang dan ditarik tangan */}
            <path d="M62 88 L68 120" {...hot} />
            <path d="M68 120 L36 104" {...hot} />
            {/* lengan meraih pergelangan kaki di belakang */}
            <path d="M62 48 L42 74 L36 102" {...body} />
            {/* panah tarik ke atas */}
            <path d="M26 112 L26 94 M21 100 L26 93 L31 100" {...hot} />
          </>
        ) : null}
      </g>
    </svg>
  )
}
