# TECHNICAL PLAN — GowesSehat

Status: Gate 4 disetujui (2026-11-16). Semua pilihan di sini **[RECOMMENDATION]** kecuali ditandai.

## 1. Prinsip teknis (urut prioritas, dari pedoman bagian 16)
Benar → Aman → Mudah dirawat → Mudah diuji → Nyaman dipakai → Cepat → Sederhana.

## 2. Tumpukan teknologi

| Lapisan | Pilihan | Alasan sederhana |
|---|---|---|
| Bahasa | TypeScript | Menangkap salah ketik angka/tanggal sebelum jalan; membantu AI konsisten |
| Kerangka tampilan | React 19 + Vite | Sama dengan prototipe lama pengguna (React 19 + TS + Vite); ekosistem besar; AI paham |
| Gaya | Tailwind CSS v4 | Sama dengan prototipe lama; palet oranye mudah dijadikan token |
| Penyimpanan | IndexedDB lewat **Dexie** + `dexie-react-hooks` | Menyimpan banyak titik GPS; tampilan ikut berubah otomatis saat data berubah |
| Routing | React Router (mode hash) | Tab dan layar tanpa butuh aturan server |
| Peta | **MapLibre GL JS** + gaya OpenFreeMap "Liberty" | Gratis tanpa kunci; URL gaya jadi pengaturan agar bisa diganti |
| Grafik | SVG buatan sendiri (satu komponen batang) | Hanya satu jenis grafik; menghindari pustaka besar (Recharts) |
| PWA | `vite-plugin-pwa` (manifest + Service Worker) | Bisa dipasang di layar utama (F-15); cangkang aplikasi tersimpan |
| Validasi | **Zod** | Satu skema untuk form dan impor JSON |
| Uji logika | **Vitest** | Rumus (kesiapan, target, ringkasan, filter GPS) diuji tanpa tampilan |
| Uji alur | **Playwright** (Chromium, emulasi HP + GPS palsu) | E2E critical journeys (pedoman bagian 11); mendukung lokasi tiruan |
| Kualitas | ESLint + Prettier | Konsistensi |
| Paket | npm | Standar |

Kerangka alternatif (tanpa React, JavaScript biasa seperti prototipe) ditolak: 15 fitur + state perekaman butuh struktur komponen.

## 3. Struktur folder yang diusulkan
```
src/
  app/         # rute, tata letak, navigasi bawah
  features/
    rides/  recording/  journal/  hydration/  body/
    checklist/  weekly/  kids/  nutrition/  reminders/  backup/
  domain/      # fungsi murni: readiness, targets, summary, gps-filter, gpx, ics
  db/          # skema Dexie, migrasi, akses data
  ui/          # komponen bersama (Kartu, Chip, Sheet, Stat, BarChart, Map)
  content/     # teks statis (ide anak, nutrisi, peregangan)
tests/ (unit)   e2e/ (Playwright)
```
Aturan: `domain/` tidak boleh mengimpor React, Dexie, atau browser → mudah diuji dan diubah.

## 4. Rancangan perekaman GPS (inti cyclocomp)
- `navigator.geolocation.watchPosition` dengan `enableHighAccuracy: true`. Titik masuk ke **antrean di memori** → disaring (BR-015) → dihitung (BR-014/16/17) → ditulis ke `active_points` **per kelompok** (±5 detik) agar tidak membebani.
- **Wake Lock** (`navigator.wakeLock.request('screen')`) diminta saat mulai dan **diminta ulang** bila halaman kembali terlihat (`visibilitychange`).
- **Deteksi terputus:** `active_recording.lastPointTs` diperbarui; saat aplikasi dibuka dan state masih `merekam/jeda` → dialog pemulihan.
- Layar terkunci/di latar belakang: GPS bisa berhenti (batasan diterima). Saat kembali ke depan: celah ditandai (BR-017), pengguna diberi tahu.
- Tombol kembali sistem: tertahan dengan konfirmasi (Design Brief bagian 4).
- Kecepatan tampilan: dihitung dari beberapa titik terakhir (rata-rata kecil) agar angka tidak melompat.
- Hemat baterai: layar redup/kontras hitam di mode gelap; peta dapat dimatikan (opsi). [ASSUMPTION]
- **Risiko utama:** akurasi/perilaku GPS berbeda antar HP. Mitigasi: uji lapangan nyata di modul M10 dan M11 sebelum dianggap selesai (selain uji otomatis dengan GPS palsu).

## 5. Rancangan GPX dan ICS
- **GPX 1.1**: satu `<trk>` dengan `<trkseg>` (dipecah di celah > 30 detik), `<time>` per titik, `<ele>`; karakter khusus XML di-escape; opsi potong 200 m (BR-024).
- **ICS**: `VEVENT` berulang (`RRULE`), `VALARM` pengingat; empat event minum (Sen–Jum) + jurnal harian + gowes Sabtu + gowes Minggu; zona waktu `Asia/Jakarta` bawaan [ASSUMPTION]; karakter khusus di-escape; satu file per pilihan pengguna.

## 6. Keamanan (diturunkan dari `PERMISSION-MATRIX.md`)
1. **CSP** via berkas `_headers` Cloudflare: skrip hanya dari domain sendiri; koneksi hanya ke OpenFreeMap (dan cadangan OSM); MapLibre butuh `worker-src 'self' blob:` dan `img-src 'self' data: blob:` (D-24). `_headers` tidak berlaku di server pengembangan: CSP diuji lewat `vite preview` dengan header di M11.
2. Tidak memakai `dangerouslySetInnerHTML`/`innerHTML` untuk teks pengguna.
3. Impor JSON divalidasi Zod + batas ukuran + transaksi semua-atau-tidak.
4. Tanpa analitik, tanpa skrip pihak ketiga selain peta.
5. Dependensi seminimal mungkin; audit `npm audit` sebelum rilis.
6. Service Worker: hanya aset aplikasi; versi cache bernomor; tidak menyimpan data pengguna.
7. Tidak ada rahasia di repo; `.gitignore` disiapkan di M0.

## 7. Pengujian (berlapis, pedoman bagian 9)
| Lapis | Alat | Cakupan |
|---|---|---|
| Unit (logika) | Vitest | BR-010…024, validasi, GPX, ICS, impor |
| Fungsional modul | Vitest + uji komponen | tiap modul sebelum commit |
| Integrasi | Vitest + fake-indexeddb | DB, transaksi, migrasi, pemulihan |
| E2E | Playwright | Perjalanan kritis: catat manual, rekam (GPS palsu), pemulihan, cadangan, ekspor GPX |
| Keamanan | Manual + skrip | Daftar di PERMISSION-MATRIX bagian 5 |
| Lapangan | Pengguna di sepeda | M10/M11: akurasi, baterai, layar kunci |
| UAT | Pengguna | Fase 15 |
Gate 7 (E2E hijau) sebelum security & refactor.

## 8. Deployment dan alur kerja kode
- Cabang: `main` (rilis) + cabang fitur per modul; commit gaya konvensional per modul (pedoman bagian 8). Commit hanya atas permintaan pengguna.
- **Cloudflare Pages:** hubungkan repo → perintah build `npm run build`, folder keluaran `dist`. Preview otomatis per cabang.
- **Render.com (alternatif):** Static Site dengan perintah dan folder yang sama.
- `public/_headers` (CSP), `public/manifest.webmanifest`, ikon aplikasi (192/512 px) dibuat di M0.
- Persiapan awal (M0): `git init`, hubungkan `origin` ke repo publik `Gowes-Nugug`, `.gitignore` (wajib: `Referensi/`, `node_modules`, `dist`, `*.gpx`, `*backup*.json`, data jejak nyata), README. Data uji selalu palsu (D-17).
- **Jalan lokal (D-11 ditunda, D-18/D-19):** `npm run dev` di komputer. Untuk mencoba di HP: kabel USB + Debugging USB, lalu `adb reverse tcp:5173 tcp:5173` dan buka `http://localhost:5173` di Brave HP (dianggap konteks aman: GPS, Wake Lock, PWA jalan). IP Wi-Fi biasa **tidak** dipakai untuk uji GPS. Cadangan: terowongan HTTPS sementara.
- **Deploy pratinjau:** satu kali sebelum uji lapangan M10 (Cloudflare Pages dari cabang modul); bukan rilis (Gate 10).

## 9. Kinerja dan baterai
Target: tab terbuka < 2 dtk di HP menengah; layar rekam tidak menulis ke DB tiap titik (kelompok); peta opsional matikan; tanpa animasi berat.

## 10. Risiko teknis
| # | Risiko | Mitigasi |
|---|---|---|
| T-1 | GPS HP berbeda-beda | Uji lapangan, ambang bisa diubah (konstanta) |
| T-2 | OpenFreeMap tak tersedia/berubah | URL gaya jadi pengaturan; cadangan OSM raster; rekaman tak bergantung peta |
| T-3 | Browser menghapus data | Penyimpanan permanen + pengingat cadangan |
| T-4 | Wake Lock tidak didukung/terlepas | Minta ulang; peringatan |
| T-5 | Cyclocomp memperlambat rilis | Modul terakhir (R-12) |
| T-6 | Service Worker membuat versi lama menempel | Banner "Versi baru", versi cache bernomor |
| T-7 | Repo publik: data pribadi bocor lewat commit | `.gitignore`, data uji palsu, tinjau sebelum push (D-17) |
| T-8 | Brave Shields/WebGL/hapus-data-saat-keluar mengganggu peta atau penyimpanan | Uji kelayakan HP di akhir M0 (D-23) |
| T-9 | Uji lapangan tidak bisa dengan server lokal | Deploy pratinjau sebelum M10 (D-18) |
