import { useNavigate } from 'react-router-dom'
import { useSetting } from '../../db/useSetting'
import { toLocalDate } from '../../domain/ride'
import { BackupBanner } from '../../features/backup/BackupBanner'
import { UpcomingCard } from '../../features/reminders/UpcomingCard'
import { MonthProgressCard } from '../../features/stats/MonthProgressCard'
import { useRides } from '../../features/rides/rideRepo'
import { Button } from '../../ui/Button'
import { PageHeader } from '../../ui/PageHeader'
import { useNow } from '../../ui/useNow'

/** Beranda: progres bulanan, pengingat terdekat, Mulai Gowes, dan Catat Gowes. */
export function Beranda() {
  const rides = useRides()
  const targetKm = useSetting('monthlyTargetKm')
  const navigate = useNavigate()
  const month = toLocalDate(useNow()).slice(0, 7) // pergantian bulan ikut menyegarkan progres
  return (
    <>
      <PageHeader title="Beranda" subtitle="GowesSehat" />
      <div className="space-y-4">
        <BackupBanner />
        {rides === undefined ? (
          <p className="text-muted" role="status">
            Memuat…
          </p>
        ) : (
          <MonthProgressCard rides={rides} targetKm={targetKm} month={month} />
        )}
        <UpcomingCard />
        <Button large className="w-full" onClick={() => navigate('/rekam')}>
          Mulai Gowes
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate('/gowes', { state: { catat: true } })}
        >
          Catat Gowes
        </Button>
      </div>
    </>
  )
}
