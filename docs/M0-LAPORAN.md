# LAPORAN MODUL M0 — Fondasi

Tanggal: 2026-11-17 · Status: **menunggu persetujuan Gate 6 (M0) dan perintah COMMIT**
Perangkat uji: Motorola Edge 60 Fusion (Android 17), Brave dan Chrome, lewat `adb reverse` (D-19).

## 1. Yang dibuat
- Git: `git init`, `origin` → `Gowes-Nugug`, `.gitignore` (`Referensi/`, cadangan, `.gpx`, `.ics`). **Belum ada commit.**
- Vite 8 + React 19 + TypeScript (strict) + Tailwind v4, ESLint (larangan `innerHTML`/`dangerouslySetInnerHTML`), Prettier, Vitest.
- Tema hijau neon (D-16): gelap bawaan, terang, dan ikut-sistem; token di `src/index.css`, kontras diuji otomatis.
- Navigasi bawah 5 tab (Beranda, Gowes, Harian, Progres, Lainnya), halaman masih kosong.
- Komponen dasar: Kartu, Tombol (biasa/besar 72 px), Chip, Stat, Sheet, Dialog, Toast, PageHeader/EmptyState.
- Database Dexie versi 1 dengan 11 object store sesuai DATA-MODEL, pengaturan awal, fungsi status/permintaan penyimpanan permanen (belum dipanggil otomatis, sesuai C-4).
- PWA: manifest, Service Worker mode `prompt` (tidak pernah muat ulang sendiri), banner "Versi baru", ikon roda neon (192/512/maskable), `_headers` CSP (termasuk `worker-src blob:` untuk peta).
- Halaman pengembang: **Uji kelayakan HP** dan **Galeri komponen** (di Lainnya).

## 2. Verifikasi
| Pemeriksaan | Hasil |
|---|---|
| `npm run typecheck`, `lint`, `build` | Hijau |
| `npm test` | 39 uji lulus (kontras 2 tema, skema DB + pengaturan, komponen, navigasi, uji kelayakan) |
| Prettier | Rapi |
| AC-030 (bisa dipasang, layar penuh) | Lulus di Chrome (terpasang); di Brave tidak ada instalasi sungguhan (lihat 3) |
| AC-031 (360–420 px, tanpa auto-zoom) | Input 16 px di CSS; pemeriksaan visual di HP oleh pengguna |

## 3. Hasil uji kelayakan HP
| Uji | Hasil |
|---|---|
| Konteks aman (`localhost` via `adb reverse`) | Lulus |
| IndexedDB tulis/baca | Lulus |
| WebGL (untuk peta MapLibre) | Lulus |
| Wake Lock (dukungan + uji 4 dtk) | Lulus |
| GPS 10 dtk | Lulus (laporan pengguna) |
| Unduh .ics dan .gpx | Lulus (laporan pengguna) |
| Service Worker | `npm run dev`: perhatian (normal, tidak didaftarkan). Build: lulus |
| **Penyimpanan permanen di Brave** | **Perhatian**: ditolak, juga setelah "Minta permanen" |
| Penyimpanan permanen di Chrome terpasang | "Minta permanen" lulus; baris status sempat perhatian karena dibaca sebelum permintaan (perlu dijalankan ulang untuk konfirmasi) |

Temuan:
1. **Brave tidak membuat aplikasi terpasang sungguhan** (tidak ada paket WebAPK di HP) dan tidak memberi penyimpanan permanen. Chrome memberi.
2. Server dev Vite di Windows hanya mendengarkan `[::1]`, sehingga `adb reverse` (IPv4) gagal. Diperbaiki dengan `server.host = 127.0.0.1` di `vite.config.ts`.
3. Hasil `getCurrentPosition`/WebGL tidak menyimpan lokasi; hanya akurasi yang ditampilkan.

## 4. Belum dilakukan / batasan
- Belum ada fitur (memang bukan lingkup M0).
- `npm audit`: 4 temuan sedang di `glob`/`minimatch` lewat `vite-plugin-pwa` (alat build, tidak ikut ke aplikasi); perbaikan butuh turun versi besar. Ditinjau lagi di fase keamanan.
- Uji aksesibilitas visual 360/390/420 px dan tema terang dilakukan manual oleh pengguna di Galeri komponen.
- Deploy sengaja ditunda (D-18).

## 5. Risiko dan keputusan terbuka
| # | Hal | Rekomendasi |
|---|---|---|
| K-8 | Browser untuk aplikasi terpasang sehari-hari: Chrome (terpasang sungguhan + penyimpanan permanen) atau Brave (belum terbukti) | **Chrome untuk aplikasi terpasang**; Brave tetap dipakai untuk pengembangan. Risiko data hilang di Brave ditutup pengingat cadangan (BR-021) |
| — | Rekaman GPS, Wake Lock di mode terpasang, perilaku layar terkunci | Diuji di lapangan M10 |
