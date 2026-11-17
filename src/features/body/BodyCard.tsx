import { useState } from 'react'
import { db } from '../../db/database'
import { setSetting } from '../../db/settings'
import type { BodyLog } from '../../db/types'
import { useSetting } from '../../db/useSetting'
import { formatAngka, parseAngka } from '../../domain/angka'
import {
  gapToTarget,
  latestWeightLog,
  shouldSuggestWeighing,
  validateIdealWeight,
} from '../../domain/body'
import { CONDITION_EMOJI, toLocalDate } from '../../domain/ride'
import { formatTanggal } from '../rides/RideList'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Dialog } from '../../ui/Dialog'
import { EmptyState } from '../../ui/PageHeader'
import { useNow } from '../../ui/useNow'
import { useToast } from '../../ui/Toast'
import { BodyForm } from './BodyForm'
import { deleteBodyLog, useBodyLogs } from './bodyRepo'

function gapText(state: 'tepat' | 'di_atas' | 'di_bawah', kg: number): string {
  if (state === 'tepat') return 'Tepat di target berat idealmu'
  return `${formatAngka(kg)} kg ${state === 'di_atas' ? 'di atas' : 'di bawah'} target`
}

/** Tubuh & mood (Progres): ringkasan, target berat ideal, catat, dan riwayat yang bisa diubah/dihapus. */
export function BodyCard() {
  const toast = useToast()
  const logs = useBodyLogs()
  const ideal = useSetting('idealWeightKg')
  const today = toLocalDate(useNow())
  const [sheet, setSheet] = useState<{ log?: BodyLog } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<BodyLog | undefined>()
  const [idealText, setIdealText] = useState('')
  const [idealError, setIdealError] = useState<string | null>(null)

  if (logs === undefined)
    return (
      <Card>
        <p className="text-muted" role="status">
          Memuat…
        </p>
      </Card>
    )

  const latestW = latestWeightLog(logs)
  const latestWaist = logs.find((l) => l.waistCm !== undefined)

  async function saveIdeal(ev: React.FormEvent) {
    ev.preventDefault()
    const kg = idealText.trim() === '' ? null : parseAngka(idealText)
    const msg = validateIdealWeight(kg)
    setIdealError(msg)
    if (msg || kg === null) return
    await setSetting(db, 'idealWeightKg', Math.round(kg * 10) / 10)
    setIdealText('')
    toast.show('Target berat tersimpan ✓')
  }

  return (
    <>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold">Tubuh &amp; mood</h2>
          <Button onClick={() => setSheet({})}>Catat</Button>
        </div>

        {latestW?.weightKg !== undefined ? (
          <div className="mt-2">
            <p className="tabular text-2xl font-bold">
              {formatAngka(latestW.weightKg)}{' '}
              <span className="text-base font-normal text-muted">
                kg · {formatTanggal(latestW.date)}
              </span>
            </p>
            {ideal !== null ? (
              <p className="text-muted">
                {(() => {
                  const g = gapToTarget(latestW.weightKg, ideal)
                  return gapText(g.state, g.kg)
                })()}{' '}
                ({formatAngka(ideal)} kg)
              </p>
            ) : (
              <p className="text-muted">Atur target berat ideal di bawah untuk melihat jaraknya.</p>
            )}
          </div>
        ) : null}
        {latestWaist?.waistCm !== undefined ? (
          <p className="mt-1 text-muted">
            Pinggang {formatAngka(latestWaist.waistCm)} cm · {formatTanggal(latestWaist.date)}
          </p>
        ) : null}
        {shouldSuggestWeighing(logs, today) ? (
          <p className="mt-2 text-sm text-muted">
            {latestW
              ? 'Sudah seminggu lebih sejak timbangan terakhir. Mau timbang pekan ini?'
              : 'Belum ada catatan berat. Timbang sekali seminggu sudah cukup.'}
          </p>
        ) : null}

        <form onSubmit={saveIdeal} noValidate className="mt-3 flex items-start gap-2">
          <div className="flex-1">
            <input
              aria-label="Target berat ideal (kg)"
              className="min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text tabular placeholder:text-muted"
              inputMode="decimal"
              placeholder={
                ideal !== null
                  ? `Target sekarang ${formatAngka(ideal)} kg`
                  : 'Target berat ideal (kg)'
              }
              value={idealText}
              onChange={(e) => setIdealText(e.target.value)}
            />
            {idealError ? (
              <span role="alert" className="mt-1 block text-sm text-danger">
                {idealError}
              </span>
            ) : null}
          </div>
          <Button type="submit" variant="secondary">
            Simpan target
          </Button>
        </form>
      </Card>

      <h2 className="pt-2 text-lg font-semibold">Riwayat tubuh</h2>
      {logs.length === 0 ? (
        <EmptyState
          title="Belum ada catatan"
          hint="Ketuk Catat untuk berat, pinggang, atau mood."
        />
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => (
            <li key={l.date}>
              <Card className="p-0">
                <button
                  type="button"
                  className="min-h-12 w-full p-4 text-left"
                  aria-label={`Catatan ${formatTanggal(l.date)}`}
                  onClick={() => setSheet({ log: l })}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{formatTanggal(l.date)}</span>
                    <span aria-hidden="true">
                      {l.mood !== undefined ? CONDITION_EMOJI[l.mood] : ''}
                    </span>
                  </div>
                  <div className="tabular text-sm text-muted">
                    {l.weightKg !== undefined ? `${formatAngka(l.weightKg)} kg` : '– kg'} ·{' '}
                    {l.waistCm !== undefined
                      ? `pinggang ${formatAngka(l.waistCm)} cm`
                      : 'pinggang –'}
                  </div>
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {sheet ? (
        <BodyForm
          key={sheet.log?.date ?? 'baru'}
          log={sheet.log}
          existingDates={logs.map((l) => l.date)}
          onClose={() => setSheet(null)}
          onSaved={(edited) => {
            setSheet(null)
            toast.show(edited ? 'Perubahan tersimpan ✓' : 'Catatan tersimpan ✓')
          }}
          onDelete={() => sheet.log && setConfirmDelete(sheet.log)}
        />
      ) : null}

      <Dialog
        open={confirmDelete !== undefined}
        danger
        title="Hapus catatan?"
        message={
          confirmDelete
            ? `Hapus catatan tubuh ${formatTanggal(confirmDelete.date)}? Ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Hapus"
        onCancel={() => setConfirmDelete(undefined)}
        onConfirm={async () => {
          if (confirmDelete) await deleteBodyLog(confirmDelete.date)
          setConfirmDelete(undefined)
          setSheet(null)
          toast.show('Catatan dihapus')
        }}
      />
    </>
  )
}
