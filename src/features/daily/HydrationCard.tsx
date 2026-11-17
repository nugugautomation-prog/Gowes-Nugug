import { WATER_TARGET_ML } from '../../domain/readiness'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { changeWater, useWater } from './dailyRepo'

const fmt = (ml: number) => ml.toLocaleString('id-ID')

/** Air hari ini: +250, +500, dan koreksi (FR-040). Tanpa konfirmasi; bisa dikoreksi. */
export function HydrationCard({ today }: { today: string }) {
  const ml = useWater(today)
  const value = ml ?? 0
  const pct = Math.min(100, (value * 100) / WATER_TARGET_ML)

  return (
    <Card>
      <h2 className="font-semibold">Air hari ini</h2>
      <p className="tabular mt-1 text-2xl font-bold">
        {fmt(value)}{' '}
        <span className="text-base font-normal text-muted">dari {fmt(WATER_TARGET_ML)} ml</span>
      </p>
      <div
        role="progressbar"
        aria-label="Air hari ini"
        aria-valuemin={0}
        aria-valuemax={WATER_TARGET_ML}
        aria-valuenow={Math.min(value, WATER_TARGET_ML)}
        aria-valuetext={`${fmt(value)} dari ${fmt(WATER_TARGET_ML)} mililiter`}
        className="mt-2 h-3 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={() => void changeWater(today, 250)}>
          +250
        </Button>
        <Button className="flex-1" onClick={() => void changeWater(today, 500)}>
          +500
        </Button>
        <Button
          variant="secondary"
          aria-label="Koreksi, kurangi 250 ml"
          disabled={value <= 0}
          onClick={() => void changeWater(today, -250)}
        >
          −250
        </Button>
      </div>
    </Card>
  )
}
