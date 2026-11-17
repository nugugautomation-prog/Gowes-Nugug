# AUDIT — GowesSehat (Gate 5)

Tanggal: 2026-11-17
Status: **GATE 5 DISETUJUI (2026-11-17)** — K-1…K-7 disetujui pengguna ("setuju semua"); perubahan dokumen sudah diterapkan dan dicatat di DECISION-LOG D-16…D-24.
Cakupan: PROJECT-CONTEXT, BRAINSTORMING-SUMMARY, PRD, DESIGN-BRIEF, SYSTEM-DESIGN, DATA-MODEL, WORKFLOW, PERMISSION-MATRIX, BUSINESS-RULES, TECHNICAL-PLAN, MODULE-BREAKDOWN, DECISION-LOG.
Ditambah masukan baru pengguna 2026-11-17: repo publik, jalan lokal dulu, HP uji Motorola Edge 60 Fusion + Brave, warna hijau neon.
Legenda keparahan: **Tinggi** (bisa menggagalkan tujuan/risiko inti) · **Sedang** (perlu keputusan sebelum modul terkait) · **Rendah** (catat saja / perbaikan kecil).
Jenis perubahan mengikuti pedoman bagian 6 (A Bug Fix, B Requirement, C Design, D Security, E Refactor, F New Feature).

---

## 1. Hasil pemeriksaan keterlacakan (lulus)

| Pemeriksaan | Hasil |
|---|---|
| Semua AC-001…AC-031 punya modul pemilik di MODULE-BREAKDOWN | Lulus |
| Semua fitur F-01…F-15 terpetakan ke modul | Lulus |
| Setiap tabel DATA-MODEL punya requirement dan modul | Lulus |
| Semua ERR-001…007 punya penanganan di WORKFLOW bagian 4 | Lulus |
| Urutan dependensi modul (M0→M12) tidak melingkar | Lulus |
| Aturan BR-003 (tanpa sayur) tertulis di konten dan AC-016 | Lulus |
| Daftar uji keamanan (PERMISSION-MATRIX bagian 5) bisa dipetakan ke TEST-PLAN | Lulus (TEST-PLAN belum ada, lihat C-5) |

Tidak ada requirement yatim dan tidak ada konflik antar-dokumen yang membatalkan keputusan yang sudah Anda setujui.

---

## 2. Temuan A — dari masukan terbaru Anda (perubahan lingkungan)

### A-1 Warna hijau neon menggantikan oranye · Sedang · Jenis C (Design Change)
- **Dampak dokumen:** DESIGN-BRIEF bagian 20, PRD NFR-003, PROJECT-CONTEXT bagian 10 (semuanya menyebut oranye `#FC5200`).
- **Masalah nyata yang perlu diputuskan:**
  1. Hijau neon **tidak terbaca sebagai teks di latar putih** (kontras sekitar 1,3:1; syarat 4,5:1). Pada latar gelap sangat baik (sekitar 15:1).
  2. Hijau juga dipakai sebagai warna status **"siap gowes 🟢"**. Aksen merek dan status jadi bertabrakan.
- **Rekomendasi [RECOMMENDATION]:**
  - **Mode gelap jadi bawaan**, neon paling cocok di sini dan hemat baterai layar OLED (Edge 60 Fusion memakai layar pOLED).
  - Neon hanya untuk **isi tombol/aksen** dengan teks gelap di atasnya; di tema terang, teks/ikon hijau memakai hijau lebih tua.
  - Usulan token (angka final disetel saat M0 lewat uji kontras):

    | Token | Gelap (bawaan) | Terang |
    |---|---|---|
    | Aksen (isi tombol) | `#39FF14` | `#39FF14` |
    | Teks di atas aksen | `#07140A` | `#07140A` |
    | Hijau teks/ikon | `#39FF14` | `#0B7A2B` |
    | Latar | `#0C100D` | `#F4F7F4` |
    | Kartu | `#151B16` | `#FFFFFF` |
    | Teks | `#EAF2EB` | `#142016` |
    | Teks redup | `#97A89A` | `#5B6B5E` |
    | Garis | `#243027` | `#DCE5DD` |
    | Status santai / istirahat | kuning `#FFC53D` / merah `#FF5C5C` | kuning `#8A6100` / merah `#C62828` |

  - Status kesiapan **selalu ikon + teks** (✓ Siap / ~ Santai / ! Istirahat), jadi tidak bergantung warna; "siap" boleh tetap hijau karena tampil sebagai lencana, bukan tombol.
  - Layar rekam: angka putih/neon di latar hitam (kontras tertinggi, sesuai NFR-007).

### A-2 Repo sekarang publik dan namanya berbeda · Sedang · Jenis D (Security) + dokumentasi
- Dokumen menulis repo privat `sepedah-nugug`; kenyataannya **publik** `nugugautomation-prog/Gowes-Nugug`.
- Akibat: risiko T-7 (AI tak bisa membaca repo privat) gugur; tetapi muncul **risiko privasi baru**: apa pun yang di-commit terlihat semua orang dan tetap ada di riwayat Git walau dihapus.
- **Rekomendasi:**
  1. **Jangan commit** folder `Referensi/` (berisi profil pribadi: anak, jam kerja, kebiasaan) dan file cadangan/jejak GPS nyata. Masukkan ke `.gitignore` di M0.
  2. Data uji (jejak GPS, jurnal) **selalu data palsu** (lokasi fiktif, bukan rumah/rute asli).
  3. Folder `docs/` boleh publik? Isinya memuat data keluarga ringan (anak 5 tahun, jam kerja). Putuskan: ikut di-commit, atau ditaruh di luar repo. **Rekomendasi: ikut di-commit**, karena memudahkan AI melanjutkan kerja; saya akan tinjau ulang sebelum push pertama dan menghapus detail yang terlalu pribadi.
  4. Tidak ada rahasia/kunci API (sudah begitu di desain), jadi publik aman dari sisi kredensial.
- **Izin Git:** pedoman bagian 8 melarang commit otomatis kecuali diminta. Anda menulis "nanti project di git commit and push ke sini". Perlu dipastikan batasnya (lihat keputusan K-2).

### A-3 Browser uji adalah Brave, bukan Chrome · Sedang · Jenis C (batasan teknis)
- PRD bagian 21 dan SYSTEM-DESIGN bagian 17 menyebut Chrome sebagai target. Brave berbasis Chromium, jadi API yang dipakai (Geolocation, Wake Lock, IndexedDB, Service Worker, instalasi PWA) pada dasarnya sama, tetapi Brave punya perilaku sendiri yang **belum terbukti** untuk kasus kita:
  - **Brave Shields** (blokir pelacak, perlindungan *fingerprinting*) dapat memengaruhi permintaan peta ke pihak ketiga dan rendering WebGL yang dipakai MapLibre.
  - Pengaturan "hapus data saat keluar" (bila aktif) menghapus IndexedDB → data hilang.
  - Perilaku `navigator.storage.persist()` dan pemasangan PWA di Brave Android perlu diperiksa langsung.
- **Rekomendasi:** perbarui target menjadi "Chromium Android (Brave sebagai uji utama; Chrome sebagai pembanding)". Tambah **uji kelayakan singkat di HP** pada akhir M0 (halaman uji: GPS, Wake Lock, persist, Service Worker, instalasi, WebGL peta, unduh .ics/.gpx). Hasilnya menentukan apakah risiko T-1/T-4 dan R-8 aman sebelum M10.

### A-4 "Jalan lokal dulu" vs HP: konteks aman (secure context) · **Tinggi** untuk M10/M11 · Jenis C
- Geolocation, Wake Lock, Service Worker, dan instalasi PWA **hanya jalan di HTTPS atau `localhost`**. Membuka `http://192.168.x.x:5173` dari HP lewat Wi-Fi **tidak dianggap aman** → fitur-fitur itu mati, padahal itulah inti cyclocomp.
- **Rekomendasi (urut):**
  1. **`adb reverse`** (kabel USB + Debugging USB aktif di HP): membuat `localhost:5173` di HP menunjuk ke komputer. Dianggap aman, tidak butuh internet, tidak butuh deploy. Butuh `adb` terpasang (saya cek di M0) dan mengaktifkan Opsi Pengembang di HP.
  2. Cadangan: terowongan HTTPS sementara (mis. Cloudflare quick tunnel) bila kabel tidak praktis.
  3. Uji fungsional harian (M1–M9): cukup di Brave desktop dengan emulasi HP, lalu cek di HP lewat `adb reverse`.
- Playwright memakai GPS palsu, jadi uji otomatis tidak terpengaruh.

### A-5 Uji lapangan M10/M11 tidak bisa dengan server lokal · **Tinggi** (jadwal) · Jenis C
- Uji lapangan (bersepeda sungguhan) menuntut aplikasi hidup di HP **tanpa komputer**. Dengan `adb reverse` atau server lokal, aplikasi mati begitu kabel/komputer lepas. Service Worker menyimpan cangkang saja dan baru ada setelah pernah dimuat dari origin yang sama.
- Ini **bertabrakan** dengan keputusan "deploy kalau sudah jadi" (D-11) khusus untuk M10/M11.
- **Rekomendasi:** keputusan "deploy belakangan" tetap berlaku untuk M0–M9. **Sebelum uji lapangan M10**, lakukan satu **deploy pratinjau** (Cloudflare Pages atau GitHub Pages) dari cabang modul. Itu bukan rilis (Gate 10), hanya agar HP bisa memuat aplikasi di luar rumah. Putuskan di keputusan K-3; boleh ditunda sampai M10 mulai.

---

## 3. Temuan B — celah logika/desain pada dokumen yang sudah disetujui

### B-1 Poin air "gratis" di pagi hari · Sedang · Jenis A/B (BR-011)
- Rumus `ambangAir(jam) = 2000 × clamp((jam−07:00)/(19:00−07:00), 0, 1)`: sebelum 07:00 ambangnya **0**, jadi `ml ≥ 0` selalu benar → pengguna dapat +1 skor tanpa minum setetes pun. Sekitar 07:30 ambangnya hanya ±83 ml.
- Ini langsung memengaruhi **gowes Minggu 06:00** (jam pengingat bawaan FR-111): kesiapan terlalu optimis.
- **Pilihan:**
  - (a) **Sebelum jam 11:00, poin air memakai total hidrasi kemarin** (≥ 2.000 ml); setelah itu memakai rumus proporsional hari ini. **[Rekomendasi]**
  - (b) Sebelum jam 11:00 poin air tidak dinilai; skor dihitung dari maksimum 3 dan ambang disesuaikan.
  - (c) Biarkan (tidak disarankan).
- Dampak: BUSINESS-RULES BR-011, uji unit M3. Diputuskan sebelum M3.

### B-2 Jeda otomatis bisa gagal karena GPS "bergetar" saat diam · **Tinggi** · Jenis B (BR-014/015)
- BR-014 mendeteksi diam dari "kecepatan < 2 km/jam selama 5 dtk", tetapi tidak menyebut **dari mana kecepatan diambil**. Kecepatan yang dihitung dari selisih posisi dua titik per 5 detik, dengan GPS yang boleh meleset hingga 30 m, bisa menunjukkan 3–20 km/jam padahal sepeda berhenti di lampu merah → jeda tidak aktif, jarak bertambah palsu (AC-022 gagal).
- **Rekomendasi:** tambahkan aturan: (1) pakai `coords.speed` (Doppler) bila tersedia dan akurat, bila `null` pakai kecepatan hasil jarak rata-rata beberapa detik; (2) pergeseran antar-titik **lebih kecil dari akurasi titik** dianggap diam; (3) semua ambang berupa konstanta yang mudah diubah; (4) uji unit dengan data jitter sintetis, lalu kalibrasi di uji lapangan. Dicatat sebagai risiko T-1 yang **paling mungkin terjadi**.

### B-3 Jarak dihitung dari titik yang sudah dijarangkan · Sedang · Jenis B (BR-015)
- Jika jarak hanya dihitung dari titik yang disimpan tiap ±5 detik, tikungan terpotong dan jarak cenderung **lebih kecil** beberapa persen dibanding Strava.
- **Rekomendasi:** hitung jarak dari **semua titik valid** (≈1 per detik) di memori, lalu **jarangkan hanya untuk disimpan**. Cuma perlu satu kalimat tambahan di BR-015.

### B-4 Tombol Kembali tidak bisa benar-benar "ditahan" · Sedang · Jenis C (DESIGN-BRIEF bagian 4)
- Di PWA, tombol/gestur Kembali Android dapat dicegat dengan trik riwayat (pushState + popstate) untuk menampilkan konfirmasi. Tetapi **gestur ke Beranda HP, pindah aplikasi, atau penutupan oleh sistem tidak bisa dicegah**; saat itu GPS bisa berhenti.
- **Rekomendasi:** ubah kata-kata menjadi "Kembali dicegat dengan konfirmasi **sejauh browser mengizinkan**; kehilangan akibat penutupan paksa ditangani lewat pemulihan (FR-139)". AC-024 dan AC-028 sudah menutupnya; hanya teks Design Brief yang perlu dibuat jujur.

### B-5 Aturan impor belum tegas · Sedang · Jenis B (FR-120, VAL-005)
- Tidak jelas apakah impor **mengganti seluruh data** atau **menggabungkan**. Data model menyiratkan "mengganti semua".
- **Rekomendasi:** nyatakan eksplisit **"Ganti semua data"** (pratinjau menampilkan jumlah data lama vs baru); tentukan **batas ukuran** (mis. 50 MB); **impor diblokir saat ada rekaman aktif**; wajib Zod per baris titik GPS.

### B-6 CSP perlu menyesuaikan MapLibre, dan lokal tidak menegakkan CSP · Rendah · Jenis D
- MapLibre memakai Web Worker dari `blob:` dan gambar `data:`/`blob:` → CSP perlu `worker-src 'self' blob:` dan `img-src 'self' data: blob:` selain `connect-src` ke domain OpenFreeMap. `_headers` Cloudflare hanya berlaku saat di-deploy, tidak di server pengembangan.
- **Rekomendasi:** catat di TECHNICAL-PLAN bagian 6; tambahkan `<meta http-equiv>` atau uji lewat `vite preview` dengan header untuk memverifikasi CSP secara lokal di M11.

### B-7 File kalender (.ics) mungkin tidak membunyikan alarm sesuai VALARM · Sedang · risiko R-5
- Beberapa aplikasi kalender Android (termasuk Google Kalender) **cenderung mengabaikan `VALARM`** pada acara yang diimpor dan memakai pengingat bawaan kalender. Saya tidak bisa membuktikannya dari sini; harus dicoba di HP Anda.
- **Rekomendasi:** M8 mencakup uji nyata di HP; jika alarm tidak sesuai, teks petunjuk di aplikasi menjelaskan cara mengatur pengingat bawaan kalender. Fitur tetap berguna sebagai jadwal berulang.

### B-8 Kolom `eleRaw` hanya disebut sekilas · Rendah · Jenis A (DATA-MODEL)
- `track_points.ele` dijelaskan "mentah disimpan di `eleRaw`", tetapi kolom `eleRaw` tidak ada di tabel maupun format cadangan JSON.
- **Rekomendasi:** hapus `eleRaw` (simpan satu nilai `ele` yang sudah dihaluskan saat finalisasi) agar sederhana; elevasi mentah cukup di memori selama merekam.

### B-9 Angka dengan koma/titik · Rendah · Jenis B (NFR-004, form)
- Keyboard desimal Android bisa mengeluarkan `.` atau `,` tergantung bahasa HP. Penguraian angka harus menerima **keduanya** dan menampilkan koma. **Rekomendasi:** satu fungsi `parseAngka` + uji unit di M1.

### B-10 Izin penyimpanan permanen tidak berupa dialog · Rendah · Jenis A (PER-003)
- Di browser Chromium `navigator.storage.persist()` dijawab otomatis (bukan pop-up), berdasarkan heuristik penggunaan. Hasilnya tampil sebagai "aktif/tidak". **Rekomendasi:** tampilkan status di Lainnya → Cadangan ("Penyimpanan terlindungi: ya/tidak") dan jangan menjanjikan dialog.

### B-11 Pekan sebagian pada garis target · Rendah (informasi)
- Pekan yang hanya memuat 1–2 hari milik bulan itu tetap menerima garis target penuh (target ÷ jumlah pekan beririsan). Ini **sudah Anda setujui (B10)**; dicatat supaya tidak terkejut saat melihat grafik. Tidak ada perubahan.

---

## 4. Temuan C — kerapian dokumen

| # | Temuan | Perbaikan |
|---|---|---|
| C-1 | DESIGN-BRIEF masih berstatus "DRAFT — menunggu Gate 3", padahal DECISION-LOG D-07 mencatat disetujui | Ubah status header |
| C-2 | PROJECT-CONTEXT, SYSTEM-DESIGN bagian 18, TECHNICAL-PLAN T-7: repo "privat `sepedah-nugug`" | Ganti ke publik `Gowes-Nugug`; hapus T-7 |
| C-3 | PRD bagian 21, SYSTEM-DESIGN bagian 17 menyebut "Chrome" | Ganti sesuai A-3 |
| C-4 | MODULE-BREAKDOWN M0 menyebut PER-003 diminta di M0, DATA-MODEL menyebut "saat pertama ada data" | Putuskan: M0 hanya menyiapkan fungsi; permintaan dipicu saat data pertama tersimpan |
| C-5 | `TEST-PLAN.md` dan `DEVELOPMENT-PLAN.md` belum ada (dirujuk di PRD bagian 16) | Dibuat di fase 07 |
| C-6 | Folder `prompts/` baru sampai 05; fase 06+ belum punya file prompt | Tidak menghalangi; dibuat bila dibutuhkan |

---

## 5. Perubahan dokumen yang akan saya terapkan setelah Anda setuju
Semuanya ditulis ke DECISION-LOG sebagai D-16 dan seterusnya.
1. Palet hijau neon: DESIGN-BRIEF bagian 20, PRD NFR-003, PROJECT-CONTEXT bagian 10 (A-1).
2. Repo/privasi: PROJECT-CONTEXT, SYSTEM-DESIGN 18, TECHNICAL-PLAN 8 dan T-7, aturan `.gitignore` (A-2, C-2).
3. Target browser Brave/Chromium + uji kelayakan di akhir M0 (A-3, C-3).
4. Cara uji lokal di HP (`adb reverse`) dan deploy pratinjau sebelum M10 (A-4, A-5).
5. Tambahan aturan BR-011 (B-1), BR-014/015 (B-2, B-3), impor (B-5), CSP (B-6), DATA-MODEL `eleRaw` (B-8), teks Kembali (B-4).
6. Rapikan status/header (C-1…C-4).

## 6. Keputusan yang saya butuhkan (Gate 5)

| # | Keputusan | Rekomendasi AI | Dibutuhkan sebelum |
|---|---|---|---|
| K-1 | Setujui arah palet hijau neon, mode gelap bawaan, teks gelap di atas neon, status pakai ikon + teks (A-1) | Setuju | M0 |
| K-2 | Batas izin Git: commit per modul oleh saya setelah Anda bilang **COMMIT**, push hanya jika Anda bilang **PUSH**; `Referensi/` tidak masuk repo; `docs/` ikut (A-2) | Setuju | M0 |
| K-3 | Deploy pratinjau (bukan rilis) sebelum uji lapangan M10 (A-5) | Setuju, dikerjakan saat M10 mulai | M10 |
| K-4 | Cara uji di HP: `adb reverse` lewat kabel USB (A-4); Anda aktifkan Opsi Pengembang + Debugging USB | Setuju | M0 (akhir) |
| K-5 | Perbaikan poin air pagi: pilihan (a) pakai total kemarin sebelum 11:00 (B-1) | (a) | M3 |
| K-6 | Tambahan aturan jeda otomatis dan jarak (B-2, B-3) | Setuju | M10 |
| K-7 | Impor = "ganti semua data", batas 50 MB, diblokir saat merekam (B-5) | Setuju | M9 |

K-1 s/d K-4 dibutuhkan agar M0 bisa mulai. K-5 s/d K-7 bisa diputuskan nanti saat modulnya tiba, tetapi lebih aman disetujui sekarang bersama.

## 7. Putusan audit
**Gate 5: LULUS BERSYARAT.**
Tidak ada temuan yang membatalkan arsitektur atau urutan modul. Syaratnya: K-1 sampai K-4 disetujui (untuk memulai M0). Risiko terbesar yang tersisa adalah **perilaku GPS nyata** (B-2, A-4, A-5), dan itu memang sudah diposisikan sebagai modul terakhir dengan uji lapangan.
Langkah berikutnya setelah persetujuan: fase 07 (DEVELOPMENT-PLAN + TEST-PLAN), lalu Gate 6 untuk M0.
