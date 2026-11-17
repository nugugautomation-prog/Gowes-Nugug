# DESIGN BRIEF — GowesSehat (sepedah-nugug)

Status: **GATE 3 DISETUJUI (2026-11-16)** · Diperbarui 2026-11-17: palet hijau neon (D-16), teks tombol Kembali (D-24). Kata "oranye" di dokumen ini dibaca sebagai "aksen hijau neon".
Tanggal: 2026-11-16
Sumber: `docs/PRD.md` (Gate 2 disetujui), `docs/PROJECT-CONTEXT.md`, prototipe `Referensi/GowesSehat.html` (palet dan emoji).
Legenda: **[CONFIRMED]** dari keputusan pengguna · **[RECOMMENDATION]** usulan desain AI, perlu persetujuan di Gate 3. Setiap keputusan ditulis dengan **Alasan**.

---

## 1. Design Objective
Membuat aplikasi yang **tidak terasa menumpuk** (R-3, FR-003), cukup beberapa ketukan untuk mencatat (NFR-006), dan aman dipakai di stang sepeda (B5).
**Alasan:** keluhan utama pengguna pada prototipe adalah tampilan menumpuk; fitur bertambah dari ±10 menjadi 15.

## 2. Target User Experience
- Dibuka di HP, satu tangan, sering sambil berdiri atau di kantor (jurnal, air, peregangan).
- Dua suasana pemakaian yang berbeda, didesain terpisah:
  1. **Mode harian** (santai): mencatat, melihat progres. Boleh ada detail.
  2. **Mode rekam** (bergerak): sangat minim, angka besar, nol form.
- Nada: ramah, tidak menghakimi, tidak menuntut ("Belum ada data" bukan "Kamu belum mengisi").
**Alasan:** tujuan pengguna adalah rutin tanpa beban (G-1, G-5); kepatuhan turun jika UI terasa seperti tugas.

## 3. Information Architecture
Struktur dikelompokkan berdasarkan **kapan dipakai**, bukan berdasarkan fitur:

| Tab | Isi | Fitur PRD |
|---|---|---|
| **Beranda** | Mulai Gowes, progres bulanan, kesiapan gowes, tombol Catat Gowes | F-01 |
| **Gowes** | Riwayat gowes, grafik 8 pekan, target bulanan, detail gowes (+ peta jejak, ekspor GPX) | F-02, F-03, F-14 (detail) |
| **Harian** | Jurnal, hidrasi, checklist, mood, peregangan | F-04, F-05, F-06, F-08, mood F-07 |
| **Progres** | Ringkasan mingguan, tubuh (berat/pinggang/target), keseimbangan hidup | F-07, F-09, F-10 (batang) |
| **Lainnya** | Ide bareng anak, panduan nutrisi, pengingat, cadangan/ekspor, tema | F-10, F-11, F-12, F-13 |

Di luar tab: **Layar Rekam** (layar penuh, F-14) dan lembar (bottom-sheet) untuk form.
**Alasan:** 5 tab adalah batas nyaman untuk satu jempol. Fitur "dipakai harian" (Harian) dipisah dari "dilihat berkala" (Progres) dan "jarang disentuh" (Lainnya), sehingga Beranda tetap bersih. **[RECOMMENDATION]**

## 4. Navigation
- Bilah navigasi bawah, 5 ikon + label pendek, tab aktif berwarna oranye. **[CONFIRMED]** (bilah bawah dari prototipe)
- **Mulai Gowes** adalah tombol utama yang menonjol di Beranda (besar, oranye penuh), bukan tab sendiri.
- Saat merekam, navigasi bawah **disembunyikan**; layar penuh dengan tombol Jeda/Selesai.
- Tombol Kembali Android selama merekam **dicegat dengan konfirmasi "Selesaikan gowes?" sejauh browser mengizinkan**. Gestur ke Beranda HP, pindah aplikasi, atau penutupan paksa tidak bisa dicegah; kehilangan akibatnya ditangani pemulihan (FR-139, AC-024).
- Aplikasi yang dibuka lagi saat ada rekaman belum selesai langsung menampilkan dialog Lanjutkan/Simpan/Buang (FR-139).
**Alasan:** layar rekam harus bebas gangguan (B5); tombol kembali yang tak sengaja tersentuh di guncangan jalan bisa menghilangkan rekaman.

## 5. Page Hierarchy
```
Beranda
 ├─ Mulai Gowes → Izin & peringatan → Layar Rekam → Ringkasan Selesai → Simpan
 └─ Catat Gowes (sheet)
Gowes
 ├─ Grafik + Target
 └─ Riwayat → Detail gowes (peta, edit, hapus, Ekspor GPX)
Harian
 ├─ Jurnal (hari ini / kemarin)
 ├─ Hidrasi
 ├─ Checklist
 ├─ Mood
 └─ Peregangan (timer, layar penuh)
Progres
 ├─ Ringkasan mingguan (pilih minggu)
 ├─ Tubuh (riwayat, tambah)
 └─ Keseimbangan hidup
Lainnya
 ├─ Ide bareng anak
 ├─ Nutrisi
 ├─ Pengingat (buat file kalender)
 ├─ Cadangan (ekspor/impor)
 └─ Tema (terang/gelap/ikut sistem)
```
**Alasan:** maksimal 3 tingkat dalam; semakin jarang dipakai, semakin dalam.

## 6. Layout Principles
1. **Satu kartu satu tujuan.** Tidak lebih dari ±3 kartu terlihat sebelum menggulir di Beranda.
2. **Angka dulu, penjelasan kemudian.** Angka besar, label kecil di bawah.
3. **Detail disembunyikan sampai diminta** (ketuk kartu → sheet atau halaman detail).
4. **Aksi utama di bawah, jangkauan jempol**; aksi destruktif jauh dari aksi utama.
5. Ruang putih yang lega; jarak antarkartu konsisten (skala 4/8/12/16 px).
**Alasan:** semuanya menjawab "tampilan tidak boleh menumpuk".

## 7. Responsive Behavior
- Target utama **360–420 px** lebar. **[CONFIRMED]**
- Satu kolom. Di layar lebih lebar (tablet/desktop) konten dibatasi ±480 px dan dipusatkan; tidak ada tata letak multi-kolom di v1.
- Orientasi: potret. Layar rekam tetap bisa dipakai lanskap (HP di stang sering miring), tetapi potret yang dioptimalkan. **[RECOMMENDATION]**
- Memperhitungkan area aman (poni/gestur) dan keyboard (sheet naik di atas keyboard).
**Alasan:** hanya satu pengguna dengan HP Android; tata letak lain tidak sebanding biayanya.

## 8. Mobile Experience
- Target sentuh ≥ 48×48 px; di Layar Rekam ≥ 72 px untuk Jeda/Selesai. (B5, NFR-007)
- Input font ≥ 16 px agar browser tidak auto-zoom. **[CONFIRMED]**
- Form berupa **bottom-sheet** dari bawah. **[CONFIRMED]**
- Pemilihan (kategori, jenis, emoji) memakai tombol/chip, bukan dropdown, supaya satu ketukan.
- Angka memakai keypad numerik (`inputmode="decimal"`), format koma Indonesia.
- Getaran singkat (haptic) saat Mulai/Jeda/Selesai di Layar Rekam bila didukung. **[RECOMMENDATION]**

## 9. Desktop Experience
Tidak ada persyaratan desktop (Project Context: penggunaan komputer tidak disebut). Aplikasi tetap terbuka di desktop dengan lebar terbatas (bagian 7), tanpa fitur khusus. Ekspor/impor cadangan tetap berguna di komputer. **[ASSUMPTION]**
**Alasan:** menghindari pekerjaan yang tidak diminta.

## 10. Component Philosophy
- Komponen sedikit dan dipakai ulang: **Kartu**, **Angka-besar (stat)**, **Chip pilihan**, **Tombol utama/sekunder/bahaya**, **Sheet**, **Dialog konfirmasi**, **Baris riwayat**, **Grafik batang**, **Peta**, **Lencana status**.
- Setiap komponen punya semua keadaan: normal, aktif, nonaktif, kosong, galat, memuat.
- Tidak ada komponen dekoratif tanpa fungsi.
**Alasan:** NFR-005 (dirawat sendiri dengan bantuan AI); komponen sedikit = bug sedikit dan tampilan konsisten.

## 11. Form Design
- **Catat Gowes** (sheet): urutan = tanggal (default hari ini), jarak, waktu bergerak, elevasi, lalu chip kategori (terisi otomatis), chip jenis, 3 emoji kondisi 😄 😐 😫, catatan opsional (lipat). Tombol **Simpan** sticky di bawah.
- Waktu bergerak diisi dengan dua kolom (jam, menit) agar tak salah format. **[RECOMMENDATION]**
- Validasi **saat keluar kolom** dan saat Simpan; pesan di bawah kolom, bahasa sehari-hari ("Jarak harus lebih dari 0"). Isi tidak hilang saat galat.
- Peringatan duplikat berupa banner kuning di atas Simpan, tidak memblokir (FR-014).
- Jurnal 30 detik: tiga pertanyaan, semuanya chip/stepper, tanpa mengetik. Pilihan hari "Hari ini / Kemarin" di atas.
- Berat/pinggang: satu sheet, kolom boleh dikosongkan salah satunya.
- Form gowes rekaman (setelah Selesai) hanya dua pertanyaan: jenis gowes dan emoji kondisi. (B4, FR-140)
**Alasan:** setiap ketikan tambahan menurunkan kepatuhan (R-6); chip lebih cepat dari dropdown di HP.

## 12. Table Design
Tidak memakai tabel. Riwayat dan daftar ditampilkan sebagai **daftar kartu/baris** (tanggal, jarak, waktu, ikon jenis). Perbandingan mingguan memakai dua kolom kecil "minggu ini | minggu lalu".
**Alasan:** tabel lebar sulit dibaca di 360 px.

## 13. Dashboard Design
- **Beranda** (urutan atas ke bawah):
  1. Sapaan singkat + status kesiapan (lencana 🟢🟡🔴 / abu "Belum ada data") dengan satu kalimat.
  2. **Mulai Gowes** (tombol besar).
  3. Progres bulan ini: batang progres, "42 dari 100 km (42%)".
  4. Tautan kecil **Catat Gowes manual**.
- **Gowes**: grafik 8 pekan di atas (pemilih metrik 3 chip), garis target hanya untuk Jarak; di bawahnya target bulanan dan riwayat.
- **Progres**: ringkasan mingguan berupa 4 angka utama (gowes, km, rata-rata tidur, checklist %), detail bisa dilipat; pemilih minggu (← →).
- Warna status tidak jadi satu-satunya penanda: selalu disertai ikon/teks (aksesibilitas).
**Alasan:** FR-001 menetapkan tiga hal di Beranda; sisanya dipindah agar tidak menumpuk.

## 14. Loading States
- Aplikasi lokal, jadi sebagian besar instan. Gunakan kerangka (skeleton) sederhana hanya untuk grafik dan peta.
- Peta: latar abu dengan "Memuat peta…"; jika gagal, tampil "Peta tidak tersedia. Rekaman tetap berjalan." (ERR-005)
- GPS belum mengunci: "Mencari sinyal GPS…" dengan indikator berputar; tombol Mulai aktif setelah titik valid (ERR-002).
- Ekspor/impor: indikator proses; tombol dinonaktifkan agar tidak dobel.
**Alasan:** pengguna harus tahu aplikasi bekerja, terutama di luar ruang.

## 15. Empty States
Selalu ramah dan memberi satu langkah:
- Belum ada gowes: "Belum ada gowes. Mulai gowes pertamamu?" + tombol.
- Grafik kosong: batang kosong dengan "belum ada data".
- Ringkasan minggu kosong: "Belum ada data minggu ini" (B9).
- Kesiapan tanpa jurnal kemarin: "Belum ada data" netral, bukan merah (B8).
- Checklist kosong: "Tambah rutinitas pertamamu."
**Alasan:** keadaan kosong paling sering muncul di awal; harus mengundang, bukan menegur.

## 16. Error States
- Pesan menjelaskan **apa yang terjadi** dan **apa yang bisa dilakukan**, tanpa istilah teknis.
- Izin lokasi ditolak → penjelasan + tombol **Catat manual** (ERR-001).
- Penyimpanan penuh/gagal → peringatan merah + **Ekspor sekarang** (ERR-004).
- Impor gagal → alasan singkat, "Data lamamu aman" (ERR-006).
- Layar rekam: indikator kecil "Sinyal GPS hilang" (oranye) dan peringatan layar terkunci (FR-143, ERR-003, ERR-007).
- Galat tidak pernah menghapus isi form.
**Alasan:** data kesehatan dan rekaman gowes tidak boleh hilang diam-diam; pengguna bukan teknisi.

## 17. Success States
- Konfirmasi ringan tanpa memblokir: toast singkat ("Gowes tersimpan ✓") dan kartu terbarui di tempat.
- Setelah gowes selesai: layar ringkasan (jarak, waktu, elevasi, kecepatan rata-rata, peta jejak) dengan tombol Simpan.
- Target tercapai: pesan hangat satu kalimat (bukan perayaan berlebihan). Tanpa lencana di v1.
**Alasan:** umpan balik cepat memperkuat kebiasaan; berlebihan mengganggu.

## 18. Confirmation Patterns
- **Wajib konfirmasi:** hapus gowes, hapus rekaman, impor yang menimpa data, Selesai di Layar Rekam, Buang rekaman terputus.
- Dialog menyebut objeknya ("Hapus gowes 12 Nov, 18 km?") dengan tombol aksi bernama jelas (**Hapus** / **Batal**), bukan "Ya/Tidak".
- **Tanpa konfirmasi:** tambah air, centang checklist, simpan jurnal (bisa dikoreksi).
- Hapus item checklist: dengan **Urungkan** (undo) beberapa detik, karena mudah tersentuh.
**Alasan:** konfirmasi hanya untuk aksi yang merusak atau tak mudah dibalik; konfirmasi berlebihan membuat input terasa berat.

## 19. Accessibility
- Kontras teks ≥ WCAG AA (4,5:1); angka di Layar Rekam ≥ 7:1 (terbaca di terik).
- Status tidak bergantung warna saja (ikon + teks).
- Ukuran teks mengikuti pengaturan sistem sampai batas wajar; angka rekam sangat besar.
- Label pada semua tombol ikon; urutan fokus logis; bisa dipakai dengan pembaca layar dasar. **[RECOMMENDATION]**
- Hormati "kurangi animasi" bila diaktifkan.
**Alasan:** terbaca di terik dan dalam guncangan adalah aksesibilitas nyata bagi pengguna ini.

## 20. Visual Direction
- **Palet hijau neon [CONFIRMED, D-16]**, **mode gelap bawaan**. Aksen (isi tombol, tab aktif) `#39FF14` dengan teks di atasnya `#07140A`. Gelap: latar `#0C100D`, kartu `#151B16`, teks `#EAF2EB`, teks redup `#97A89A`, garis `#243027`, hijau teks/ikon `#39FF14`. Terang: latar `#F4F7F4`, kartu `#FFFFFF`, teks `#142016`, teks redup `#5B6B5E`, garis `#DCE5DD`, hijau teks/ikon `#0B7A2B` (neon tidak dipakai sebagai teks di latar terang). Status: kuning `#FFC53D` / merah `#FF5C5C` (gelap), `#8A6100` / `#C62828` (terang). Angka final disetel di M0 lewat uji kontras (teks ≥ 4,5:1; angka Layar Rekam ≥ 7:1). Status kesiapan selalu ikon + teks (✓ Siap / ~ Santai / ! Istirahat / – Belum ada data).
- **Tema:** ikut pengaturan sistem, bisa diganti manual (Lainnya → Tema). Layar Rekam punya pilihan cepat terang/gelap karena kebutuhan terik vs malam. **[RECOMMENDATION]**
- **Tipografi:** font sistem Android (cepat, tanpa unduhan); angka tabular agar tidak melompat saat berubah; hierarki: angka besar (28–48 px, Layar Rekam 72–96 px), judul 18–20 px, isi 16 px, keterangan 13–14 px.
- **Bentuk:** sudut membulat 12–16 px, bayangan tipis, ikon garis sederhana, emoji dipakai untuk kondisi/mood (dari prototipe).
- **Nada:** hangat, singkat, Indonesia sehari-hari (NFR-004). Bukan gaya "dashboard korporat".
- **Warna status:** hijau (siap), kuning (santai), merah (istirahat), abu (belum ada data).
- **Gerak:** transisi singkat (≤ 200 ms) untuk sheet dan tab; tanpa animasi dekoratif.
**Alasan:** hijau neon pilihan pengguna; mode gelap membuat neon terbaca dan hemat baterai di layar OLED; font sistem menjaga biaya dan kinerja rendah.

---

## Pelacakan ke PRD (ringkas)
| Keputusan desain | Requirement |
|---|---|
| Beranda tiga hal + Mulai Gowes | FR-001/002/003, AC-001 |
| Lima tab | FR-003, R-15 |
| Layar rekam minim, tanpa form | FR-131, B5, AC-021 |
| Konfirmasi Selesai / tombol kembali | FR-139/140, R-14 |
| Form gowes dengan chip + bottom-sheet | FR-010/015, NFR-003/006 |
| Status netral "Belum ada data" | FR-032, FR-082, AC-007/014 |
| Peringatan layar terkunci | FR-143, AC-028 |
| Kontras tinggi di rekam | NFR-007 |

## Keputusan yang perlu disetujui di Gate 3
1. Lima tab: Beranda, Gowes, Harian, Progres, Lainnya (bagian 3).
2. Mulai Gowes sebagai tombol besar di Beranda, bukan tab (bagian 4).
3. Layar rekam: tombol kembali tidak menutup rekaman, selalu minta konfirmasi (bagian 4).
4. Layar rekam bisa lanskap; tema terang/gelap cepat di layar rekam (bagian 7, 20).
5. Waktu bergerak di form manual diisi jam + menit (bagian 11).
6. Tanpa tampilan desktop khusus (bagian 9).
