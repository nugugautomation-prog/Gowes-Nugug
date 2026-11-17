import { useNavigate } from 'react-router-dom'
import { useSetting } from '../../db/useSetting'
import { toLocalDate } from '../../domain/ride'
import { useReadiness } from '../../features/daily/dailyRepo'
import { ReadinessCard } from '../../features/daily/ReadinessCard'
import { MonthProgressCard } from '../../features/stats/MonthProgressCard'
import { useRides } from '../../features/rides/rideRepo'
import { Button } from '../../ui/Button'
import { useNow } from '../../ui/useNow'
import { PageHeader } from '../../ui/PageHeader'

/** Beranda dasar (M2): progres bulanan + Catat Gowes. Mulai Gowes dan kesiapan menyusul (M3, M10). */
export function Beranda() {
  const rides = useRides()
  const targetKm = useSetting('monthlyTargetKm')
  const navigate = useNavigate()
  const now = useNow() // kesiapan ikut berjalan: jam, dan pergantian hari, dihitung ulang tiap menit
  const readiness = useReadiness(toLocalDate(now), now.getHours() + now.getMinutes() / 60)
  return (
    <>
      <PageHeader title="Beranda" subtitle="GowesSehat" />
      <div className="space-y-4">
        <ReadinessCard status={readiness?.status} />
        {rides === undefined ? (
          <p className="text-muted" role="status">
            Memuat…
          </p>
        ) : (
          <MonthProgressCard
            rides={rides}
            targetKm={targetKm}
            month={toLocalDate(new Date()).slice(0, 7)}
          />
        )}
        <Button className="w-full" onClick={() => navigate('/gowes', { state: { catat: true } })}>
          Catat Gowes
        </Button>
      </div>
    </>
  )
}
