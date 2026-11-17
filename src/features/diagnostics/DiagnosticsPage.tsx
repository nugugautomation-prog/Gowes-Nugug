import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { PageHeader } from '../../ui/PageHeader'
import {
  SAMPLE_GPX,
  SAMPLE_ICS,
  checkBrowser,
  checkIndexedDb,
  checkSecureContext,
  checkServiceWorker,
  checkStandalone,
  checkStorage,
  checkVibrate,
  checkWakeLockSupport,
  checkWebGL,
  downloadText,
  requestPersist,
  testGps,
  testWakeLock,
  type CheckResult,
  type CheckStatus,
} from './checks'

// Status selalu ikon + teks, bukan warna saja.
const BADGE: Record<CheckStatus, { icon: string; label: string; cls: string }> = {
  ok: { icon: '✓', label: 'LULUS', cls: 'text-brand' },
  warn: { icon: '~', label: 'PERHATIAN', cls: 'text-warn' },
  fail: { icon: '✕', label: 'GAGAL', cls: 'text-danger' },
  info: { icon: 'i', label: 'INFO', cls: 'text-muted' },
}

type Results = Record<string, CheckResult | 'running'>

export function DiagnosticsPage() {
  const [results, setResults] = useState<Results>({})

  const run = useCallback(async (id: string, fn: () => CheckResult | Promise<CheckResult>) => {
    setResults((r) => ({ ...r, [id]: 'running' }))
    let res: CheckResult
    try {
      res = await fn()
    } catch (e) {
      res = { status: 'fail', detail: e instanceof Error ? e.message : String(e) }
    }
    setResults((r) => ({ ...r, [id]: res }))
  }, [])

  const runAuto = async () => {
    await Promise.all([
      run('secure', checkSecureContext),
      run('browser', checkBrowser),
      run('standalone', checkStandalone),
      run('sw', checkServiceWorker),
      run('storage', checkStorage),
      run('idb', checkIndexedDb),
      run('webgl', checkWebGL),
      run('vibrate', checkVibrate),
      run('wakesupport', checkWakeLockSupport),
    ])
  }

  const rows: { id: string; label: string }[] = [
    { id: 'secure', label: 'Konteks aman (HTTPS/localhost)' },
    { id: 'browser', label: 'Browser' },
    { id: 'standalone', label: 'Mode terpasang' },
    { id: 'sw', label: 'Service Worker' },
    { id: 'storage', label: 'Penyimpanan permanen' },
    { id: 'idb', label: 'IndexedDB tulis/baca' },
    { id: 'webgl', label: 'WebGL (untuk peta)' },
    { id: 'vibrate', label: 'Getar (haptic)' },
    { id: 'wakesupport', label: 'Dukungan Wake Lock' },
    { id: 'persist', label: 'Minta penyimpanan permanen' },
    { id: 'wake', label: 'Uji Wake Lock 4 dtk' },
    { id: 'gps', label: 'Uji GPS 10 dtk' },
    { id: 'ics', label: 'Unduh .ics' },
    { id: 'gpx', label: 'Unduh .gpx' },
  ]

  return (
    <>
      <PageHeader
        title="Uji kelayakan HP"
        subtitle="M0 · khusus pengembang"
        action={
          <Link className="flex min-h-12 items-center text-brand underline" to="/lainnya">
            Kembali
          </Link>
        }
      />
      <div className="space-y-4">
        <Card className="space-y-3">
          <Button className="w-full" onClick={runAuto}>
            Jalankan pemeriksaan otomatis
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => run('persist', requestPersist)}>
              Minta permanen
            </Button>
            <Button variant="secondary" onClick={() => run('wake', () => testWakeLock(4000))}>
              Uji Wake Lock
            </Button>
            <Button variant="secondary" onClick={() => run('gps', () => testGps(10000))}>
              Uji GPS (di luar)
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                run('ics', () => downloadText('uji-pengingat.ics', 'text/calendar', SAMPLE_ICS))
              }
            >
              Unduh .ics
            </Button>
            <Button
              variant="secondary"
              className="col-span-2"
              onClick={() =>
                run('gpx', () => downloadText('uji-jejak.gpx', 'application/gpx+xml', SAMPLE_GPX))
              }
            >
              Unduh .gpx
            </Button>
          </div>
        </Card>

        <Card>
          <ul className="divide-y divide-line">
            {rows.map(({ id, label }) => {
              const r = results[id]
              return (
                <li key={id} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{label}</span>
                    {r === undefined ? (
                      <span className="text-sm text-muted">– belum dijalankan</span>
                    ) : r === 'running' ? (
                      <span className="text-sm text-muted">… berjalan</span>
                    ) : (
                      <span className={`text-sm font-semibold ${BADGE[r.status].cls}`}>
                        {BADGE[r.status].icon} {BADGE[r.status].label}
                      </span>
                    )}
                  </div>
                  {r && r !== 'running' ? (
                    <p className="mt-1 break-words text-sm text-muted">{r.detail}</p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </Card>
        <p className="text-sm text-muted">
          Hasil hanya tampil di layar ini dan tidak dikirim ke mana pun. Lokasi yang dibaca tidak
          ditampilkan atau disimpan; hanya akurasinya.
        </p>
      </div>
    </>
  )
}
