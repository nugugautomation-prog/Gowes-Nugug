import { toLocalDate } from '../../domain/ride'
import { MoodCard } from '../../features/body/MoodCard'
import { ChecklistCard } from '../../features/checklist/ChecklistCard'
import { HydrationCard } from '../../features/daily/HydrationCard'
import { JournalCard } from '../../features/daily/JournalCard'
import { StretchCard } from '../../features/stretch/StretchCard'
import { PageHeader } from '../../ui/PageHeader'
import { useNow } from '../../ui/useNow'

export function Harian() {
  const today = toLocalDate(useNow()) // pergantian hari ikut menyegarkan air, jurnal, dan checklist
  return (
    <>
      <PageHeader title="Harian" subtitle="Air, jurnal, dan rutinitas" />
      <div className="space-y-4">
        <HydrationCard today={today} />
        <ChecklistCard today={today} />
        <JournalCard today={today} />
        <MoodCard today={today} />
        <StretchCard />
      </div>
    </>
  )
}
