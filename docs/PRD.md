# PRD — GowesSehat (sepedah-nugug)

Status: **GATE 2 DISETUJUI (2026-11-16)** — semua [ASSUMPTION] dan usulan OQ-P1 s/d OQ-P7 disetujui pengguna ("setuju semua"). Emoji (OQ-P6) dari prototipe: kondisi badan 😄 😐 😫.
Tanggal: 2026-11-16
Sumber: `docs/PROJECT-CONTEXT.md` (Gate 1 disetujui), `docs/BRAINSTORMING-SUMMARY.md` (B1–B12 disetujui).

Legenda: **[CONFIRMED]** diputuskan pengguna · **[ASSUMPTION]** asumsi AI, perlu persetujuan di Gate 2 · **[OPEN]** belum diputuskan (lihat bagian 23).
Tanpa label = turunan langsung dari keputusan yang sudah [CONFIRMED].

---

## 1. Product Overview
GowesSehat adalah PWA satu pengguna untuk HP Android: memantau gowes, kebugaran harian, tubuh, dan waktu bersama anak (5 tahun), plus **mode cyclocomp** yang mengubah HP di stang menjadi perekam gowes (GPS, peta, ekspor GPX). Tanpa server, tanpa login, data tersimpan di HP, biaya nol.

## 2. Problem Statement
- Pengguna suka bersepeda tapi jarang, dan ingin hidup lebih sehat tanpa program yang membebani.
- Strava gratis di Android tidak bisa ekspor GPX/TCX; data harus disalin manual.
- Prototipe satu-file HTML tampilannya menumpuk dan kode aslinya hilang.

## 3. Goals
- G-1: Pengguna rutin gowes **2x per minggu**. **[CONFIRMED]**
- G-2: Jurnal harian terisi **5 dari 7 hari**. **[CONFIRMED]**
- G-3: Memantau target jarak bulanan, keseimbangan me-time vs bareng anak, dan tren tubuh. **[CONFIRMED]**
- G-4: HP dapat merekam gowes sendiri sehingga tak perlu menyalin dari Strava. **[CONFIRMED]**
- G-5: Layar tidak menumpuk; pencatatan harian beberapa ketukan.

## 4. Non Goals
Lihat bagian 20 (Out of Scope).

## 5. Target Users
Satu pengguna (ayah, anak usia 5 tahun). HP Android. Kantor 07:30–16:00, luang mulai 16:30 dan akhir pekan. Tidak makan/suka sayur. Bahasa Indonesia sehari-hari.

## 6. User Roles
Satu peran: **Pemilik**. Tidak ada admin, login, atau multi-user.

## 7. Features

| ID | Fitur | Modul |
|---|---|---|
| F-01 | Layar awal | Beranda |
| F-02 | Catat gowes manual (tambah, edit, hapus; boleh banyak per hari) | Gowes |
| F-03 | Metrik, grafik tren 8 pekan, target bulanan | Gowes |
| F-04 | Jurnal 30 detik + kesiapan gowes | Kebugaran |
| F-05 | Hidrasi | Kebugaran |
| F-06 | Timer peregangan 60 detik | Kebugaran |
| F-07 | Pelacak tubuh (berat, pinggang, mood, target berat ideal) | Tubuh |
| F-08 | Checklist rutinitas | Rutinitas |
| F-09 | Ringkasan mingguan | Ringkasan |
| F-10 | Ide kegiatan bareng anak + keseimbangan hidup | Anak |
| F-11 | Panduan nutrisi tanpa sayur | Nutrisi |
| F-12 | Pengingat via kalender HP | Pengingat |
| F-13 | Cadangan: ekspor/impor JSON, pengingat cadangan | Data |
| F-14 | **Mode cyclocomp**: rekam GPS, peta, jeda otomatis, pemulihan, ekspor GPX | Cyclocomp |
| F-15 | Pemasangan di layar utama (installable PWA) | Platform |

## 8. Functional Requirements

### F-01 Layar awal
- FR-001 Layar awal menampilkan: (a) tombol **Mulai Gowes** (F-14), (b) progres target bulanan, (c) status kesiapan gowes 🟢/🟡/🔴/netral. **[CONFIRMED]**
- FR-002 Tombol **Catat Gowes** (manual) tersedia di layar awal. **[CONFIRMED]** (dua hal utama: catat gowes + progres bulanan)
- FR-003 Fitur lain diakses lewat navigasi bawah, bukan menumpuk di layar awal. Pembagian tab final di Design Brief. **[CONFIRMED]**

### F-02 Catat gowes manual
- FR-010 Form: tanggal, jarak (km), waktu bergerak, elevasi (m), kategori waktu (Hari Kerja / Sabtu Sore / Minggu Pagi / Lainnya; "Lainnya" ditambahkan di Gate 4, G-1), jenis gowes (Me-time / Bareng anak), kondisi badan (emoji), catatan opsional.
- FR-011 Satu hari boleh memiliki lebih dari satu gowes.
- FR-012 Gowes manual dapat diedit di semua kolom dan dihapus (dengan konfirmasi).
- FR-013 Kecepatan rata-rata dihitung otomatis (jarak ÷ waktu bergerak), tidak diinput.
- FR-014 Peringatan (bukan blokir) bila tanggal, jarak, dan waktu sama persis dengan gowes lain. **[CONFIRMED]** (OQ-6)
- FR-015 Kategori waktu terisi otomatis dari tanggal/jam, tetapi bisa diganti. **[ASSUMPTION]** untuk gowes manual (B4 menetapkannya untuk rekaman).

### F-03 Metrik, grafik, target
- FR-020 Metrik: jarak, waktu bergerak, elevasi, kecepatan rata-rata.
- FR-021 Grafik batang 8 pekan; pilihan metrik Jarak/Elevasi/Waktu; garis target mingguan hanya untuk Jarak.
- FR-022 Target bulanan berupa angka bebas, dengan 4 tombol cepat 80/100/120/150 km. **[CONFIRMED]** (B10)
- FR-023 Garis target mingguan = target bulanan ÷ jumlah pekan kalender (Senin–Minggu) di bulan itu. **[CONFIRMED]** (B10)
- FR-024 Progres bulanan: total km bulan berjalan, persentase terhadap target.

### F-04 Jurnal & kesiapan gowes
- FR-030 Jurnal harian: kualitas tidur (segar/cukup/kurang), porsi buah serat, menit main bareng anak.
- FR-031 Jurnal dapat diisi untuk hari sebelumnya. **[CONFIRMED]**
- FR-032 Kesiapan gowes dihitung dengan BR-001. Tidur dan buah dari jurnal **kemarin**, air dari hari **ini**. Jurnal kemarin kosong → "Belum ada data" (netral). **[CONFIRMED]** (B8)

### F-05 Hidrasi
- FR-040 Target 2.500 ml/hari; tombol cepat +250 dan +500 ml; dapat dikoreksi (kurangi) bila salah tekan. **[ASSUMPTION]** untuk koreksi.
- FR-041 Hidrasi dicatat per hari; reset otomatis pada hari baru.

### F-06 Peregangan
- FR-050 Timer 60 detik dengan panduan gerakan leher, bahu, pergelangan tangan, pinggul.

### F-07 Pelacak tubuh
- FR-060 Catat berat badan (kg), lingkar pinggang (cm), mood (emoji).
- FR-061 Mood umumnya harian; berat/pinggang bebas kapan saja, dengan saran mingguan. **[CONFIRMED]** (OQ-4)
- FR-062 Target berat ideal dapat diatur; tampilkan jarak ke target.
- FR-063 Riwayat dapat diedit dan dihapus. **[ASSUMPTION]**

### F-08 Checklist rutinitas
- FR-070 Pengguna menambah dan menghapus item sendiri. **[CONFIRMED]**
- FR-071 Reset harian; isi awal kosong atau 3 contoh yang bisa dihapus. **[CONFIRMED]** (OQ-5)
- FR-072 Hasil per hari disimpan (item yang ada & yang selesai). Menghapus item hanya memengaruhi hari ke depan. **[CONFIRMED]** (B11)

### F-09 Ringkasan mingguan
- FR-080 Dapat dibuka kapan saja; minggu mulai Senin; dihitung otomatis.
- FR-081 Isi: jumlah gowes, total km, elevasi, perbandingan minggu lalu; rata-rata tidur/buah/air; menit bareng anak; perubahan berat dan jarak ke target; mood dominan; persentase checklist.
- FR-082 Data kosong → "belum ada data" (tidak membagi nol). Minggu berjalan berlabel "baru N dari 7 hari". Perbandingan memakai rata-rata per hari/per gowes. **[CONFIRMED]** (B9)
- FR-083 Komentar AI tidak ada di v1; komentar memakai kalimat statis berdasarkan angka. **[ASSUMPTION]**

### F-10 Anak & keseimbangan
- FR-090 Katalog ide aktivitas anak 5 tahun dengan ceklis tersimpan; tips statis (tanpa AI di v1). **[CONFIRMED]** (OQ-7)
- FR-091 Tombol "Ide Baru" menampilkan ide statis lain secara acak. **[ASSUMPTION]**
- FR-092 Batang keseimbangan Me-time vs Bareng anak, dihitung dari jenis gowes. **[CONFIRMED]** (OQ-3)

### F-11 Nutrisi
- FR-100 Panduan 4 pilar: buah kaya serat, karbohidrat kompleks, protein, elektrolit alami. Sayur tidak pernah menjadi solusi utama (BR-003).

### F-12 Pengingat
- FR-110 Tombol yang menghasilkan file kalender berulang (.ics) agar alarm dibunyikan oleh HP. **[CONFIRMED]**
- FR-111 Jam bawaan: minum tiap 2 jam di jam kerja; jurnal 20:00; gowes Sabtu 16:30 dan Minggu 06:00. **[CONFIRMED]** (OQ-1). Jam minum eksak (09:00, 11:00, 13:00, 15:00) **[ASSUMPTION]**.
- FR-112 Pengguna dapat menyesuaikan jam sebelum membuat file. **[ASSUMPTION]**

### F-13 Cadangan
- FR-120 Ekspor seluruh data ke satu file JSON dan impor kembali (dengan konfirmasi sebelum menimpa).
- FR-121 Pengingat cadangan tiap 2 minggu atau setelah 10 gowes baru. **[CONFIRMED]** (B12)
- FR-122 Aplikasi meminta izin penyimpanan permanen dari browser. **[CONFIRMED]** (B12)
- FR-123 Jejak GPS diekspor terpisah sebagai GPX (lihat FR-146).

### F-14 Mode cyclocomp
- FR-130 **Mulai Gowes** meminta izin lokasi, menjaga layar tetap menyala (Wake Lock), lalu mulai merekam.
- FR-131 Layar rekam menampilkan angka besar: kecepatan, jarak, waktu bergerak, elevasi; plus tombol **Jeda** dan **Selesai** besar. Tanpa form atau teks panjang saat bergerak. **[CONFIRMED]** (B5)
- FR-132 Pengingat keselamatan "Jangan mengoperasikan HP sambil mengayuh" tampil sekali sebelum mulai. **[CONFIRMED]** (B5)
- FR-133 **Jeda otomatis** saat hampir tidak bergerak; waktu bergerak hanya menghitung saat bergerak. **[CONFIRMED]** (B2). Ambang kecepatan **[OPEN]**.
- FR-134 Titik GPS berakurasi buruk dibuang; elevasi dihaluskan. **[CONFIRMED]** (B2). Ambang akurasi **[OPEN]**.
- FR-135 Peta menampilkan posisi saat ini dan jejak rute yang sudah ditempuh; **tanpa** rute tujuan dan arahan belok. **[CONFIRMED]** (OQ-12)
- FR-136 Peta online saja; bila sinyal hilang, angka dan jejak tetap terekam, hanya gambar peta kosong. **[CONFIRMED]** (OQ-13)
- FR-137 Sumber peta dicantumkan di layar peta. **[CONFIRMED]** (B7)
- FR-138 Titik GPS disimpan berkala ke penyimpanan HP selama merekam. **[CONFIRMED]** (B1). Interval **[OPEN]**.
- FR-139 Saat aplikasi dibuka dan ada rekaman belum selesai: tawarkan **Lanjutkan / Simpan / Buang**. **[CONFIRMED]** (B1)
- FR-140 Saat **Selesai**: ringkasan gowes + tanya sekali jenis gowes (Me-time/Bareng anak) dan emoji kondisi badan, lalu **Simpan**. Kategori waktu otomatis. **[CONFIRMED]** (B4)
- FR-141 Gowes hasil rekaman otomatis menjadi catatan gowes (muncul di grafik, target, ringkasan).
- FR-142 Pada gowes rekaman, jarak/waktu/elevasi **dikunci**; boleh diedit hanya kategori, jenis gowes, kondisi badan, catatan. Salah → hapus rekaman. **[CONFIRMED]** (B3)
- FR-143 Peringatan jelas di layar rekam: rekaman bisa berhenti bila layar dikunci atau aplikasi dipindah ke latar belakang. **[CONFIRMED]** (R-8)
- FR-144 Detail gowes rekaman menampilkan jejak di peta.
- FR-145 Layar rekam memakai mode redup/hemat baterai bila memungkinkan. **[ASSUMPTION]** (R-9)
- FR-146 **Ekspor GPX** per gowes rekaman, dengan opsi memotong **200 m** di awal dan akhir. **[CONFIRMED]** (OQ-14, B6)
- FR-147 Jejak GPS tidak pernah dikirim ke server mana pun (selain permintaan gambar peta). **[CONFIRMED]** (B6)

### F-15 Installable PWA
- FR-150 Aplikasi dapat dipasang di layar utama dan tampil layar penuh. **[CONFIRMED]** (OQ-9)

## 9. Non Functional Requirements
- NFR-001 Biaya nol; hosting statis gratis (Cloudflare Pages; Render.com tetap bisa). **[CONFIRMED]**
- NFR-002 Tanpa server aplikasi, tanpa login, tanpa API berbayar.
- NFR-003 Layar 360–420 px, input font ≥ 16 px, mode gelap bawaan, palet hijau neon (D-16, menggantikan oranye prototipe). **[CONFIRMED]**
- NFR-004 Seluruh teks Indonesia sehari-hari; angka berformat Indonesia (koma desimal). **[ASSUMPTION]**
- NFR-005 Dapat dirawat sendiri dengan bantuan AI: arsitektur sederhana.
- NFR-006 Pencatatan harian cukup beberapa ketukan.
- NFR-007 Di layar rekam, target sentuh besar dan kontras tinggi agar terbaca di terik. **[ASSUMPTION]**
- NFR-008 Data kesehatan dan lokasi hanya di perangkat. Akses HTTPS (wajib untuk GPS).
- NFR-009 Penyimpanan jejak GPS memakai penyimpanan yang cukup besar (IndexedDB) — keputusan teknis di System Design. (R-11)

## 10. Business Rules
- **BR-001 Kesiapan gowes**: tidur segar=2, cukup=1, kurang=0; buah ≥ 2 porsi +1; air ≥ 2.000 ml +1 (maks 4). Skor ≥ 3 🟢 siap; 2 🟡 santai; < 2 🔴 istirahat. **[CONFIRMED]** (disetujui; ambang dikalibrasi ulang di sini: lihat OQ-P3). Air dinilai proporsional terhadap jam (B8).
- BR-002 Minggu dimulai Senin. **[CONFIRMED]**
- BR-003 Aplikasi tidak mengusulkan sayur sebagai solusi utama; sayur hanya boleh disebut sebagai opsi yang bisa ditolak. **[CONFIRMED]**
- BR-004 Saran kesehatan bersifat umum, bukan nasihat medis; tidak ada diagnosis. **[ASSUMPTION]** (disclaimer dari prototipe dipertahankan)
- BR-005 Kategori waktu: Hari Kerja = Senin–Jumat; Sabtu Sore = Sabtu mulai ≥ 12:00; Minggu Pagi = Minggu mulai < 12:00; selain itu (Sabtu pagi, Minggu sore) = **Lainnya**. **[CONFIRMED]** (OQ-P4 + G-1, Gate 4)
- BR-006 Waktu bergerak mengecualikan waktu jeda; kecepatan rata-rata = jarak ÷ waktu bergerak.
- BR-007 Jenis gowes menentukan keseimbangan hidup; "Me-time" dan "Bareng anak" saling lepas.
- BR-008 Target jarak mingguan mengikuti FR-023.
- BR-009 Gowes hasil rekaman = sumber "rekaman" (angka dikunci); gowes input tangan = sumber "manual" (angka bebas diedit). **[CONFIRMED]** (B3)

## 11. Permission Requirements
Satu peran (Pemilik) sehingga tidak ada matriks hak akses. Izin perangkat:
- PER-001 Izin **lokasi** (GPS) — diminta hanya saat Mulai Gowes pertama; bila ditolak, mode cyclocomp tidak jalan dan pengguna diarahkan ke input manual.
- PER-002 **Wake Lock** (layar tetap menyala) — bila tidak didukung, tampilkan peringatan.
- PER-003 Izin **penyimpanan permanen** — diminta sekali; penolakan tidak menghalangi pemakaian tetapi tampilkan peringatan risiko data hilang.
- PER-004 Tidak ada izin kamera, mikrofon, kontak, atau notifikasi push di v1.

## 12. Workflow
- WF-01 **Rekam gowes**: Mulai Gowes → izin & peringatan keselamatan → merekam (jeda otomatis/manual) → Selesai → ringkasan → isi jenis & kondisi → Simpan → masuk riwayat. Cabang: terputus → buka aplikasi → Lanjutkan/Simpan/Buang.
- WF-02 **Catat manual**: Catat Gowes → isi form → (peringatan duplikat bila ada) → Simpan.
- WF-03 **Harian**: jurnal (hari ini atau kemarin), hidrasi, checklist, mood.
- WF-04 **Mingguan**: buka Ringkasan; catat berat/pinggang (disarankan).
- WF-05 **Cadangan**: pengingat → Ekspor JSON → simpan file di tempat aman. Pemulihan: Impor JSON → konfirmasi timpa.
- WF-06 **Ekspor ke Strava**: detail gowes rekaman → Ekspor GPX (opsi potong 200 m) → unggah lewat situs web Strava.
Diagram detail di `WORKFLOW.md` (fase System Design).

## 13. Validation
- VAL-001 Jarak > 0 dan ≤ batas wajar (mis. 300 km). Waktu > 0. Elevasi ≥ 0. Kecepatan rata-rata yang tak masuk akal (mis. > 70 km/jam) → peringatan. **[ASSUMPTION]** (angka batas di System Design)
- VAL-002 Tanggal gowes tidak boleh di masa depan. **[ASSUMPTION]**
- VAL-003 Berat dan pinggang dalam rentang manusiawi (mis. 20–300 kg, 30–200 cm). **[ASSUMPTION]**
- VAL-004 Hidrasi tidak boleh negatif; porsi buah dan menit main bilangan bulat ≥ 0.
- VAL-005 Impor JSON memeriksa struktur dan versi sebelum menimpa; file tak valid ditolak tanpa mengubah data.
- VAL-006 Duplikat gowes: hanya peringatan (FR-014).
- VAL-007 Item checklist tidak boleh kosong; panjang dibatasi.

## 14. Error Handling
- ERR-001 Izin lokasi ditolak → pesan jelas + tawarkan input manual.
- ERR-002 GPS belum mengunci → tampil "mencari sinyal", rekaman tidak mulai sampai ada titik valid.
- ERR-003 Sinyal GPS hilang saat merekam → tampil indikator; lanjut saat kembali; celah tidak dihitung jarak lurus panjang. **[ASSUMPTION]**
- ERR-004 Penyimpanan penuh atau gagal menyimpan → pesan jelas dan tawarkan ekspor segera; jangan buang data diam-diam.
- ERR-005 Peta gagal dimuat → tampil area kosong + tetap merekam (FR-136).
- ERR-006 Impor gagal → tampil alasan, data lama utuh.
- ERR-007 Wake Lock gagal/dilepas → peringatan.

## 15. Edge Cases
- EC-01 Tidak ada gowes di minggu/bulan itu → grafik dan ringkasan tampil "belum ada data".
- EC-02 Gowes melewati tengah malam → tanggal ikut waktu mulai. **[ASSUMPTION]**
- EC-03 Rekaman sangat singkat/jarak mendekati nol → tawarkan Buang.
- EC-04 Dua gowes di hari sama (FR-011) → keduanya dihitung.
- EC-05 Minggu berjalan belum lengkap → label "baru N dari 7 hari".
- EC-06 Bulan dengan 4 atau 5 pekan → garis target mengikuti FR-023.
- EC-07 Jam/zona waktu HP berubah → tanggal tersimpan sebagai tanggal lokal saat pencatatan.
- EC-08 Layar terkunci saat merekam → titik tersimpan sampai saat itu; saat dibuka muncul FR-139 bila perlu.
- EC-09 Menghapus item checklist yang punya riwayat → riwayat lama tetap (FR-072).
- EC-10 Jurnal hari sebelumnya diisi belakangan → kesiapan dihitung ulang.
- EC-11 Data browser dihapus → data hilang; mitigasi lewat cadangan (FR-121/122).

## 16. Acceptance Criteria
Format: Given/When/Then ringkas. Detail pengujian di `TEST-PLAN.md`.

- **AC-001 (F-01)** Saat aplikasi dibuka, terlihat tombol Mulai Gowes, tombol Catat Gowes, progres bulanan, dan status kesiapan tanpa menggulir jauh; fitur lain tidak tampil menumpuk.
- **AC-002 (F-02)** Pengguna mencatat dua gowes di tanggal yang sama; keduanya tersimpan dan terhitung di total.
- **AC-003 (F-02)** Pengguna mengedit jarak gowes manual; total dan grafik ikut berubah.
- **AC-004 (F-02)** Mencatat gowes dengan tanggal, jarak, dan waktu sama persis menampilkan peringatan, tetapi tetap bisa disimpan.
- **AC-005 (F-03)** Mengubah target ke 130 km menghitung garis mingguan = 130 ÷ jumlah pekan bulan itu.
- **AC-006 (F-03)** Grafik 8 pekan berganti metrik; garis target hanya muncul untuk Jarak.
- **AC-007 (F-04)** Jurnal kemarin kosong → status kesiapan "Belum ada data", bukan merah.
- **AC-008 (F-04)** Jurnal kemarin: tidur segar + buah 2 porsi, air hari ini cukup → skor 4 = 🟢.
- **AC-009 (F-04)** Jurnal dapat diisi untuk kemarin dan memengaruhi kesiapan hari ini.
- **AC-010 (F-05)** +250 dan +500 menambah total; koreksi mengurangi; hari baru mulai 0.
- **AC-011 (F-06)** Timer 60 detik berjalan dan selesai dengan penanda.
- **AC-012 (F-07)** Berat, pinggang, mood tersimpan; jarak ke target berat tampil; dapat diedit/dihapus.
- **AC-013 (F-08)** Item checklist ditambah dan dihapus; hari baru ter-reset; ringkasan minggu lalu tidak berubah setelah item dihapus.
- **AC-014 (F-09)** Minggu tanpa data tampil "belum ada data" tanpa error/NaN; minggu berjalan berlabel "baru N dari 7 hari".
- **AC-015 (F-10)** Ceklis aktivitas anak tetap tersimpan setelah aplikasi ditutup; batang keseimbangan mengikuti jenis gowes.
- **AC-016 (F-11/BR-003)** Tidak ada layar yang menyarankan sayur sebagai solusi utama.
- **AC-017 (F-12)** Tombol pengingat menghasilkan file kalender berulang yang bisa dibuka HP dengan jam sesuai FR-111.
- **AC-018 (F-13)** Ekspor lalu impor di browser bersih memulihkan semua data identik; impor file rusak ditolak, data lama utuh.
- **AC-019 (F-13)** Setelah 10 gowes baru sejak cadangan terakhir (atau 14 hari), muncul pengingat cadangan.
- **AC-020 (F-14)** Mulai Gowes meminta izin lokasi dan menampilkan peringatan keselamatan sekali; layar tetap menyala selama merekam.
- **AC-021 (F-14)** Layar rekam menampilkan kecepatan, jarak, waktu bergerak, elevasi, peta dengan posisi dan jejak; tombol Jeda/Selesai besar; tanpa form.
- **AC-022 (F-14)** Berhenti di lampu merah: waktu bergerak berhenti bertambah dan jarak tidak bertambah akibat GPS bergeser.
- **AC-023 (F-14)** Saat sinyal internet mati, rekaman terus berjalan dan peta kosong tanpa memutus rekaman.
- **AC-024 (F-14)** Aplikasi ditutup paksa saat merekam; saat dibuka lagi muncul Lanjutkan/Simpan/Buang, dan data titik sampai saat itu tidak hilang.
- **AC-025 (F-14)** Setelah Selesai, ditanya jenis gowes dan kondisi badan sekali; gowes muncul di riwayat, grafik, dan target; kategori terisi otomatis.
- **AC-026 (F-14)** Gowes rekaman: kolom jarak/waktu/elevasi tidak bisa diedit; kategori, jenis, kondisi, catatan bisa.
- **AC-027 (F-14)** Ekspor GPX menghasilkan file valid; dengan opsi potong aktif, 200 m awal dan akhir tidak ada di file.
- **AC-028 (F-14)** Layar rekam menampilkan peringatan bahwa rekaman bisa berhenti bila layar dikunci.
- **AC-029 (F-14)** Penolakan izin lokasi menampilkan pesan dan jalan ke input manual.
- **AC-030 (F-15)** Aplikasi dapat dipasang di layar utama dan terbuka layar penuh.
- **AC-031 (NFR)** Tampilan nyaman di 360–420 px; input tidak memicu auto-zoom.

## 17. Reporting
- Ringkasan mingguan (F-09), grafik tren 8 pekan (F-03), progres bulanan (F-03), keseimbangan hidup (F-10), jarak ke target berat (F-07). Tidak ada laporan lain di v1; tren bulanan ditunda.

## 18. Audit Trail
Sistem satu pengguna tanpa login, jadi tidak ada audit pengguna. Hanya dicatat: sumber gowes (rekaman/manual), waktu dibuat, dan waktu terakhir diedit; tanggal ekspor/impor terakhir untuk pengingat cadangan. **[ASSUMPTION]**

## 19. Data Requirements
Entitas tingkat tinggi (skema rinci di `DATA-MODEL.md`):
- Gowes (tanggal, jarak, waktu bergerak, elevasi, kategori, jenis, kondisi, catatan, sumber, dibuat/diedit)
- Jejak GPS (titik: lat, lon, waktu, akurasi, elevasi) terkait satu gowes rekaman; rekaman sementara untuk pemulihan
- Jurnal harian (tidur, buah, menit bareng anak)
- Hidrasi harian (ml)
- Catatan tubuh (tanggal, berat, pinggang, mood); target berat ideal
- Checklist: daftar item aktif + hasil per hari
- Ceklis aktivitas anak
- Pengaturan: target bulanan, jam pengingat, tanggal cadangan terakhir
- Konten statis (ide anak, nutrisi, peregangan) ikut aplikasi, bukan data pengguna
Penyimpanan: di perangkat; jejak GPS di penyimpanan berkapasitas besar. Tidak ada migrasi dari prototipe.

## 20. Out of Scope (v1)
- Upload screenshot Strava; impor GPX/TCX/FIT **[CONFIRMED]**
- Resep dan belanja sayur **[CONFIRMED]**
- Sinkronisasi antar perangkat, akun, login **[CONFIRMED]**
- Sensor Bluetooth (detak jantung, kadensi) **[CONFIRMED]**
- Navigasi rute tujuan dan arahan belok; peta offline **[CONFIRMED]**
- Perekaman GPS di latar belakang saat layar mati; pembungkus aplikasi Android **[ASSUMPTION]**
- AI (komentar, tips dinamis, foto piring) — fase berikutnya **[CONFIRMED]**
- Notifikasi push dari server **[RECOMMENDATION]**
- Tren bulanan, lencana pencapaian **[ASSUMPTION]**
- Offline penuh sebagai persyaratan **[CONFIRMED]**

## 21. Dependencies
- Browser Chromium Android (uji utama: Brave di Motorola Edge 60 Fusion; pembanding: Chrome; D-23) yang mendukung: Geolocation, Wake Lock, penyimpanan besar, instalasi PWA.
- Penyedia gambar peta (gratis, wajib cantumkan sumber), dipilih di System Design (R-10).
- Host statis gratis dengan HTTPS (Cloudflare Pages / Render).
- Repo GitHub **publik** `nugugautomation-prog/Gowes-Nugug` (D-17); folder kerja lokal belum berupa repo git (dibuat di M0).
- Situs web Strava untuk unggah GPX (opsional, di luar aplikasi).

## 22. Risks
Mewarisi R-1…R-11 dari Project Context. Tambahan di PRD:
| ID | Risiko | Mitigasi |
|---|---|---|
| R-12 | Cyclocomp adalah modul terbesar; bisa menunda rilis fitur dasar | Dibangun terakhir (modul terakhir v1); fitur dasar bisa dipakai lebih dulu |
| R-13 | Akurasi GPS HP berbeda dari Strava | Jeda otomatis + filter (FR-133/134); selisih kecil diterima |
| R-14 | Browser menghentikan rekaman di latar belakang tanpa disadari | FR-143 peringatan, FR-138/139 pemulihan |
| R-15 | Tampilan menumpuk lagi karena 15 fitur | Design Brief berbasis prioritas layar awal (FR-003) |

## 23. Pertanyaan Terbuka (perlu keputusan sebelum / saat Gate 2)
Tidak ada yang menghalangi Gate 2; semuanya punya usulan AI.

| # | Pertanyaan | Usulan AI | Dampak |
|---|---|---|---|
| OQ-P1 | Ambang jeda otomatis (kecepatan di bawah berapa dianggap berhenti) | < 2 km/jam selama 5 detik | FR-133 |
| OQ-P2 | Ambang akurasi GPS yang dibuang dan interval simpan titik | Buang akurasi > 30 m; simpan tiap ±5 detik | FR-134, FR-138 |
| OQ-P3 | Kalibrasi skor kesiapan karena air dinilai sesuai jam | Air "cukup" = ≥ 2.000 ml terhadap proporsi jam (mis. ≥ 60% target di jam 16:30) | BR-001 |
| OQ-P4 | Batas jam kategori sore/pagi untuk Sabtu/Minggu | Sabtu Sore = mulai ≥ 12:00; Minggu Pagi = mulai < 12:00; selain itu tanpa kategori khusus | BR-005 |
| OQ-P5 | Batas validasi angka (jarak maks, kecepatan maks, rentang berat/pinggang) | Seperti VAL-001/003 | Bagian 13 |
| OQ-P6 | Pilihan emoji mood dan kondisi badan | Mengikuti prototipe `GowesSehat.html` | F-02, F-07 |
| OQ-P7 | Isi 3 contoh checklist awal | Minum air pagi, peregangan, jurnal malam | FR-071 |

---
**Traceability:** setiap FR/BR di atas punya AC di bagian 16; pemetaan ke Design → Workflow → Data Model → Test dilengkapi di fase Design Brief, System Design, dan Test Plan.
