# BUSINESS RULES — GowesSehat

Status: Gate 4 disetujui (2026-11-16). BR-001…BR-009 dari `PRD.md`; BR-010 dan seterusnya adalah rumus rinci yang **baru ditetapkan di sini** dan ditandai [ASSUMPTION] (perlu persetujuan Gate 4, dikalibrasi lewat uji).

## 1. Aturan dari PRD (ringkas)
| ID | Aturan | Status |
|---|---|---|
| BR-001 | Skor kesiapan: tidur segar=2, cukup=1, kurang=0; buah ≥ 2 porsi +1; air memenuhi ambang +1. Skor ≥ 3 🟢 siap; 2 🟡 santai; < 2 🔴 istirahat | CONFIRMED |
| BR-002 | Minggu dimulai Senin | CONFIRMED |
| BR-003 | Sayur tidak pernah menjadi solusi utama | CONFIRMED |
| BR-004 | Saran bersifat umum, bukan medis | ASSUMPTION (disetujui) |
| BR-005 | Kategori waktu otomatis | disetujui; celah G-1 |
| BR-006 | Waktu bergerak mengecualikan jeda; kecepatan rata-rata = jarak ÷ waktu bergerak | — |
| BR-007 | Jenis gowes menentukan keseimbangan hidup | — |
| BR-008 | Garis target mingguan = target bulanan ÷ jumlah pekan kalender di bulan itu | CONFIRMED (B10) |
| BR-009 | Gowes rekaman dikunci; gowes manual bebas diedit | CONFIRMED (B3) |

## 2. Rumus dan aturan rinci

### BR-010 Kategori waktu otomatis [ASSUMPTION, G-1]
Berdasarkan tanggal dan jam **mulai** gowes (waktu lokal HP):
- Senin–Jumat → `hari_kerja`
- Sabtu, mulai ≥ 12:00 → `sabtu_sore`
- Minggu, mulai < 12:00 → `minggu_pagi`
- Selain itu (Sabtu < 12:00, Minggu ≥ 12:00) → `lainnya` (nilai ke-4, menunggu Gate 4)
Pengguna bisa mengganti kategori secara manual.

### BR-011 Kesiapan gowes, rumus lengkap [ASSUMPTION, G-2 / OQ-P3]
- **Hari acuan:** tidur dan buah = jurnal **kemarin**; air = hidrasi **hari ini**. Jurnal kemarin tidak ada → status **netral "Belum ada data"** (B8).
- **Ambang air proporsional jam:** `ambangAir(jam) = 2000 × clamp((jam − 07:00) / (19:00 − 07:00), 0, 1)`; air memberi +1 bila `ml hari ini ≥ ambangAir`. Pukul 16:30 → ambang ≈ 1.583 ml (±63% dari target 2.500). Setelah 19:00 → 2.000 ml.
- **Sebelum 11:00 (D-20):** poin air memakai total hidrasi **kemarin** (≥ 2.000 ml → +1), bukan hari ini. Sejak 11:00 memakai rumus proporsional di atas.
- Skor maksimum 4. Status: ✓ Siap ≥ 3, ~ Santai = 2, ! Istirahat < 2 (selalu ikon + teks; warna hijau/kuning/merah hanya pendukung).
- Teks status bernada ramah dan **bukan medis** (BR-004): "Cukup santai saja hari ini", bukan "Kamu harus istirahat".
- Dihitung ulang setiap jurnal/hidrasi berubah (termasuk jurnal yang diisi belakangan, EC-10).

### BR-012 Pekan kalender dan target mingguan
- Pekan = Senin–Minggu. Jumlah pekan kalender di bulan = banyaknya pekan (Senin–Minggu) yang beririsan dengan bulan tersebut. Contoh: bulan 30 hari yang mulai Kamis beririsan dengan 5 pekan → garis mingguan = target ÷ 5.
- Gowes dihitung ke pekan menurut `date`.
[ASSUMPTION] definisi "beririsan" (bukan hanya pekan penuh).

### BR-013 Progres bulanan
`persen = totalKmBulanBerjalan / monthlyTargetKm × 100`, ditampilkan maksimum 100% di batang, angka sebenarnya tetap tampil (mis. 112%).

### BR-014 Jeda otomatis (cyclocomp) [OQ-P1 disetujui]
Masuk jeda bila kecepatan < 2 km/jam selama ≥ 5 detik berturut-turut; kembali merekam bila kecepatan ≥ 2 km/jam. Waktu jeda tidak masuk `movingSec` dan jarak tidak bertambah selama jeda.
**Sumber kecepatan (D-21):** pakai `coords.speed` bila tersedia; bila `null`, pakai kecepatan rata-rata jarak dari beberapa titik terakhir. Pergeseran antartitik yang **lebih kecil dari akurasi titik** dianggap diam. Semua ambang (2 km/jam, 5 dtk, 30 m, 70 km/jam, 30 dtk) adalah **konstanta di satu berkas** agar mudah dikalibrasi. Diuji dengan data jitter sintetis (AC-022), lalu di uji lapangan.

### BR-015 Filter titik GPS [OQ-P2 disetujui]
- Buang titik dengan akurasi horizontal > 30 m.
- Simpan titik paling sering tiap ±5 detik. **Jarak dihitung dari semua titik valid (≈1 per detik) di memori; hanya penyimpanan yang dijarangkan** (D-21).
- Buang lonjakan tidak masuk akal (loncatan posisi yang menyiratkan > 70 km/jam antartitik berurutan). [ASSUMPTION]
- Jarak = jumlah jarak Haversine antartitik valid yang bukan jeda.

### BR-016 Elevasi
Ketinggian dari GPS dihaluskan (rata-rata bergerak/median jendela kecil), lalu **tanjakan** = jumlah kenaikan positif dengan ambang 2 m per langkah (abaikan getaran kecil). Disimpan di `elevationM`. Tidak dijamin sama dengan Strava (R-13). [ASSUMPTION]

### BR-017 Celah rekaman
Bila antartitik valid terdapat celah > 30 detik (sinyal hilang/pemulihan), selisih jarak **tidak** dihitung sebagai garis lurus panjang; titik berikut dianggap awal segmen baru. (ERR-003)

### BR-018 Keseimbangan hidup [ASSUMPTION]
Persentase **jumlah gowes** bulan berjalan: `metime / total` vs `bareng_anak / total`. Tanpa gowes → "belum ada data". (Memakai jumlah gowes karena paling mudah dipahami; dapat diganti ke jarak/waktu bila pengguna mau.)

### BR-019 Ringkasan mingguan [B9 disetujui]
Untuk pekan P (Senin–Minggu):
- Jumlah gowes, total km, total elevasi, total waktu bergerak.
- **Perbandingan minggu lalu:** selisih total + selisih rata-rata per gowes. Minggu berjalan diberi label "baru N dari 7 hari" dan perbandingan memakai rata-rata per hari.
- **Rata-rata tidur** (skor 2/1/0 → dipetakan ke kata), **buah**, **air** dari hari yang **punya data**; tanpa data → "belum ada data".
- **Menit bareng anak** = jumlah dari jurnal.
- **Perubahan berat** = berat terakhir pekan ini − berat terakhir sebelum pekan ini; salah satunya tidak ada → "belum ada data". **Jarak ke target** = berat terakhir − `idealWeightKg`.
- **Mood dominan** = nilai mood paling sering di pekan itu; seri → yang terbaru.
- **% checklist** = jumlah item selesai / jumlah item pada hari yang **punya baris** `checklist_days` (hari yang tak pernah dibuka tidak dihitung).
- Tidak boleh ada pembagian nol, NaN, atau "Infinity" (AC-014).

### BR-020 Checklist
Reset harian = baris `checklist_days` baru tiap tanggal dibuat saat dibuka; item aktif disalin dengan nama saat itu. Menghapus item hanya menonaktifkannya (B11). Item baru muncul di hari itu juga.

### BR-021 Pengingat cadangan [B12]
Tampil bila `hariSejakCadangan ≥ 14` **atau** `gowesBaruSejakCadangan ≥ 10`. Tanpa cadangan sebelumnya, acuan = tanggal data pertama. Dapat ditunda 1 hari (`backupSnoozeUntil`).

### BR-022 Duplikat gowes
Peringatan (tidak memblokir) bila ada gowes lain dengan `date`, `distanceKm`, dan `movingSec` sama persis.

### BR-023 Hidrasi
+250/+500 menambah; koreksi mengurangi dengan batas bawah 0. Target tampilan 2.500 ml. Hari baru = baris baru.

### BR-024 Ekspor GPX potong awal-akhir [B6]
Opsi "potong 200 m": buang titik dalam 200 m **jarak lintasan** dari awal dan dari akhir. Jika total jarak < 400 m → opsi dinonaktifkan dengan penjelasan (tidak ada yang tersisa).

## 3. Aturan nilai mood/kondisi
Emoji kondisi badan 😄 😐 😫 (nilai 0, 1, 2) dari prototipe. Mood di Catatan Tubuh memakai set yang sama. [ASSUMPTION]

## 4. Aturan konten
Konten statis tidak menyarankan sayur sebagai solusi utama (BR-003). Setiap halaman yang berisi saran kesehatan memuat catatan "saran umum, bukan nasihat medis" (BR-004).

## 5. Validasi (angka final, OQ-P5 disetujui)
| ID | Aturan |
|---|---|
| VAL-001 | Jarak: > 0 dan ≤ 300 km. Waktu bergerak > 0. Elevasi ≥ 0 dan ≤ 10.000 m. Kecepatan rata-rata > 70 km/jam → peringatan (tidak memblokir) |
| VAL-002 | Tanggal gowes ≤ hari ini |
| VAL-003 | Berat 20–300 kg; pinggang 30–200 cm; minimal satu dari berat/pinggang/mood terisi |
| VAL-004 | Hidrasi ≥ 0; buah dan menit bareng anak bilangan bulat ≥ 0 (menit ≤ 1.440) |
| VAL-005 | Impor: struktur, `app`, `schemaVersion`, tipe dan rentang tiap kolom, batas ukuran; ditolak seluruhnya bila ada pelanggaran |
| VAL-006 | Duplikat → peringatan |
| VAL-007 | Judul checklist 1–60 karakter (tidak kosong setelah dipangkas); catatan ≤ 280 |

## 6. Keterlacakan
BR-010 → FR-015/140 · BR-011 → FR-032, AC-007/008/009 · BR-012 → FR-023, AC-005 · BR-014/015/016/017 → FR-133/134, AC-022 · BR-019 → FR-081/082, AC-014 · BR-020 → FR-072, AC-013 · BR-021 → FR-121, AC-019 · BR-024 → FR-146, AC-027.
