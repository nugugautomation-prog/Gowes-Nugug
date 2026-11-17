import { READINESS_TEXT, type ReadinessStatus } from '../../domain/readiness'
import { Card } from '../../ui/Card'

const TONE: Record<ReadinessStatus, string> = {
  siap: 'border-brand text-brand',
  santai: 'border-warn text-warn',
  istirahat: 'border-danger text-danger',
  netral: 'border-line text-muted',
}

/** Lencana status kesiapan: selalu ikon + teks, warna hanya pendukung (Design Brief bagian 16). */
export function ReadinessCard({ status }: { status: ReadinessStatus | undefined }) {
  if (status === undefined) {
    return (
      <Card>
        <p className="text-muted" role="status">
          Memuat…
        </p>
      </Card>
    )
  }
  const t = READINESS_TEXT[status]
  return (
    <Card>
      <h2 className="text-sm text-muted">Kesiapan gowes</h2>
      <p
        className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${TONE[status]}`}
      >
        <span aria-hidden="true">{t.icon}</span> {t.label}
      </p>
      <p className="mt-2">{t.sentence}</p>
    </Card>
  )
}
