import { useEffect, useState } from 'react'
import { DISCLAIMER, STRETCHES, STRETCH_SECONDS } from '../../content/content'
import { remainingSeconds } from '../../domain/ideas'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'

const TOTAL = STRETCHES.length * STRETCH_SECONDS // 60 detik

/** Timer peregangan 60 detik dengan panduan gerakan; selesai ditandai teks (FR-050). */
export function StretchCard() {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const left = startedAt === null ? TOTAL : remainingSeconds(startedAt, now, TOTAL)
  const finished = startedAt !== null && left === 0
  const running = startedAt !== null && !finished

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  const elapsed = TOTAL - left
  const step = Math.min(STRETCHES.length - 1, Math.floor(elapsed / STRETCH_SECONDS))
  const current = STRETCHES[step]

  function start() {
    setNow(Date.now())
    setStartedAt(Date.now())
  }

  return (
    <Card>
      <h2 className="font-semibold">Peregangan 60 detik</h2>
      {finished ? (
        <p role="status" className="mt-2 text-lg font-semibold">
          Selesai! Badan terasa lebih ringan ✓
        </p>
      ) : running && current ? (
        <div className="mt-2" aria-live="off">
          <p className="tabular text-5xl font-bold" aria-label={`Sisa ${left} detik`}>
            {left}
          </p>
          <p className="mt-1 font-semibold">
            {step + 1}/{STRETCHES.length} · {current.area}
          </p>
          <p className="text-muted">{current.guide}</p>
        </div>
      ) : (
        <ul className="mt-2 space-y-1 text-muted">
          {STRETCHES.map((s) => (
            <li key={s.id}>
              <span className="text-text">{s.area}</span> · {STRETCH_SECONDS} detik
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        {running ? (
          <Button variant="secondary" onClick={() => setStartedAt(null)}>
            Berhenti
          </Button>
        ) : (
          <Button onClick={start}>{finished ? 'Ulangi' : 'Mulai'}</Button>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{DISCLAIMER}</p>
    </Card>
  )
}
