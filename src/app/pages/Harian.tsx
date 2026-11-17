import { EmptyState, PageHeader } from '../../ui/PageHeader'

export function Harian() {
  return (
    <>
      <PageHeader title="Harian" subtitle="Jurnal, air, checklist, mood" />
      <EmptyState
        title="Belum ada catatan hari ini"
        hint="Jurnal, hidrasi, dan checklist hadir di modul M3–M5."
      />
    </>
  )
}
