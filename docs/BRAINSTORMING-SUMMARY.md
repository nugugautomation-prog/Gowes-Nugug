# BRAINSTORMING SUMMARY — GowesSehat

Tanggal: 2026-11-16 · Sumber: `docs/PROJECT-CONTEXT.md` (Gate 1 disetujui)
Status: **Semua keputusan B1–B12 DISETUJUI pengguna** ("setuju semua"). Semuanya **[CONFIRMED]**.

## Keputusan

| ID | Topik | Keputusan |
|---|---|---|
| B1 | Rekaman terputus | Titik GPS disimpan ke penyimpanan HP berkala. Saat aplikasi dibuka lagi, tawarkan Lanjutkan / Simpan / Buang gowes yang belum selesai. |
| B2 | Jarak palsu saat diam | Jeda otomatis saat hampir tidak bergerak (waktu bergerak seperti Strava); titik GPS akurasi buruk dibuang; elevasi dihaluskan. Selisih kecil dengan Strava diterima. |
| B3 | Dua sumber data gowes | Gowes hasil rekaman: jarak, waktu, elevasi **dikunci**. Boleh diedit: kategori, jenis gowes, kondisi badan, catatan. Salah → hapus rekaman. Gowes manual: semua boleh diedit. |
| B4 | Kategori & jenis gowes | Kategori waktu otomatis dari hari/jam. Jenis gowes dan emoji kondisi badan ditanya sekali setelah selesai. |
| B5 | Keselamatan | Layar rekam hanya angka besar + tombol Jeda/Selesai besar; tanpa form/teks panjang saat bergerak; pengingat "jangan mengoperasikan HP sambil mengayuh" sekali. |
| B6 | Privasi lokasi | Jejak hanya di HP. Ekspor GPX punya opsi memotong 200 m awal dan akhir. |
| B7 | Penyedia peta | Dipilih di System Design: gratis, tanpa kartu kredit, wajib cantumkan sumber peta. Risiko R-10. |
| B8 | Kesiapan gowes | Tidur dan buah dari jurnal kemarin; air dari hari ini (disesuaikan jam). Jurnal kemarin kosong → "Belum ada data" (netral). Ambang skor dikalibrasi di PRD. |
| B9 | Ringkasan mingguan | Data kosong → "belum ada data". Minggu berjalan diberi label "baru N dari 7 hari". Perbandingan pakai rata-rata per hari/per gowes. |
| B10 | Target bulanan | Angka bebas + 4 tombol cepat (80/100/120/150). Garis mingguan = target bulanan ÷ jumlah pekan kalender di bulan itu. |
| B11 | Riwayat checklist | Simpan hasil per hari (item yang ada & yang selesai). Menghapus item hanya memengaruhi hari ke depan. |
| B12 | Ketahanan data | Minta izin penyimpanan permanen; pengingat cadangan tiap 2 minggu atau setelah 10 gowes baru; ekspor/impor satu file JSON; jejak GPS juga bisa diekspor sebagai GPX. |

## Konflik yang diterima
- Pengingat lewat kalender tidak tahu kondisi data (tetap berbunyi walau sudah minum cukup). Diterima di v1 (R-5).
- "Offline tidak wajib" vs perekaman GPS: peta online saja, tetapi rekaman tetap jalan tanpa sinyal.
