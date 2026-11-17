export interface Bar {
  label: string
  value: number
  /** Teks untuk pembaca layar dan tooltip, mis. "18,5 km". */
  valueText: string
}

interface Props {
  bars: Bar[]
  /** Garis target (satuan sama dengan value). Hanya digambar bila diberikan. */
  targetLine?: { value: number; label: string }
  title: string
  emptyText?: string
}

const W = 320
const H = 160
const PAD_TOP = 14
const PAD_BOTTOM = 24

/** Grafik batang SVG sederhana (Design Brief: Grafik batang). Warna batang = aksen; target = garis putus. */
export function BarChart({ bars, targetLine, title, emptyText = 'Belum ada data' }: Props) {
  const max = Math.max(1, ...bars.map((b) => b.value), targetLine?.value ?? 0)
  const empty = bars.every((b) => b.value === 0)
  const plotH = H - PAD_TOP - PAD_BOTTOM
  const slot = W / bars.length
  const barW = Math.min(28, slot * 0.6)
  const y = (v: number) => PAD_TOP + plotH - (v / max) * plotH
  const summary = `${title}: ${bars.map((b) => `${b.label} ${b.valueText}`).join(', ')}${
    targetLine ? `. ${targetLine.label}` : ''
  }`

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={summary}
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={0}
          x2={W}
          y1={PAD_TOP + plotH}
          y2={PAD_TOP + plotH}
          stroke="var(--line)"
          strokeWidth={1}
        />
        {bars.map((b, i) => {
          const h = (b.value / max) * plotH
          const x = i * slot + (slot - barW) / 2
          return (
            <g key={b.label + i}>
              <title>{`${b.label}: ${b.valueText}`}</title>
              <rect
                x={x}
                y={y(b.value)}
                width={barW}
                height={Math.max(h, b.value > 0 ? 2 : 0)}
                rx={4}
                fill="var(--brand)"
              />
              <text
                x={i * slot + slot / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted)"
              >
                {b.label}
              </text>
            </g>
          )
        })}
        {targetLine ? (
          <g>
            <line
              x1={0}
              x2={W}
              y1={y(targetLine.value)}
              y2={y(targetLine.value)}
              stroke="var(--warn)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
          </g>
        ) : null}
      </svg>
      {targetLine ? (
        <figcaption className="mt-1 text-sm text-muted">
          <span aria-hidden="true" className="text-warn">
            ┄┄{' '}
          </span>
          {targetLine.label}
        </figcaption>
      ) : null}
      {empty ? <p className="mt-1 text-sm text-muted">{emptyText}</p> : null}
    </figure>
  )
}
