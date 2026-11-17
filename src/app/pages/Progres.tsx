import { BodyCard } from '../../features/body/BodyCard'
import { PageHeader } from '../../ui/PageHeader'

export function Progres() {
  return (
    <>
      <PageHeader title="Progres" subtitle="Tubuh dan mood" />
      <div className="space-y-4">
        <BodyCard />
      </div>
    </>
  )
}
