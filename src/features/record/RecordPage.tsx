import { useEffect, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../../db/database'
import { setSetting } from '../../db/settings'
import type { ActiveRecording, Condition, RideType } from '../../db/types'
import { useSetting } from '../../db/useSetting'
import { formatAngka } from '../../domain/angka'
import { CONDITION_EMOJI, CONDITION_LABEL, TYPE_LABEL, avgSpeedKmh } from '../../domain/ride'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { Dialog } from '../../ui/Dialog'
import { PageHeader } from '../../ui/PageHeader'
import { Stat } from '../../ui/Stat'
import { useNow } from '../../ui/useNow'
import { useToast } from '../../ui/Toast'
import { Recorder, type RecorderDeps } from './recorder'
import { RecoveryChoices } from './RecoveryChoices'
import { discardRecording, getActive, saveRecording } from './recorderRepo'

type Step = 'memuat' | 'siap' | 'pulih' | 'rekam' | 'ringkasan'

function clock(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`
}

const SIGNAL_LOST_MS = 10_000
const SEARCH_HINT_MS = 60_000

/** Layar Rekam (FR-130…143). `deps` hanya untuk uji (GPS/Wake Lock palsu). */
export function RecordPage({ deps }: { deps?: RecorderDeps }) {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const seen = useSetting('safetyNoticeSeen')
  const [recorder] = useState(() => new Recorder(deps))
  const view = useSyncExternalStore(recorder.subscribe, recorder.getView)
  const now = useNow(1000).getTime()

  const [step, setStep] = useState<Step>('memuat')
  const [active, setActive] = useState<ActiveRecording | undefined>()
  const [confirmStop, setConfirmStop] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [type, setType] = useState<RideType>('metime')
  const [condition, setCondition] = useState<Condition>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchStart, setSearchStart] = useState<number | null>(null)

  const nav = location.state as { resume?: boolean; summary?: boolean } | null

  // Keadaan awal: ada rekaman tertunda? lanjut/ringkasan dari pilihan pemulihan, atau tawarkan pilihan.
  useEffect(() => {
    let alive = true
    void getActive().then((rec) => {
      if (!alive) return
      setActive(rec)
      if (rec && nav?.resume) {
        setStep('rekam')
        setSearchStart(Date.now())
        void recorder.start(true)
      } else if (rec && nav?.summary) setStep('ringkasan')
      else if (rec) setStep('pulih')
      else setStep('siap')
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bersihkan GPS & Wake Lock saat meninggalkan layar (data tetap aman di penyimpanan).
  useEffect(() => () => void recorder.dispose(), [recorder])

  // Wake Lock dilepas saat layar mati; minta lagi saat kembali (PER-002).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void recorder.onVisible()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [recorder])

  // Cegah keluar tak sengaja saat merekam: tutup tab dan tombol Kembali.
  const recording = step === 'rekam'
  useEffect(() => {
    if (!recording) return
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    const pop = () => {
      history.pushState(null, '', location.pathname + location.search)
      setConfirmLeave(true)
    }
    history.pushState(null, '', window.location.href)
    window.addEventListener('beforeunload', before)
    window.addEventListener('popstate', pop)
    return () => {
      window.removeEventListener('beforeunload', before)
      window.removeEventListener('popstate', pop)
    }
  }, [recording, location.pathname, location.search])

  async function begin() {
    if (!seen) await setSetting(db, 'safetyNoticeSeen', true)
    setStep('rekam')
    setSearchStart(Date.now())
    await recorder.start(false)
  }

  async function finish() {
    setConfirmStop(false)
    await recorder.stop()
    setActive(await getActive())
    setStep('ringkasan')
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await saveRecording({ type, condition })
      toast.show('Gowes tersimpan ✓')
      navigate('/gowes')
    } catch {
      setError('Gagal menyimpan. Rekaman masih aman, coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  async function discard() {
    setConfirmDiscard(false)
    await discardRecording()
    toast.show('Rekaman dibuang')
    navigate('/')
  }

  const s = view.stats
  const stats = step === 'ringkasan' && active ? active : null
  const sumKm = stats?.distanceKm ?? 0
  const sumSec = stats?.movingSec ?? 0

  return (
    <>
      <PageHeader title={step === 'ringkasan' ? 'Ringkasan gowes' : 'Rekam gowes'} />

      {step === 'memuat' ? (
        <p className="text-muted" role="status">
          Memuat…
        </p>
      ) : null}

      {step === 'pulih' && active ? (
        <Card>
          <h2 className="mb-2 font-semibold">Rekaman belum selesai</h2>
          <RecoveryChoices
            rec={active}
            onResume={() => {
              setStep('rekam')
              setSearchStart(Date.now())
              void recorder.start(true)
            }}
            onSave={() => setStep('ringkasan')}
            onDiscard={() => setConfirmDiscard(true)}
          />
        </Card>
      ) : null}

      {step === 'siap' ? (
        <div className="space-y-4">
          {!seen ? (
            <Card className="border-warn">
              <h2 className="font-semibold">Keselamatan dulu</h2>
              <p className="mt-1">
                Jangan mengoperasikan HP sambil mengayuh. Berhenti di tempat aman bila perlu melihat
                layar.
              </p>
            </Card>
          ) : null}
          <p className="text-muted">
            Aplikasi akan meminta izin lokasi dan menjaga layar tetap menyala selama merekam.
          </p>
          <Button large className="w-full" onClick={() => void begin()}>
            {seen ? 'Mulai gowes' : 'Saya mengerti, mulai'}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/gowes', { state: { catat: true } })}
          >
            Catat manual saja
          </Button>
        </div>
      ) : null}

      {step === 'rekam' ? (
        <div className="space-y-4">
          {view.phase === 'ditolak' ? (
            <Card className="border-danger">
              <p role="alert" className="font-semibold">
                Izin lokasi ditolak
              </p>
              <p className="mt-1 text-muted">
                Tanpa izin lokasi, gowes tidak bisa direkam. Izinkan lokasi di pengaturan browser,
                atau catat manual.
              </p>
              <Button
                className="mt-3 w-full"
                onClick={() => {
                  void discardRecording()
                  navigate('/gowes', { state: { catat: true } })
                }}
              >
                Catat manual
              </Button>
            </Card>
          ) : null}

          {view.phase === 'galat' ? (
            <p role="alert" className="text-danger">
              {view.error}
            </p>
          ) : null}

          {view.phase === 'mencari' ? (
            <Card>
              <p role="status" className="font-semibold">
                Mencari sinyal GPS…
              </p>
              {searchStart !== null && now - searchStart > SEARCH_HINT_MS ? (
                <p className="mt-1 text-muted">
                  Belum dapat sinyal. Coba pindah ke tempat terbuka.
                </p>
              ) : null}
            </Card>
          ) : null}

          {view.phase === 'merekam' || view.phase === 'jeda' ? (
            <>
              <p
                role="status"
                className={`text-center text-lg font-semibold ${view.phase === 'jeda' ? 'text-warn' : ''}`}
              >
                {view.manualPaused
                  ? 'Dijeda'
                  : view.autoPaused
                    ? 'Jeda otomatis (berhenti)'
                    : 'Merekam'}
              </p>
              {view.lastFixAt !== null && now - view.lastFixAt > SIGNAL_LOST_MS ? (
                <p role="alert" className="rounded-xl border border-warn p-2 text-center text-warn">
                  Sinyal GPS hilang. Menunggu sinyal kembali…
                </p>
              ) : null}
              <div className="space-y-3 text-center">
                <Stat
                  size="xl"
                  value={formatAngka(view.speedKmh, 1)}
                  unit="km/j"
                  label="Kecepatan"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Stat size="md" value={formatAngka(s.distanceKm, 2)} unit="km" label="Jarak" />
                  <Stat size="md" value={clock(s.movingSec)} label="Waktu bergerak" />
                  <Stat size="md" value={s.elevationM} unit="m" label="Tanjakan" />
                </div>
              </div>
            </>
          ) : null}

          {view.wakeLock === 'gagal' ? (
            <p role="alert" className="text-sm text-warn">
              Layar mungkin mati sendiri (Wake Lock tidak aktif). Atur layar agar tetap menyala.
            </p>
          ) : null}
          {view.error && view.phase !== 'galat' ? (
            <p role="alert" className="text-sm text-danger">
              {view.error}
            </p>
          ) : null}

          {view.phase === 'merekam' || view.phase === 'jeda' || view.phase === 'mencari' ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                large
                variant="secondary"
                disabled={view.phase === 'mencari'}
                onClick={() => recorder.togglePause()}
              >
                {view.manualPaused ? 'Lanjut' : 'Jeda'}
              </Button>
              <Button large variant="danger" onClick={() => setConfirmStop(true)}>
                Selesai
              </Button>
            </div>
          ) : null}

          <p className="text-center text-sm text-muted">
            Rekaman bisa berhenti bila layar dikunci atau aplikasi dipindah ke latar belakang.
            Biarkan layar menyala.
          </p>
        </div>
      ) : null}

      {step === 'ringkasan' ? (
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Stat value={formatAngka(sumKm, 2)} unit="km" label="Jarak" />
              <Stat value={clock(sumSec)} label="Waktu bergerak" />
              <Stat
                value={formatAngka(avgSpeedKmh(sumKm, sumSec), 1)}
                unit="km/j"
                label="Rata-rata"
              />
              <Stat value={Math.round(stats?.elevationM ?? 0)} unit="m" label="Tanjakan" />
            </div>
          </Card>
          <Card>
            <fieldset>
              <legend className="mb-2 font-semibold">Jenis gowes</legend>
              <div className="flex gap-2">
                {(Object.keys(TYPE_LABEL) as RideType[]).map((t) => (
                  <Chip key={t} selected={type === t} onClick={() => setType(t)}>
                    {TYPE_LABEL[t]}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4">
              <legend className="mb-2 font-semibold">Kondisi badan</legend>
              <div className="flex gap-2">
                {([0, 1, 2] as Condition[]).map((c) => (
                  <Chip
                    key={c}
                    selected={condition === c}
                    aria-label={`Kondisi ${CONDITION_LABEL[c]}`}
                    onClick={() => setCondition(c)}
                  >
                    {CONDITION_EMOJI[c]}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </Card>
          {error ? (
            <p role="alert" className="text-danger">
              {error}
            </p>
          ) : null}
          <Button large className="w-full" disabled={saving} onClick={() => void save()}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </Button>
          <Button variant="danger" className="w-full" onClick={() => setConfirmDiscard(true)}>
            Buang
          </Button>
        </div>
      ) : null}

      <Dialog
        open={confirmStop}
        title="Selesaikan gowes?"
        message="Rekaman akan dihentikan dan kamu akan melihat ringkasannya."
        confirmLabel="Selesai"
        onCancel={() => setConfirmStop(false)}
        onConfirm={() => void finish()}
      />
      <Dialog
        open={confirmDiscard}
        danger
        title="Buang rekaman?"
        message="Rekaman ini akan dihapus dan tidak bisa dikembalikan."
        confirmLabel="Buang"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => void discard()}
      />
      <Dialog
        open={confirmLeave}
        title="Keluar dari layar rekam?"
        message="Rekaman berhenti, tapi data yang sudah terekam tetap aman dan bisa dilanjutkan atau disimpan nanti."
        confirmLabel="Keluar"
        cancelLabel="Tetap merekam"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false)
          navigate('/')
        }}
      />
    </>
  )
}
