import { EmptyState, PageHeader } from '../../ui/PageHeader'

export function Gowes() {
  return (
    <>
      <PageHeader title="Gowes" subtitle="Riwayat, grafik, dan target" />
      <EmptyState title="Belum ada gowes" hint="Riwayat dan grafik 8 pekan hadir di modul M1–M2." />
    </>
  )
}
