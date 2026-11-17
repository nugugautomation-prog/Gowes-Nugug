import { DISCLAIMER, PILLARS } from '../../content/content'
import { Card } from '../../ui/Card'
import { PageHeader } from '../../ui/PageHeader'

/** Panduan nutrisi 4 pilar (F-11). Konten statis; lihat aturan BR-003/BR-004. */
export function NutritionPage() {
  return (
    <>
      <PageHeader title="Panduan nutrisi" subtitle="Empat pilar untuk pesepeda" />
      <div className="space-y-4">
        {PILLARS.map((p) => (
          <Card key={p.id}>
            <h2 className="font-semibold">{p.title}</h2>
            <p className="mt-1">{p.body}</p>
            <p className="mt-1 text-sm text-muted">Contoh: {p.examples}</p>
          </Card>
        ))}
        <p className="text-center text-sm text-muted">{DISCLAIMER}</p>
      </div>
    </>
  )
}
