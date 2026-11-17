# MODULE BREAKDOWN — GowesSehat

Status: Gate 4 disetujui (2026-11-16). Urutan pengerjaan = urutan di bawah. **Satu modul per sesi kerja, dengan Git checkpoint** (pedoman bagian 7–8). Cyclocomp (M10, M11) modul terakhir [CONFIRMED, OQ-11].
Setiap modul: Purpose, Scope, Dependencies, Input, Process, Output, Business Rules, Permission, Validation, Acceptance Criteria.
Permission: semua modul dijalankan oleh Pemilik; izin perangkat disebut bila ada.

---

## M0 — Fondasi
- **Purpose:** kerangka aplikasi yang bisa dipasang, tampil, dan menyimpan data.
- **Scope:** `git init` + hubungkan ke `Gowes-Nugug` (publik) + `.gitignore` (D-17), Vite/React/TS/Tailwind, tema gelap bawaan/terang + token hijau neon + uji kontras (D-16), navigasi bawah 5 tab (kosong), komponen dasar (Kartu, Chip, Sheet, Stat, Toast, Dialog), Dexie + skema + migrasi, pengaturan dasar, manifest + Service Worker + ikon, `_headers` CSP, README, **uji kelayakan HP di Brave lewat `adb reverse`** (GPS, Wake Lock, persist, Service Worker, instalasi, WebGL, unduh .ics/.gpx; D-19, D-23). Deploy ditunda (D-11/D-18).
- **Dependencies:** —
- **Input:** Design Brief, TECHNICAL-PLAN.
- **Process:** inisialisasi proyek, bangun cangkang, hubungkan Cloudflare Pages.
- **Output:** aplikasi kosong yang jalan lokal dan bisa dipasang di layar utama HP lewat `adb reverse`.
- **Business Rules:** BR-002 (util pekan).
- **Permission:** PER-003 (M0 hanya menyiapkan fungsinya; dipanggil saat data pertama tersimpan, hasilnya ditampilkan di Cadangan).
- **Validation:** —
- **Acceptance Criteria:** AC-030 (bisa dipasang, layar penuh), AC-031 (360–420 px, tanpa auto-zoom); navigasi 5 tab berfungsi; build lulus; hasil uji kelayakan HP tercatat (di `docs/`).

## M1 — Gowes manual
- **Purpose:** mencatat dan mengelola gowes dari Strava.
- **Scope:** F-02: form (sheet), daftar riwayat, edit, hapus, peringatan duplikat, kecepatan rata-rata, kategori otomatis.
- **Dependencies:** M0.
- **Input:** tanggal, jarak, waktu (jam+menit), elevasi, kategori, jenis, kondisi, catatan.
- **Process:** validasi (Zod) → simpan `rides` (`source=manual`) → riwayat memperbarui diri.
- **Output:** gowes tersimpan, terlihat di riwayat.
- **Business Rules:** BR-006, BR-009, BR-010, BR-022.
- **Permission:** —
- **Validation:** VAL-001, 002, 006, 007.
- **Acceptance Criteria:** AC-002, AC-003, AC-004.

## M2 — Target, grafik, dan Beranda dasar
- **Purpose:** melihat progres.
- **Scope:** F-03 (metrik, grafik 8 pekan, target bulanan bebas + 4 tombol, garis target mingguan), Beranda dasar (progres bulanan + tombol Catat Gowes; kesiapan dan Mulai Gowes menyusul).
- **Dependencies:** M1.
- **Input:** `rides`, `monthlyTargetKm`.
- **Process:** agregasi per pekan/bulan (fungsi murni), render SVG.
- **Output:** grafik, progres, target.
- **Business Rules:** BR-002, BR-008/BR-012, BR-013.
- **Permission:** —
- **Validation:** target > 0.
- **Acceptance Criteria:** AC-005, AC-006; AC-001 (sebagian).

## M3 — Harian: jurnal, hidrasi, kesiapan
- **Purpose:** kebugaran harian dan indikator kesiapan.
- **Scope:** F-04, F-05; tab Harian bagian jurnal dan air; status kesiapan di Beranda.
- **Dependencies:** M0, M2 (Beranda).
- **Input:** tidur, buah, menit anak (hari ini/kemarin); +250/+500/koreksi.
- **Process:** simpan `journals`/`hydration`; hitung kesiapan (BR-011, termasuk poin air pagi D-20).
- **Output:** status 🟢🟡🔴/netral.
- **Business Rules:** BR-001, BR-004, BR-011, BR-023.
- **Permission:** —
- **Validation:** VAL-004.
- **Acceptance Criteria:** AC-007, AC-008, AC-009, AC-010.

## M4 — Checklist rutinitas
- **Purpose:** rutinitas harian sendiri.
- **Scope:** F-08: tambah, hapus (+ urungkan), centang, reset harian, hasil harian.
- **Dependencies:** M0.
- **Input:** judul item, centang.
- **Process:** `checklist_items` + `checklist_days` (BR-020).
- **Output:** daftar harian, riwayat tersimpan.
- **Business Rules:** BR-020.
- **Permission:** —
- **Validation:** VAL-007.
- **Acceptance Criteria:** AC-013.

## M5 — Pelacak tubuh dan mood
- **Purpose:** memantau berat, pinggang, mood.
- **Scope:** F-07: input, riwayat, edit/hapus, target berat ideal, mood cepat di Harian.
- **Dependencies:** M0.
- **Input:** berat, pinggang, mood, target.
- **Process:** `body_logs` satu per tanggal (gabung).
- **Output:** riwayat, jarak ke target.
- **Business Rules:** BR-004; nilai mood (bagian 3).
- **Permission:** —
- **Validation:** VAL-003.
- **Acceptance Criteria:** AC-012.

## M6 — Ringkasan mingguan dan keseimbangan hidup
- **Purpose:** gambaran satu pekan.
- **Scope:** F-09 + batang keseimbangan (F-10 FR-092); tab Progres.
- **Dependencies:** M1–M5.
- **Input:** semua data pekan terpilih.
- **Process:** fungsi murni BR-019, BR-018; kalimat statis ber-angka.
- **Output:** ringkasan + pemilih pekan.
- **Business Rules:** BR-002, BR-018, BR-019.
- **Permission:** —
- **Validation:** tanpa NaN/Infinity.
- **Acceptance Criteria:** AC-014; AC-015 (bagian batang).

## M7 — Konten: ide anak, nutrisi, peregangan
- **Purpose:** konten statis dan ceklis.
- **Scope:** F-10 (katalog + ceklis + "Ide Baru" acak), F-11, F-06 (timer 60 dtk).
- **Dependencies:** M0.
- **Input:** konten statis; centang.
- **Process:** `kid_checks`; acak ide.
- **Output:** halaman konten.
- **Business Rules:** BR-003, BR-004.
- **Permission:** —
- **Validation:** —
- **Acceptance Criteria:** AC-011, AC-015, AC-016.

## M8 — Pengingat
- **Purpose:** alarm lewat kalender HP.
- **Scope:** F-12: pilih jenis & jam, hasilkan .ics berulang.
- **Dependencies:** M0.
- **Input:** jam (bawaan OQ-1).
- **Process:** bangun ICS (escape, RRULE, VALARM).
- **Output:** file .ics terbuka di Kalender.
- **Business Rules:** FR-111.
- **Permission:** —
- **Validation:** jam valid.
- **Acceptance Criteria:** AC-017.

## M9 — Cadangan
- **Purpose:** data tidak hilang.
- **Scope:** F-13: ekspor/impor JSON (jejak GPS ikut, opsi mati, G-3; impor = ganti semua, batas 50 MB, diblokir saat merekam, D-22), pengingat cadangan, penyimpanan permanen.
- **Dependencies:** M1–M8 (dan diperluas di M11 untuk jejak).
- **Input:** seluruh data / file JSON.
- **Process:** serialisasi; impor = validasi → pratinjau → konfirmasi → transaksi.
- **Output:** file cadangan; data pulih.
- **Business Rules:** BR-021.
- **Permission:** PER-003.
- **Validation:** VAL-005.
- **Acceptance Criteria:** AC-018, AC-019.

## M10 — Cyclocomp: mesin rekam dan layar rekam
- **Purpose:** HP merekam gowes.
- **Scope:** FR-130…143, FR-145: izin, Wake Lock, pencarian GPS, filter, jeda otomatis, angka besar, simpan berkala, pemulihan, ringkasan selesai (tanpa peta dulu), simpan jadi `rides`.
- **Dependencies:** M1, M2 (Beranda "Mulai Gowes"), M9 (cadangan siap); **deploy pratinjau dibuat sebelum uji lapangan** (D-18).
- **Input:** aliran GPS; tombol Jeda/Selesai; jenis & kondisi.
- **Process:** state machine `WORKFLOW.md` bagian 2; BR-014…017.
- **Output:** gowes rekaman + `track_points`; muncul di riwayat/grafik/target.
- **Business Rules:** BR-006, BR-010, BR-014…017.
- **Permission:** PER-001, PER-002.
- **Validation:** VAL-001; filter GPS.
- **Acceptance Criteria:** AC-020, 021 (tanpa peta), 022, 024, 025, 026, 028, 029 · **uji lapangan nyata**.

## M11 — Cyclocomp: peta, detail jejak, ekspor GPX
- **Purpose:** melihat rute dan membawanya ke Strava.
- **Scope:** FR-135…137, 144, 146, 147: peta MapLibre di layar rekam dan detail, atribusi, ekspor GPX (+ potong 200 m), jejak ikut cadangan JSON.
- **Dependencies:** M10, M9.
- **Input:** `track_points`.
- **Process:** gambar jejak; bangun GPX; perluas ekspor JSON.
- **Output:** peta jejak; file GPX; cadangan lengkap.
- **Business Rules:** BR-024.
- **Permission:** tidak ada izin baru; permintaan peta keluar.
- **Validation:** GPX valid; karakter ter-escape.
- **Acceptance Criteria:** AC-021 (lengkap), AC-023, AC-027; AC-018 (dengan jejak) · **uji lapangan nyata**.

## M12 — Penyelesaian Beranda dan penyempurnaan v1
- **Purpose:** menyatukan Beranda sesuai Design Brief dan membersihkan pengalaman.
- **Scope:** Beranda final (sapaan, kesiapan, Mulai Gowes, progres, Catat), keadaan kosong/galat/sukses menyeluruh, aksesibilitas, banner versi baru, penyesuaian teks.
- **Dependencies:** M1–M11.
- **Input:** semuanya.
- **Process:** review terhadap Design Brief bagian 13–19.
- **Output:** v1 siap E2E baseline.
- **Business Rules:** semua.
- **Permission:** —
- **Validation:** —
- **Acceptance Criteria:** AC-001 (lengkap), AC-031; seluruh AC lulus regresi.

---

## Setelah modul selesai (fase berikutnya dalam pedoman)
E2E baseline (Gate 7) → Security/Red Team (Gate 8) → perbaikan keamanan → regresi → refactor → audit akhir (Gate 9) → UAT & rilis (Gate 10).

## Matriks keterlacakan (Fitur → Modul → AC)
F-01 → M2, M3, M12 → AC-001 · F-02 → M1 → AC-002…004 · F-03 → M2 → AC-005, 006 · F-04/05 → M3 → AC-007…010 · F-06 → M7 → AC-011 · F-07 → M5 → AC-012 · F-08 → M4 → AC-013 · F-09 → M6 → AC-014 · F-10 → M6, M7 → AC-015 · F-11 → M7 → AC-016 · F-12 → M8 → AC-017 · F-13 → M9 → AC-018, 019 · F-14 → M10, M11 → AC-020…029 · F-15 → M0 → AC-030 · NFR → M0, M12 → AC-031.
