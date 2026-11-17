# PROJECT CONTEXT — GowesSehat (sepedah-nugug)

Status: **GATE 1 DISETUJUI (2026-11-16)** — semua pertanyaan terbuka sudah dijawab
Tanggal: 2026-10-12 · Diperbarui: 2026-11-16 (mode cyclocomp + keputusan OQ-1 s/d OQ-14)
Sumber: obrolan discovery + folder `Referensi/` (Project Context lama, ringkasan GowesSehat, dokumen kebutuhan tools, prototipe `GowesSehat.html`).

Legenda: **[CONFIRMED]** diputuskan pengguna · **[ASSUMPTION]** asumsi, belum disetujui · **[RECOMMENDATION]** saran AI yang sudah disetujui atau menunggu persetujuan · **[OPEN]** pertanyaan terbuka.

---

## 1. Project Overview
GowesSehat adalah aplikasi web progresif (PWA) untuk satu pengguna, untuk memantau gowes, kebugaran harian, dan waktu bersama anak. Project ini membangun ulang prototipe satu-file HTML menjadi PWA yang rapi dan bisa di-deploy, ditambah tiga fitur baru. **[CONFIRMED]**

Repository: `https://github.com/nugugautomation-prog/Gowes-Nugug` (**publik**, D-17; sebelumnya tertulis privat `sepedah-nugug`). Folder kerja lokal `D:\Sepedahannn` belum berupa repo git.

## 2. Business Problem
- Pengguna ingin hidup lebih sehat dengan cara yang ringan dan sesuai kondisinya, bukan program yang membebani. **[CONFIRMED]**
- Suka bersepeda tetapi jarang melakukannya. **[CONFIRMED]**
- Strava gratis di Android tidak bisa ekspor file GPX/TCX, sehingga data harus disalin manual. **[CONFIRMED]**
- Prototipe lama: kode asli (React + Gemini) hilang; versi satu-file HTML saat ini tampilannya terlalu menumpuk. **[CONFIRMED]**

## 3. Business Goal
- Membantu pengguna rutin bergowes dan menjaga kebiasaan sehat harian tanpa merasa terbebani. **[CONFIRMED]**
- Memantau target jarak bulanan, keseimbangan waktu pribadi vs bareng anak, dan tren tubuh. **[CONFIRMED]**
- Ukuran keberhasilan: gowes 2x per minggu dan jurnal terisi 5 dari 7 hari. **[CONFIRMED]** (OQ-10)
- Membuat HP bisa berfungsi sebagai cyclocomp (komputer sepeda) untuk merekam gowes. **[CONFIRMED]**

## 4. Target Users
- Satu pengguna: pemilik project (ayah, anak usia 5 tahun/TK). Tidak ada multi-user, tidak ada login. **[CONFIRMED]**
- Perangkat utama: HP Android. **[CONFIRMED]** Penggunaan di komputer: tidak disebut **[OPEN, rendah]**.
- Jam kerja kantor 07:30–16:00; waktu luang mulai 16:30 dan akhir pekan. **[CONFIRMED]**
- Tidak makan dan tidak suka sayur; aplikasi tidak boleh memaksa atau mengusulkan sayur sebagai solusi utama. **[CONFIRMED]**
- Bahasa seluruh aplikasi: Indonesia sehari-hari. **[CONFIRMED]**

## 5. Current Process
- Gowes direkam di Strava gratis (Android). Tidak ada pencatatan lain, tidak ada data lama yang perlu dimigrasi. **[CONFIRMED]**
- Prototipe: pencatatan di browser (localStorage) lewat satu file HTML. Data prototipe tidak perlu dibawa. **[ASSUMPTION]**

## 6. Desired Process
Pengguna membuka aplikasi di HP, langsung bisa **mencatat gowes** dan **melihat progres target bulanan** (dua hal utama yang diminta di layar awal). **[CONFIRMED]** Hal ketiga di layar awal: status kesiapan gowes dan tombol Mulai Gowes. **[CONFIRMED]** Fitur lain tersedia tetapi tidak menumpuk di layar awal. **[CONFIRMED]**

## 7. Known Requirements

### 7.1 Fitur dari prototipe (dibangun ulang) **[CONFIRMED]**
1. **Catat gowes manual** dari Strava: tanggal, jarak (km), waktu bergerak, elevasi (m), kategori waktu (Hari Kerja / Sabtu Sore / Minggu Pagi), jenis gowes (Me-time / bareng anak), kondisi badan (emoji).
2. Metrik: jarak, waktu bergerak, elevasi, kecepatan rata-rata.
3. **Grafik tren 8 pekan** dengan pilihan metrik (Jarak/Elevasi/Waktu) dan garis target mingguan untuk jarak.
4. **Target jarak bulanan** yang bisa diganti (80/100/120/150 km di prototipe).
5. **Tips bonding anak 5 tahun**, katalog aktivitas dengan ceklis tersimpan. Tips AI bersifat opsional (lihat 7.3).
6. **Keseimbangan hidup** (Me-time vs bareng anak) — dipertahankan. **[CONFIRMED]** (OQ-3)
7. **Jurnal 30 detik**: kualitas tidur (segar/cukup/kurang), porsi buah serat, menit main bareng anak, plus indikator kesiapan gowes.
8. **Hidrasi**: target 2.500 ml, tombol cepat +250/+500 ml.
9. **Timer peregangan meja 60 detik**.
10. **Panduan nutrisi tanpa sayur** (4 pilar: buah berserat, karbohidrat kompleks, protein, elektrolit alami).
11. Navigasi bawah 4 tab di prototipe; struktur baru ditentukan di Design Brief.

### 7.2 Perubahan dari prototipe **[CONFIRMED]**
- Satu hari boleh ada **lebih dari satu gowes**.
- Data gowes bisa **diedit**, bukan hanya dihapus.
- Jurnal harian bisa **diisi untuk hari sebelumnya**.
- **Tampilan tidak boleh menumpuk**.
- Tombol **ekspor/impor cadangan** data (opsional dipakai).

### 7.3 Fitur baru (v1) **[CONFIRMED] ruang lingkup**, detail **[RECOMMENDATION]** disetujui pengguna ("setuju saran")
- **Pelacak tubuh**: berat badan, lingkar pinggang, mood (emoji). Ada **target berat ideal**. Mood harian; berat/pinggang mingguan atau kapan saja.
- **Checklist rutinitas**: pengguna bisa **menambah dan menghapus item sendiri**. Isi awal dan aturan reset **[OPEN]**.
- **Ringkasan mingguan**, dilihat kapan saja, minggu mulai **Senin**, dihitung otomatis: jumlah gowes, total km, elevasi, perbandingan minggu lalu; rata-rata tidur/buah/air; menit bareng anak; perubahan berat dan jarak ke target; mood dominan; persentase checklist. Komentar AI = opsional tambahan.
- **Pengingat**: masuk v1, dengan **Opsi 1 — lewat kalender/alarm HP** (tombol yang menghasilkan file kalender berulang; alarm dibunyikan Android). Jam pengingat untuk minum, catat jurnal, jadwal gowes **[OPEN]**.

### 7.3b Mode Cyclocomp (HP jadi komputer sepeda) — Change Control: F. New Feature
Diputuskan pengguna 2026-11-16. **[CONFIRMED]**
- **Rekam + layar nyala**, tetap PWA: HP dipasang di stang, layar dijaga menyala (Wake Lock). Tampil kecepatan, jarak, waktu bergerak, dan elevasi; hasil rekaman otomatis menjadi catatan gowes (menggantikan salin manual dari Strava, input manual tetap ada sebagai cadangan).
- **Peta**: rute/posisi ditampilkan di peta pada v1.
- **Sensor Bluetooth** (detak jantung, kadensi): ditunda, bukan v1.
- Rekaman GPS tidak berjalan andal saat layar dikunci/aplikasi di latar belakang; ini diterima sebagai batasan v1 (tidak dibungkus jadi aplikasi Android). **[ASSUMPTION]** karena pengguna memilih opsi A.
- Elevasi dari GPS HP kurang akurat dan bisa berbeda dari Strava. **[ASSUMPTION]**
- **Masuk v1**, dibangun sebagai modul terakhir v1 setelah GowesSehat dasar selesai. **[CONFIRMED]** (OQ-11, disetujui 2026-11-16)
- **Peta**: hanya lihat posisi dan jejak rute; tanpa rute tujuan dan arahan belok. **[CONFIRMED]** (OQ-12)
- **Peta online saja** (mis. OpenStreetMap), tanpa peta offline. Bila sinyal hilang, angka dan jejak tetap terekam; hanya gambar peta yang kosong. **[CONFIRMED]** (OQ-13)
- **Ekspor rekaman ke GPX** masuk v1, supaya bisa diunggah ke Strava lewat situs web. **[CONFIRMED]** (OQ-14)

### 7.4 AI
- "Bagus kalau ada, tapi harus gratis." AI bukan syarat v1. Bila tidak ada cara gratis yang andal tanpa server, v1 memakai ide statis. **[CONFIRMED]** untuk prinsip; mekanismenya **[OPEN]** (System Design).
- Fitur AI tidak boleh memberi diagnosis medis. **[ASSUMPTION]** (dari dokumen lama)

## 8. Business Rules
- **BR-A**: Kesiapan gowes 🟢/🟡/🔴 dari tidur (segar=2, cukup=1, kurang=0), buah ≥ 2 porsi (+1), air ≥ 2.000 ml (+1). Skor maksimum 4. Ambang di prototipe: skor ≥ 3 = siap, skor 2 = santai saja, skor < 2 = istirahat. **[RECOMMENDATION, disetujui]** (diserahkan pengguna ke AI). Kelayakan ambang dicek lagi di PRD.
- **BR-B**: Minggu dimulai Senin. **[CONFIRMED]**
- **BR-C**: Aplikasi tidak mengusulkan sayur sebagai solusi utama; sayur hanya boleh disebut sebagai opsi yang bisa ditolak. **[CONFIRMED]**
- **BR-D**: Saran kesehatan bersifat umum dan bukan nasihat medis. **[ASSUMPTION]**
- Aturan pencegahan duplikat gowes (mis. tanggal+jarak+waktu sama) — karena satu hari boleh banyak gowes, perlu diputuskan **[OPEN]**.

## 9. User Roles
Hanya satu peran: pengguna/pemilik. Tidak ada admin, tidak ada login. **[CONFIRMED]**

## 10. Constraints
- Biaya nol; hosting gratis. **[CONFIRMED]**
- Dirawat sendiri oleh pengguna dengan bantuan AI → arsitektur harus sederhana. **[CONFIRMED]**
- Tanpa server bila memungkinkan: situs statis (PWA) di Cloudflare Pages / Netlify / GitHub Pages, deploy dari GitHub. **[RECOMMENDATION, disetujui pengguna]**; pilihan host final di System Design.
- Data disimpan di perangkat dengan ekspor/impor cadangan; tidak ada sinkronisasi antar perangkat. **[CONFIRMED]**
- Offline tidak wajib. **[CONFIRMED]** (tetap bisa dipasang di layar utama — dikonfirmasi **[OPEN, rendah]**). Catatan: mode cyclocomp membuat ini perlu ditinjau lagi, karena sinyal sering hilang di jalan (lihat OQ-13).
- Input font ≥ 16px (cegah auto-zoom di HP), layar 360–420px, mode gelap bawaan, palet hijau neon (D-16; oranye prototipe dibatalkan).
- Strava gratis tidak bisa ekspor → tidak ada alur yang membutuhkan ekspor file Strava. **[CONFIRMED]**

## 11. Assumptions
1. Data prototipe lama tidak dimigrasi.
2. Satu HP Android adalah satu-satunya perangkat utama.
3. Fitur peringatan medis/disclaimer dipertahankan seperti prototipe.
4. Palet dan gaya visual prototipe menjadi titik awal desain.

## 12. Open Questions
| # | Pertanyaan | Dampak |
|---|---|---|
Keputusan 2026-11-16: pengguna menyetujui semua rekomendasi AI. Semua **[CONFIRMED]**.

| # | Pertanyaan | Keputusan |
|---|---|---|
| OQ-1 | Jam pengingat | Minum tiap 2 jam di jam kerja; jurnal 20:00; gowes Sabtu 16:30 dan Minggu 06:00 |
| OQ-2 | Hal ketiga di layar awal | Status kesiapan gowes (🟢/🟡/🔴) + tombol **Mulai Gowes** (cyclocomp) |
| OQ-3 | Batang keseimbangan Me-time vs bareng anak | Dipertahankan |
| OQ-4 | Frekuensi catat berat/pinggang | Bebas, dengan saran mingguan |
| OQ-5 | Checklist: isi awal dan reset | Reset harian; isi awal kosong atau 3 contoh yang bisa dihapus |
| OQ-6 | Duplikat gowes | Hanya peringatan bila tanggal, jarak, dan waktu sama persis; tidak diblokir |
| OQ-7 | Mekanisme AI | v1 pakai ide statis; AI fase berikutnya |
| OQ-8 | Host | Cloudflare Pages (Render.com tetap bisa) |
| OQ-9 | Bisa dipasang di layar utama | Ya, wajib (cyclocomp butuh layar penuh) |
| OQ-10 | Target keberhasilan | Gowes 2x/minggu; jurnal terisi 5 dari 7 hari |
| ~~OQ-11~~ | ~~Cyclocomp v1 atau nanti?~~ **SELESAI**: v1, modul terakhir | — |
| ~~OQ-12~~ | ~~Arti "navigasi"~~ **SELESAI**: posisi + jejak rute saja | — |
| ~~OQ-13~~ | ~~Peta offline?~~ **SELESAI**: online saja. Penyedia peta gratis dan batas pemakaiannya dipilih di System Design | System Design |
| ~~OQ-14~~ | ~~Ekspor GPX?~~ **SELESAI**: masuk v1 | — |

Catatan dokumen lama yang sudah usang: "Dokumen Kebutuhan Tools" masih memuat upload screenshot Strava, target sayur 1–2 porsi, dan coach yang membaca data. Itu **dibatalkan** oleh Project Context lama (input manual, tanpa sayur). Dokumen ini tidak dipakai sebagai sumber requirement.

## 13. Out of Scope (v1)
- Upload screenshot Strava dan impor GPX/TCX/FIT. **[CONFIRMED]**
- Sensor Bluetooth (detak jantung, kadensi). **[CONFIRMED]** (ditunda)
- Perekaman GPS di latar belakang saat layar mati / pembungkus aplikasi Android. **[ASSUMPTION]**
- Resep dan daftar belanja sayur. **[CONFIRMED]** (ditolak pengguna)
- Foto piring makan oleh AI. **[ASSUMPTION]**
- Sinkronisasi antar perangkat, akun, login. **[CONFIRMED]**
- Notifikasi push dari server. **[RECOMMENDATION]** (ditunda; hanya jika Opsi 1 terbukti kurang)
- Tren bulanan, lencana pencapaian. **[ASSUMPTION]** (fase berikutnya)
- Offline penuh sebagai persyaratan. **[CONFIRMED]**

## 14. Risks
| ID | Risiko | Mitigasi (usulan) |
|---|---|---|
| R-1 | Data hilang bila data browser dihapus atau HP diganti | Ekspor/impor cadangan, pengingat cadangan berkala |
| R-2 | Salah ketik data Strava manual | Fitur edit, validasi angka |
| R-3 | Tampilan menumpuk lagi setelah 3 fitur baru ditambah | Desain berbasis prioritas layar awal (Design Brief) |
| R-4 | AI gratis tidak andal atau butuh server/API key | AI opsional, fallback ide statis |
| R-5 | Pengingat lewat kalender kurang terasa terintegrasi | Dijelaskan jelas; opsi push sebagai fase lanjutan |
| R-6 | Pengguna berhenti memakai karena pencatatan terlalu berat | Input maksimal beberapa ketukan, target realistis |
| R-8 | Rekaman GPS berhenti bila layar terkunci atau aplikasi pindah ke latar belakang | Wake Lock, peringatan jelas di layar rekam, simpan titik berkala agar tidak hilang total |
| R-9 | Baterai HP cepat habis karena layar menyala + GPS | Mode layar redup/hemat, beri tahu pengguna |
| R-10 | Peta online butuh internet dan ada batas pemakaian penyedia peta gratis | Putuskan di OQ-13; pilih penyedia yang gratis tanpa kunci API |
| R-11 | Titik GPS banyak melebihi kapasitas localStorage | Pakai IndexedDB (dicatat untuk System Design) |
| R-7 | ~~Repo privat tidak terlihat AI~~ Gugur: repo publik. Risiko baru: isi dan riwayat Git terlihat semua orang | `.gitignore` untuk `Referensi/`, cadangan, jejak nyata; data uji palsu (D-17) |
