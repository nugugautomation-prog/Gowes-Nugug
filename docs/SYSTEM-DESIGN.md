# SYSTEM DESIGN — GowesSehat (sepedah-nugug)

Status: **GATE 4 DISETUJUI (2026-11-16)** — termasuk G-1 s/d G-4
Tanggal: 2026-11-16
Sumber: `PROJECT-CONTEXT.md`, `PRD.md` (Gate 2), `DESIGN-BRIEF.md` (Gate 3).
Dokumen pendamping: `DATA-MODEL.md`, `WORKFLOW.md`, `PERMISSION-MATRIX.md`, `BUSINESS-RULES.md`, `TECHNICAL-PLAN.md`, `MODULE-BREAKDOWN.md`, `DECISION-LOG.md`.
Legenda: **[CONFIRMED]** dari keputusan pengguna · **[RECOMMENDATION]** usulan AI yang perlu disetujui di Gate 4.

---

## 1. Architecture Overview
**Satu aplikasi yang berjalan sepenuhnya di HP. Tidak ada server aplikasi.** [CONFIRMED: tanpa server, gratis]

```
 HP Android (Chrome / PWA terpasang)
 ┌───────────────────────────────────────────────────────────┐
 │  Tampilan (React)  ── Lembar form, 5 tab, Layar Rekam     │
 │        │                                                  │
 │  Logika (fungsi murni, mudah diuji)                       │
 │   kesiapan · target · ringkasan · filter GPS · GPX · ICS  │
 │        │                                                  │
 │  Penyimpanan (IndexedDB lewat Dexie)                      │
 │   gowes · titik GPS · jurnal · hidrasi · tubuh · checklist│
 │        │                                                  │
 │  API perangkat: GPS · Wake Lock · Storage persist         │
 │  Service Worker: menyimpan "cangkang" aplikasi            │
 └───────────────┬───────────────────────────────────────────┘
                 │ hanya 1 hubungan keluar: gambar/gaya peta
                 ▼
        Penyedia peta gratis (OpenFreeMap)

 Hosting: GitHub ──auto build──► Cloudflare Pages (file statis, HTTPS)
```

Prinsip: (1) data tidak pernah meninggalkan HP, (2) logika perhitungan dipisah dari tampilan supaya bisa diuji, (3) satu jenis penyimpanan untuk semua data.

## 2. Data Model
Ringkasan: Gowes, Titik GPS, Rekaman Aktif, Jurnal, Hidrasi, Catatan Tubuh, Item Checklist, Hasil Checklist Harian, Ceklis Aktivitas Anak, Pengaturan. Rincian di **`DATA-MODEL.md`**.

## 3. Database Tables
Dipetakan menjadi *object store* IndexedDB (setara tabel). Daftar, kolom, indeks: `DATA-MODEL.md` bagian 2.

## 4. Relationships
- Gowes (rekaman) 1 — 1 Jejak GPS (banyak titik), dihapus bersamaan.
- Checklist: Item Checklist 1 — banyak Hasil Harian (salinan nama item per hari, B11).
- Jurnal, Hidrasi, Catatan Tubuh berdiri sendiri, kunci = tanggal.
Diagram: `DATA-MODEL.md` bagian 3.

## 5. Workflow
WF-01…WF-06 dari PRD diperinci di **`WORKFLOW.md`**, termasuk diagram status perekaman.

## 6. Status Transitions
Hanya perekaman gowes yang punya status: `siap → mencari_gps → merekam ↔ jeda → selesai_ringkasan → tersimpan | dibuang`, plus `terputus` untuk pemulihan. Aturan di `WORKFLOW.md` bagian 2.

## 7. Permission Matrix
Satu peran. Yang diatur adalah izin perangkat dan keamanan data lokal: **`PERMISSION-MATRIX.md`**.

## 8. Business Rules
BR-001…BR-009 dari PRD + aturan hitungan rinci (BR-010 dan seterusnya): **`BUSINESS-RULES.md`**.

## 9. Validation Rules
Dari PRD VAL-001…VAL-007 dengan angka final (OQ-P5 disetujui): `BUSINESS-RULES.md` bagian 5. Validasi dua lapis: di formulir, dan saat menyimpan ke penyimpanan (pelindung impor JSON).

## 10. Audit Trail
Tanpa pengguna ganda, jadi tidak ada audit pengguna. Tiap gowes menyimpan `source`, `createdAt`, `updatedAt`. Pengaturan menyimpan `lastBackupAt`, `lastImportAt`. [PRD bagian 18]

## 11. Authentication
**Tidak ada.** Tidak ada akun/login. [CONFIRMED]
Catatan risiko yang diterima: siapa pun yang memegang HP yang terbuka dapat melihat data. Kunci layar HP adalah pelindungnya. PIN aplikasi di luar lingkup v1. [RECOMMENDATION]

## 12. Authorization
**Tidak ada.** Satu pemilik. Isolasi data memanfaatkan sifat browser (data per alamat situs). Lihat `PERMISSION-MATRIX.md`.

## 13. API/Backend Responsibilities
**Tidak ada backend.** Tanggung jawab yang biasanya di server dipegang oleh aplikasi:
| Tanggung jawab | Pemegang |
|---|---|
| Validasi data | Lapisan logika aplikasi (sebelum menulis ke penyimpanan dan saat impor) |
| Perhitungan (kesiapan, target, ringkasan) | Fungsi murni di aplikasi |
| Penyimpanan | IndexedDB di HP |
| Cadangan | Ekspor/impor file JSON oleh pengguna |
| Pengingat | File kalender .ics yang dijalankan aplikasi Kalender HP |
Karena tidak ada server, "tombol disembunyikan = aman" tidak relevan; yang perlu diuji adalah validasi data impor dan ketahanan penyimpanan.

## 14. Storage
- **IndexedDB** untuk semua data (gowes, titik GPS, jurnal, dst.) lewat pustaka Dexie. **Alasan:** jejak GPS bisa ribuan titik; localStorage kecil (±5 MB) dan sinkron sehingga bisa membekukan layar. Satu jenis penyimpanan lebih sederhana daripada dua. [RECOMMENDATION] (R-11)
- Minta penyimpanan permanen (`navigator.storage.persist()`) agar browser tidak menghapus data saat penyimpanan HP penuh. [CONFIRMED B12]
- `localStorage` hanya untuk preferensi kecil (tema), bukan data.
- Estimasi: titik tiap ±5 detik ≈ 720 titik/jam ≈ 40 KB/jam. 100 gowes × 2 jam ≈ 8 MB. Aman.
- Skema berversi; migrasi otomatis saat aplikasi diperbarui.

## 15. Integrations
| Layanan | Untuk apa | Data yang keluar | Catatan |
|---|---|---|---|
| **OpenFreeMap** (peta vektor, gaya "Liberty") | Gambar peta di layar rekam & detail gowes | Permintaan gambar peta untuk area yang dilihat (alamat IP + area kasar) | Gratis, tanpa kunci, tanpa batas tayang yang dinyatakan layanannya; didanai donasi. URL gaya peta dijadikan **pengaturan** agar mudah diganti jika berhenti [RECOMMENDATION] |
| Cadangan peta: tile raster OpenStreetMap resmi | Hanya bila OpenFreeMap tidak tersedia | sama | Pemakaian ringan pribadi masih wajar, wajib cantumkan sumber, tidak boleh diunduh massal; dapat diblokir tanpa pemberitahuan |
| Strava | **Tidak ada integrasi.** Pengguna mengunggah file GPX sendiri lewat situs web Strava | — | PRD WF-06 |
| Kalender HP | Menerima file .ics | — | Aplikasi tidak tahu hasilnya |
Sumber peta wajib dicantumkan di layar peta (FR-137): "© OpenStreetMap contributors · OpenFreeMap".
Tidak ada analitik, iklan, atau pelacak pihak ketiga. [RECOMMENDATION]

## 16. Error Handling
Pola per galat (ERR-001…ERR-007 dari PRD) dan tampilan (Design Brief bagian 16) dirinci di `WORKFLOW.md` bagian 4. Prinsip: **tidak ada data yang hilang diam-diam**; setiap kegagalan menyimpan memberi pilihan Ekspor segera.

## 17. Technical Constraints
- Perekaman GPS hanya berjalan andal saat layar menyala dan aplikasi di depan (diterima, R-8, FR-143).
- Geolocation dan Wake Lock hanya jalan di **HTTPS** (hosting menyediakan).
- Elevasi dari GPS HP kurang akurat; dihaluskan, tidak identik dengan Strava (R-13).
- Peta butuh internet (OQ-13); rekaman tidak.
- Chromium Android adalah target: Brave (HP Motorola Edge 60 Fusion) uji utama, Chrome pembanding (D-23). Brave Shields/WebGL/penghapusan data saat keluar diperiksa di uji kelayakan M0.
- Satu HP; tidak ada sinkron antarperangkat.
- Tidak ada pemrosesan di latar belakang saat aplikasi ditutup.

## 18. Deployment
- Kode di GitHub `nugugautomation-prog/Gowes-Nugug` (**publik**, D-17). **Folder lokal `D:\Sepedahannn` belum berupa repo git**: `git init` / hubungkan ke repo di M0. Jalan lokal dulu (D-11 ditunda); deploy pratinjau sebelum uji lapangan M10 (D-18).
- **Cloudflare Pages** terhubung ke GitHub: setiap `push` ke cabang utama → build otomatis → situs HTTPS. [OQ-8 disetujui] Render.com static site juga bisa tanpa perubahan kode.
- Tidak ada variabel rahasia (tidak ada kunci API).
- Rilis = dorong ke cabang utama setelah Gate rilis; cabang lain mendapat pratinjau.
- Pembaruan aplikasi di HP: Service Worker memberi tahu "Versi baru tersedia — Muat ulang", tidak memuat ulang otomatis di tengah rekaman. [RECOMMENDATION]
Rincian: `TECHNICAL-PLAN.md`.

---

## Konsistensi dengan PRD (pemeriksaan)
Seluruh FR/BR/PER/AC ditinjau. **Satu celah ditemukan** dan diusulkan solusi; tidak ada konflik yang menghentikan:

| # | Celah | Usulan | Status |
|---|---|---|---|
| G-1 | BR-005/OQ-P4: Hari Kerja = Sen–Jum; Sabtu Sore = Sabtu mulai ≥ 12:00; Minggu Pagi = Minggu mulai < 12:00. Gowes Sabtu pagi atau Minggu sore **tidak punya kategori**, padahal kategori wajib diisi dan hanya ada 3 pilihan. | Tambah nilai ke-4 **"Lainnya"** (otomatis untuk Sabtu pagi, Minggu sore, dan hari libur kerja). Ini **perubahan kecil pada PRD (kelas B: Requirement Change)** | Menunggu persetujuan Gate 4 |
| G-2 | OQ-P3: ambang air "proporsional jam" belum berupa rumus. | Rumus di `BUSINESS-RULES.md` BR-011, ditandai [ASSUMPTION] dan dikalibrasi lewat uji | Menunggu persetujuan Gate 4 |
| G-3 | PRD hanya menyebut ekspor GPX terpisah (FR-123); isi cadangan JSON belum jelas apakah memuat jejak. | JSON **memuat jejak GPS** secara bawaan (≈ 8 MB untuk 100 gowes), agar peta tidak hilang saat ganti HP | Menunggu persetujuan Gate 4 |
| G-4 | PRD "Offline tidak wajib" vs Service Worker | Service Worker hanya menyimpan cangkang aplikasi agar bisa dibuka tanpa sinyal di jalur terpencil; **bukan** persyaratan, tanpa tile peta offline | Menunggu persetujuan Gate 4 |

## Keputusan untuk Gate 4
1. Arsitektur tanpa server; satu penyimpanan IndexedDB (bagian 1, 14).
2. Peta: OpenFreeMap, URL dapat diganti; cadangan OSM resmi (bagian 15).
3. Tumpukan teknologi (TECHNICAL-PLAN bagian 2).
4. Hosting Cloudflare Pages (bagian 18).
5. Empat celah G-1 s/d G-4 di atas.
6. Urutan modul di `MODULE-BREAKDOWN.md` (cyclocomp modul terakhir).
