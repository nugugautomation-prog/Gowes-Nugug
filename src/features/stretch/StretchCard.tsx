import { useEffect, useState } from 'react'
import { DISCLAIMER, STRETCHES, STRETCH_INTRO, STRETCH_SECONDS } from '../../content/content'
import { remainingSeconds } from '../../domain/timer'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { StretchFigure } from './StretchFigure'

const TOTAL = STRETCHES.length * STRETCH_SECONDS

function duration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m} mnt${s ? ` ${s} dtk` : ''}` : `${s} dtk`
}

/** Peregangan terpandu: tiap gerakan punya gambar, langkah, sisi, dan waktu (FR-050 direvisi, D-26). */
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
  const leftInStep = STRETCH_SECONDS - (elapsed - step * STRETCH_SECONDS)

  function start() {
    const t = Date.now()
    setNow(t)
    setStartedAt(t)
  }

  /** Loncat ke gerakan berikutnya dengan menggeser waktu mulai. */
  function skip() {
    setStartedAt((s) => (s === null ? s : s - leftInStep * 1000))
    setNow(Date.now())
  }

  return (
    <Card>
      <h2 className="font-semibold">Peregangan</h2>

      {finished ? (
        <p role="status" className="mt-2 text-lg font-semibold">
          Selesai! Badan terasa lebih ringan ✓
        </p>
      ) : running && current ? (
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-bg p-2 text-text">
              <StretchFigure id={current.figure} side={current.side} />
            </div>
            <div>
              <p className="tabular text-5xl font-bold" aria-label={`Sisa ${leftInStep} detik`}>
                {leftInStep}
              </p>
              <p className="text-sm text-muted">
                detik · gerakan {step + 1}/{STRETCHES.length}
              </p>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {current.area}
              {current.side ? ` · sisi ${current.side}` : ''}
            </p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              {current.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-muted">{current.tip}</p>
          </div>
        </div>
      ) : (
        <div className="mt-1 space-y-3">
          <p className="text-muted">{STRETCH_INTRO}</p>
          <ul className="divide-y divide-line">
            {STRETCHES.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2">
                <div className="shrink-0 rounded-lg bg-bg p-1 text-text">
                  <StretchFigure id={s.figure} side={s.side} className="h-14 w-11" />
                </div>
                <div>
                  <p className="font-medium">
                    {s.area}
                    {s.side ? ` · sisi ${s.side}` : ''}
                  </p>
                  <p className="text-sm text-muted">{STRETCH_SECONDS} detik</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            {STRETCHES.length} gerakan · total {duration(TOTAL)}
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {running ? (
          <>
            <Button variant="secondary" onClick={() => setStartedAt(null)}>
              Berhenti
            </Button>
            <Button variant="secondary" onClick={skip}>
              Lewati
            </Button>
          </>
        ) : (
          <Button onClick={start}>{finished ? 'Ulangi' : 'Mulai'}</Button>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{DISCLAIMER}</p>
    </Card>
  )
}
