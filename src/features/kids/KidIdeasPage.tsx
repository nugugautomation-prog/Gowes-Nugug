import { useState } from 'react'
import { DISCLAIMER, KID_IDEAS } from '../../content/content'
import { pickNext } from '../../domain/ideas'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { PageHeader } from '../../ui/PageHeader'
import { setKidDone, useKidDone } from './kidRepo'

/** Ide bareng anak 5 tahun: katalog dengan ceklis tersimpan + "Ide Baru" acak (F-10). */
export function KidIdeasPage({ rng }: { rng?: () => number }) {
  const done = useKidDone()
  const [currentId, setCurrentId] = useState<string>(() => KID_IDEAS[0]?.id ?? '')
  const current = KID_IDEAS.find((i) => i.id === currentId)

  return (
    <>
      <PageHeader title="Ide bareng anak" subtitle="Aktivitas seru untuk anak 5 tahun" />
      <div className="space-y-4">
        {current ? (
          <Card>
            <p className="text-sm text-muted">Ide untuk hari ini</p>
            <h2 className="text-lg font-semibold">{current.title}</h2>
            <p className="mt-1">{current.tip}</p>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() =>
                setCurrentId(
                  pickNext(
                    KID_IDEAS.map((i) => i.id),
                    currentId,
                    rng,
                  ) ?? currentId,
                )
              }
            >
              Ide Baru
            </Button>
          </Card>
        ) : null}

        <Card>
          <h2 className="mb-2 font-semibold">Katalog ({done?.size ?? 0} sudah dicoba)</h2>
          <ul className="divide-y divide-line">
            {KID_IDEAS.map((i) => {
              const checked = done?.has(i.id) ?? false
              return (
                <li key={i.id}>
                  <label className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
                    <input
                      type="checkbox"
                      className="mt-1 size-5"
                      checked={checked}
                      disabled={done === undefined}
                      onChange={() => void setKidDone(i.id, !checked)}
                    />
                    <span>
                      <span className="font-medium">{i.title}</span>
                      <span className="block text-sm text-muted">{i.tip}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </Card>
        <p className="text-center text-sm text-muted">{DISCLAIMER}</p>
      </div>
    </>
  )
}
