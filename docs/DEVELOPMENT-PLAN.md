# DEVELOPMENT PLAN — GowesSehat

Status: **DISETUJUI (2026-11-17)**
Tanggal: 2026-11-17
Sumber: `MODULE-BREAKDOWN.md`, `TECHNICAL-PLAN.md`, `AUDIT.md`, `DECISION-LOG.md` (D-01…D-24).

## 1. Aturan kerja (dari pedoman + keputusan)
1. **Satu modul per sesi.** Urutan M0 → M12, tidak melompat.
2. Tiap modul: baca spesifikasi → cek dependensi → jelaskan rencana → implementasi → uji → perbaiki → verifikasi → cek regresi → laporan → checkpoint (pedoman bagian 7).
3. **Git (D-17):** saya tidak commit sendiri. Setelah laporan modul, Anda bilang **COMMIT** → saya buat commit konvensional (`feat(rides): ...`). Push hanya setelah Anda bilang **PUSH**, dan saya tinjau dulu isi yang akan terbit (repo publik).
4. Perubahan requirement/desain/data/izin: saya beri tahu **sebelum** implementasi (pedoman bagian 6).
5. Logika hitungan selalu fungsi murni di `src/domain/` dengan uji Vitest **ditulis bersama kodenya**.
6. Data uji selalu palsu. Tidak ada rahasia di repo.
7. Selesai modul = semua AC modul lulus + semua uji lama masih hijau (regresi).

## 2. Definisi "selesai" untuk sebuah modul
- Semua AC modul (di MODULE-BREAKDOWN) terpenuhi dan terbukti lewat uji atau langkah manual tercatat.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` hijau.
- Tampilan dicek di lebar 360, 390, 420 px (tema gelap dan terang); input tidak memicu auto-zoom.
- Tidak ada `dangerouslySetInnerHTML`/`innerHTML` untuk teks pengguna.
- Laporan modul singkat: apa dibuat, apa diuji, apa yang belum, risiko.
- Pengguna menyetujui (Gate 6 per modul) → COMMIT.

## 3. Urutan dan isi sesi

| Sesi | Modul | Hasil yang bisa Anda coba | Uji utama | Catatan |
|---|---|---|---|---|
| 1 | **M0 Fondasi** | Aplikasi kosong 5 tab, tema neon gelap/terang, bisa dipasang di HP lewat `adb reverse` | Uji kontras, Dexie + migrasi, Service Worker, uji kelayakan HP | Perlu Opsi Pengembang di HP; cek `adb` |
| 2 | M1 Gowes manual | Catat/edit/hapus gowes, riwayat | Unit: kategori, kecepatan, duplikat, `parseAngka`; komponen form | AC-002…004 |
| 3 | M2 Target & grafik | Grafik 8 pekan, target bulanan, Beranda dasar | Unit: pekan, target mingguan, agregasi | AC-005/006 |
| 4 | M3 Harian | Jurnal, air, kesiapan | Unit: BR-011 termasuk air pagi | AC-007…010 |
| 5 | M4 Checklist | Checklist harian | Integrasi DB: reset, hapus item | AC-013 |
| 6 | M5 Tubuh & mood | Berat/pinggang/mood | Unit validasi | AC-012 |
| 7 | M6 Ringkasan mingguan | Ringkasan + keseimbangan | Unit: BR-018/019, tanpa NaN | AC-014/015 |
| 8 | M7 Konten & peregangan | Ide anak, nutrisi, timer | Komponen; pemindaian "sayur" | AC-011/015/016 |
| 9 | M8 Pengingat | File .ics | Unit ICS + **uji nyata di Kalender HP** (B-7) | AC-017 |
| 10 | M9 Cadangan | Ekspor/impor JSON | Integrasi: roundtrip, file rusak, 50 MB, transaksi | AC-018/019 |
| — | **Titik keputusan:** deploy pratinjau (D-18) | Aplikasi hidup di HP tanpa komputer | — | Sebelum M10 |
| 11 | M10 Mesin rekam | Mulai Gowes, angka besar, jeda, pemulihan | Unit: filter, jeda, jarak, elevasi, celah; E2E GPS palsu; **uji lapangan** | Risiko terbesar |
| 12 | M11 Peta & GPX | Peta jejak, ekspor GPX, jejak ikut cadangan | Unit GPX; E2E; CSP via `vite preview`; **uji lapangan** | |
| 13 | M12 Penyelesaian | Beranda final, keadaan kosong/galat, aksesibilitas | Regresi penuh | Gate menuju E2E baseline |

Jika sesi terasa terlalu besar (mis. M10), saya usulkan pecah dua sub-sesi dan minta persetujuan Anda dulu.

## 4. Fase setelah modul (pedoman bagian 2, 11, 12)
1. **E2E baseline** Playwright untuk perjalanan kritis → **Gate 7**.
2. **Security / Red Team** memakai `PERMISSION-MATRIX.md` bagian 5 → **Gate 8**.
3. Perbaikan keamanan (commit terpisah) → regresi E2E.
4. Refactor/cleanup (commit terpisah) → regresi E2E.
5. Audit akhir → **Gate 9**. UAT di HP Anda, rilis → **Gate 10** (saat itulah deploy produksi).

## 5. Struktur repo target (M0)
Mengikuti `TECHNICAL-PLAN.md` bagian 3. Tambahan: `docs/` ikut repo; `Referensi/` di `.gitignore`; skrip `npm run dev`, `build`, `preview`, `test`, `lint`, `typecheck`, `e2e`.

## 5b. Prasyarat yang perlu Anda siapkan
| Kapan | Apa |
|---|---|
| Awal M0 | Node.js sudah ada (v24, npm 11). Perlu `adb` (Android platform-tools) — saya cek; bila belum ada, saya beri langkah pasang |
| Akhir M0 | HP: aktifkan Opsi Pengembang (ketuk Nomor build 7 kali) → Debugging USB; kabel USB data |
| Sebelum M10 | Akun Cloudflare Pages (atau opsi lain) untuk deploy pratinjau |
| M8, M10, M11 | Anda sendiri menjalankan uji nyata di HP/sepeda; saya siapkan daftar langkahnya |

## 6. Risiko jadwal dan penanganannya
| Risiko | Penanganan |
|---|---|
| Perilaku GPS nyata berbeda dari uji | Konstanta ambang mudah diubah; uji lapangan M10/M11 sebelum dianggap selesai; fitur dasar tetap bisa dipakai lebih dulu (R-12) |
| Brave/Shields mengganggu | Uji kelayakan di akhir M0; keputusan sebelum M10 |
| `adb` merepotkan | Cadangan: terowongan HTTPS sementara |
| Ruang lingkup melebar | Fitur baru lewat Change Control (kelas F); tidak masuk modul berjalan |
