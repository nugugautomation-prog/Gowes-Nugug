import { BodyCard } from '../../features/body/BodyCard'
import { BalanceCard } from '../../features/summary/BalanceCard'
import { WeeklySummaryCard } from '../../features/summary/WeeklySummaryCard'
import { PageHeader } from '../../ui/PageHeader'

export function Progres() {
  return (
    <>
      <PageHeader title="Progres" subtitle="Ringkasan pekan, tubuh, dan mood" />
      <div className="space-y-4">
        <WeeklySummaryCard />
        <BalanceCard />
        <BodyCard />
      </div>
    </>
  )
}
