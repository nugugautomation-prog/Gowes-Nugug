import { toLocalDate } from '../../domain/ride'
import { MoodCard } from '../../features/body/MoodCard'
import { ChecklistCard } from '../../features/checklist/ChecklistCard'
import { StretchCard } from '../../features/stretch/StretchCard'
import { PageHeader } from '../../ui/PageHeader'
import { useNow } from '../../ui/useNow'

export function Harian() {
  const today = toLocalDate(useNow()) // pergantian hari ikut menyegarkan checklist dan mood
  return (
    <>
      <PageHeader title="Harian" subtitle="Rutinitas, mood, dan peregangan" />
      <div className="space-y-4">
        <ChecklistCard today={today} />
        <MoodCard today={today} />
        <StretchCard />
      </div>
    </>
  )
}
