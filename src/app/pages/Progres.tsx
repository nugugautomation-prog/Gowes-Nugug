import { EmptyState, PageHeader } from '../../ui/PageHeader'

export function Progres() {
  return (
    <>
      <PageHeader title="Progres" subtitle="Ringkasan mingguan dan tubuh" />
      <EmptyState
        title="Belum ada data"
        hint="Ringkasan mingguan dan pelacak tubuh hadir di modul M5–M6."
      />
    </>
  )
}
