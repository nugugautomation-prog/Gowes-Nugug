# DECISION LOG — GowesSehat

Catatan keputusan penting beserta alasannya. Urut tanggal. Status: **Disetujui** (oleh pengguna) / **Diusulkan** (menunggu gate).

| ID | Tanggal | Keputusan | Alasan | Status |
|---|---|---|---|---|
| D-01 | 2026-10-12 | Input Strava manual; tanpa upload screenshot/GPX | Strava gratis Android tidak ekspor file | Disetujui |
| D-02 | 2026-10-12 | Tanpa sayur sebagai solusi utama | Preferensi pengguna | Disetujui |
| D-03 | 2026-10-12 | PWA tanpa server, data di perangkat, ekspor/impor cadangan | Biaya nol, mudah dirawat | Disetujui |
| D-04 | 2026-11-16 | Tambah mode cyclocomp (rekam GPS, layar nyala, peta, ekspor GPX), modul terakhir v1; sensor Bluetooth dan navigasi arahan belok ditunda; peta online saja | Pengguna ingin HP jadi cyclocomp | Disetujui |
| D-05 | 2026-11-16 | Brainstorming B1–B12 | Menutup celah (pemulihan, jeda otomatis, kunci data rekaman, dst.) | Disetujui |
| D-06 | 2026-11-16 | PRD Gate 2, termasuk OQ-P1…P7 | — | Disetujui |
| D-07 | 2026-11-16 | Design Brief Gate 3: 5 tab, Mulai Gowes tombol besar di Beranda, kembali tertahan saat rekam | Cegah layar menumpuk & rekaman hilang | Disetujui |
| D-08 | 2026-11-16 | Arsitektur tanpa backend; IndexedDB (Dexie) untuk semua data | Jejak GPS besar; satu jenis penyimpanan | Disetujui |
| D-09 | 2026-11-16 | Peta: OpenFreeMap (MapLibre), URL dapat diganti; cadangan OSM raster resmi | Gratis tanpa kunci; OSM resmi tak cocok sebagai default untuk aplikasi pakai-terus dan dapat memblokir | Disetujui |
| D-10 | 2026-11-16 | Teknologi: React 19 + TS + Vite + Tailwind v4 + Dexie + Zod + Vitest + Playwright; grafik SVG sendiri | Mirip prototipe lama pengguna, AI-friendly, dependensi minim | Disetujui |
| D-11 | 2026-11-16 | Hosting: Cloudflare Pages dari GitHub | Gratis, HTTPS, mudah | Disetujui |
| D-12 | 2026-11-16 | G-1: tambah kategori ke-4 "Lainnya" | Sabtu pagi/Minggu sore tak punya kategori | Disetujui |
| D-13 | 2026-11-16 | G-2: rumus ambang air proporsional jam (BR-011) | OQ-P3 belum berupa rumus | Disetujui |
| D-14 | 2026-11-16 | G-3: cadangan JSON memuat jejak GPS secara bawaan | Peta tidak hilang saat ganti HP | Disetujui |
| D-15 | 2026-11-16 | G-4: Service Worker hanya menyimpan cangkang aplikasi (bukan syarat offline) | Aplikasi bisa dibuka tanpa sinyal; tanpa peta offline | Disetujui |
| D-16 | 2026-11-17 | Palet hijau neon (K-1): mode gelap bawaan, neon hanya isi tombol/aksen dengan teks gelap, tema terang memakai hijau tua untuk teks, status kesiapan selalu ikon + teks. Menggantikan oranye (Design Change) | Keinginan pengguna; neon tak terbaca di latar putih dan bentrok dengan status hijau | Disetujui |
| D-17 | 2026-11-17 | Repo publik `nugugautomation-prog/Gowes-Nugug` (K-2): commit per modul setelah pengguna bilang COMMIT, push hanya setelah PUSH; `Referensi/`, cadangan, dan jejak GPS nyata tidak masuk repo; data uji palsu; `docs/` ikut | Repo publik: isi dan riwayat terlihat semua orang | Disetujui |
| D-18 | 2026-11-17 | Deploy belakangan (D-11) tetap untuk M0–M9; satu deploy pratinjau (bukan rilis) sebelum uji lapangan M10 (K-3) | Uji lapangan butuh aplikasi hidup di HP tanpa komputer | Disetujui |
| D-19 | 2026-11-17 | Uji di HP lewat `adb reverse` (kabel USB, Opsi Pengembang + Debugging USB) (K-4) | GPS/Wake Lock/PWA butuh `localhost` atau HTTPS; IP Wi-Fi tidak aman | Disetujui |
| D-20 | 2026-11-17 | BR-011: sebelum 11:00 poin air memakai total hidrasi kemarin (≥ 2.000 ml); setelah itu rumus proporsional (K-5) | Ambang air pagi 0 memberi poin gratis | Disetujui |
| D-21 | 2026-11-17 | BR-014/015: kecepatan dari `coords.speed` bila ada; pergeseran < akurasi = diam; jarak dari semua titik valid, hanya penyimpanan yang dijarangkan; ambang berupa konstanta (K-6) | GPS bergetar saat diam; jarak terpotong | Disetujui |
| D-22 | 2026-11-17 | Impor = ganti semua data, batas 50 MB, diblokir saat merekam, validasi Zod per titik (K-7) | Aturan impor belum tegas | Disetujui |
| D-23 | 2026-11-17 | Target browser: Chromium Android, Brave sebagai uji utama (HP Motorola Edge 60 Fusion), Chrome pembanding; uji kelayakan HP di akhir M0 | Pengguna memakai Brave | Disetujui |
| D-25 | 2026-11-17 | Gate 6 M0 (Fondasi) disetujui; tema terang dan gelap diperiksa pengguna di HP (lulus). K-8 (Chrome untuk aplikasi terpasang vs Brave) masih terbuka, tidak menghalangi M1 | `docs/M0-LAPORAN.md` | Disetujui |
| D-24 | 2026-11-17 | Gate 5 lulus bersyarat; temuan kecil B-4, B-6, B-8, B-9, B-10 diterapkan (Kembali "sejauh browser mengizinkan", CSP MapLibre, hapus `eleRaw`, `parseAngka` menerima koma/titik, status penyimpanan permanen ditampilkan) | Hasil `AUDIT.md` | Disetujui |
