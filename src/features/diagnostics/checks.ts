// Uji kelayakan HP (M0, AUDIT A-3). Semua hasil hanya tampil di layar; tidak ada yang dikirim keluar.

export type CheckStatus = 'ok' | 'warn' | 'fail' | 'info'
export interface CheckResult {
  status: CheckStatus
  detail: string
}

const ok = (detail: string): CheckResult => ({ status: 'ok', detail })
const warn = (detail: string): CheckResult => ({ status: 'warn', detail })
const fail = (detail: string): CheckResult => ({ status: 'fail', detail })
const info = (detail: string): CheckResult => ({ status: 'info', detail })
const msg = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e))

export function checkSecureContext(): CheckResult {
  return window.isSecureContext
    ? ok(`Aman (${location.origin})`)
    : fail(
        `TIDAK aman (${location.origin}). GPS, Wake Lock, dan PWA tidak akan jalan. Pakai localhost atau HTTPS.`,
      )
}

export async function checkBrowser(): Promise<CheckResult> {
  const brave = (navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }).brave
  const isBrave = await Promise.resolve(brave?.isBrave?.() ?? false).catch(() => false)
  return info(
    `${isBrave ? 'Brave terdeteksi. ' : 'Brave tidak terdeteksi. '}${navigator.userAgent}`,
  )
}

export function checkStandalone(): CheckResult {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  return standalone
    ? ok('Berjalan sebagai aplikasi terpasang (layar penuh)')
    : info(
        'Berjalan di tab browser. Pasang lewat menu browser → "Instal aplikasi" / "Tambahkan ke layar utama".',
      )
}

export async function checkServiceWorker(): Promise<CheckResult> {
  if (!('serviceWorker' in navigator)) return fail('Service Worker tidak didukung')
  const regs = await navigator.serviceWorker.getRegistrations()
  if (regs.length === 0) {
    return warn(
      'Belum terdaftar. Normal di `npm run dev`; jalankan `npm run phone` (build) untuk menguji.',
    )
  }
  const controlled = navigator.serviceWorker.controller
    ? 'mengendalikan halaman'
    : 'belum mengendalikan (muat ulang sekali)'
  return ok(`${regs.length} terdaftar, ${controlled}`)
}

export async function checkStorage(): Promise<CheckResult> {
  if (!('storage' in navigator)) return fail('API penyimpanan tidak didukung')
  const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false
  const est = navigator.storage.estimate ? await navigator.storage.estimate() : undefined
  const mb = (n?: number) => (n === undefined ? '?' : `${(n / 1048576).toFixed(1)} MB`)
  const text = `Permanen: ${persisted ? 'ya' : 'belum'} · dipakai ${mb(est?.usage)} dari ${mb(est?.quota)}`
  return persisted ? ok(text) : warn(text)
}

export async function requestPersist(): Promise<CheckResult> {
  if (!navigator.storage?.persist) return fail('persist() tidak didukung')
  try {
    const granted = await navigator.storage.persist()
    return granted
      ? ok('Penyimpanan permanen diberikan')
      : warn(
          'Browser tidak memberi izin permanen (di Chromium biasanya tergantung pemakaian/pemasangan)',
        )
  } catch (e) {
    return fail(msg(e))
  }
}

export async function checkIndexedDb(): Promise<CheckResult> {
  const name = 'gowessehat-uji-kelayakan'
  try {
    const open = indexedDB.open(name, 1)
    const idb = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onupgradeneeded = () => open.result.createObjectStore('t')
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    const value = `uji-${Date.now()}`
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction('t', 'readwrite')
      tx.objectStore('t').put(value, 'k')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    const back = await new Promise<unknown>((resolve, reject) => {
      const r = idb.transaction('t').objectStore('t').get('k')
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    idb.close()
    await new Promise<void>((resolve) => {
      const del = indexedDB.deleteDatabase(name)
      del.onsuccess = () => resolve()
      del.onerror = () => resolve()
      del.onblocked = () => resolve()
    })
    return back === value
      ? ok('Tulis dan baca IndexedDB berhasil')
      : fail('Data yang dibaca tidak sama')
  } catch (e) {
    return fail(msg(e))
  }
}

export function checkWebGL(): CheckResult {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return fail('WebGL tidak tersedia (peta MapLibre tidak akan tampil)')
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'disamarkan'
    return ok(`WebGL tersedia · renderer: ${renderer}`)
  } catch (e) {
    return fail(msg(e))
  }
}

export function checkVibrate(): CheckResult {
  return typeof navigator.vibrate === 'function'
    ? ok('Getar didukung')
    : warn('Getar tidak didukung')
}

export function checkWakeLockSupport(): CheckResult {
  return 'wakeLock' in navigator ? ok('Wake Lock didukung') : fail('Wake Lock tidak didukung')
}

export async function testWakeLock(holdMs = 4000): Promise<CheckResult> {
  if (!('wakeLock' in navigator)) return fail('Wake Lock tidak didukung')
  try {
    const sentinel = await navigator.wakeLock.request('screen')
    const active = !sentinel.released
    await new Promise((r) => setTimeout(r, holdMs))
    const stillActive = !sentinel.released
    await sentinel.release()
    return active && stillActive
      ? ok(`Wake Lock aktif selama ${holdMs / 1000} dtk lalu dilepas`)
      : warn('Wake Lock dilepas sebelum waktunya')
  } catch (e) {
    return fail(msg(e))
  }
}

/** Mengamati GPS selama beberapa detik: laju pembaruan, akurasi, dan ketersediaan coords.speed (AUDIT B-2). */
export function testGps(durationMs = 10000): Promise<CheckResult> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(fail('Geolocation tidak didukung'))
    let count = 0
    let withSpeed = 0
    let bestAcc = Infinity
    let lastAcc = NaN
    let finished = false
    const finish = (r: CheckResult) => {
      if (finished) return
      finished = true
      navigator.geolocation.clearWatch(id)
      clearTimeout(timer)
      resolve(r)
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        count++
        lastAcc = p.coords.accuracy
        bestAcc = Math.min(bestAcc, p.coords.accuracy)
        if (p.coords.speed !== null && !Number.isNaN(p.coords.speed)) withSpeed++
      },
      (err) => {
        const why =
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak (cek izin situs di Brave dan izin lokasi Android)'
            : err.code === err.POSITION_UNAVAILABLE
              ? 'Posisi tidak tersedia (GPS mati / di dalam ruangan)'
              : 'Waktu habis menunggu GPS'
        finish(fail(why))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    )
    const timer = setTimeout(() => {
      if (count === 0)
        return finish(
          warn(`Belum ada titik dalam ${durationMs / 1000} dtk. Coba di tempat terbuka.`),
        )
      const detail = `${count} titik dalam ${durationMs / 1000} dtk · akurasi terbaik ${bestAcc.toFixed(0)} m, terakhir ${lastAcc.toFixed(0)} m · coords.speed ada di ${withSpeed}/${count} titik`
      finish(bestAcc <= 30 ? ok(detail) : warn(`${detail} (akurasi > 30 m akan dibuang filter)`))
    }, durationMs)
  })
}

export const SAMPLE_ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//GowesSehat//Uji//ID',
  'BEGIN:VEVENT',
  'UID:uji-kelayakan@gowessehat.local',
  'DTSTAMP:20260101T000000Z',
  'DTSTART;TZID=Asia/Jakarta:20260103T163000',
  'DURATION:PT30M',
  'RRULE:FREQ=WEEKLY;BYDAY=SA',
  'SUMMARY:Uji pengingat gowes',
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  'DESCRIPTION:Uji pengingat gowes',
  'TRIGGER:-PT0M',
  'END:VALARM',
  'END:VEVENT',
  'END:VCALENDAR',
  '',
].join('\r\n')

// Koordinat fiktif (bukan lokasi pribadi).
export const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GowesSehat uji" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Uji kelayakan</name><trkseg>
    <trkpt lat="-6.200000" lon="106.800000"><ele>10</ele><time>2026-01-03T09:00:00Z</time></trkpt>
    <trkpt lat="-6.200200" lon="106.800200"><ele>11</ele><time>2026-01-03T09:00:05Z</time></trkpt>
    <trkpt lat="-6.200400" lon="106.800400"><ele>12</ele><time>2026-01-03T09:00:10Z</time></trkpt>
  </trkseg></trk>
</gpx>
`

/** Memicu unduhan file lewat Blob. Dipakai juga untuk GPX/ICS asli di modul berikutnya. */
export function downloadText(filename: string, mime: string, content: string): CheckResult {
  try {
    const url = URL.createObjectURL(new Blob([content], { type: mime }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
    return info(
      `Unduhan "${filename}" dimulai. Periksa notifikasi unduhan / folder Download, lalu coba buka file-nya.`,
    )
  } catch (e) {
    return fail(msg(e))
  }
}
