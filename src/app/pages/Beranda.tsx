import { EmptyState, PageHeader } from '../../ui/PageHeader'

export function Beranda() {
  return (
    <>
      <PageHeader title="Beranda" subtitle="GowesSehat" />
      <EmptyState
        title="Kerangka aplikasi siap"
        hint="Mulai Gowes, progres bulanan, dan status kesiapan hadir di modul berikutnya."
      />
    </>
  )
}
