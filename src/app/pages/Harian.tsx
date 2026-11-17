import { toLocalDate } from '../../domain/ride'
import { HydrationCard } from '../../features/daily/HydrationCard'
import { JournalCard } from '../../features/daily/JournalCard'
import { PageHeader } from '../../ui/PageHeader'

export function Harian() {
  const today = toLocalDate(new Date())
  return (
    <>
      <PageHeader title="Harian" subtitle="Jurnal dan air" />
      <div className="space-y-4">
        <HydrationCard today={today} />
        <JournalCard today={today} />
      </div>
    </>
  )
}
