# TEST PLAN — GowesSehat

Status: **DISETUJUI (2026-11-17)**
Tanggal: 2026-11-17
Sumber: `PRD.md` bagian 16 (AC-001…031), `BUSINESS-RULES.md`, `PERMISSION-MATRIX.md` bagian 5, `TECHNICAL-PLAN.md` bagian 7, `AUDIT.md`.

## 1. Lapisan uji (pedoman bagian 9)
| Lapis | Alat | Kapan |
|---|---|---|
| Unit (logika murni) | Vitest | Bersama kode, tiap modul |
| Komponen | Vitest + Testing Library | Form, sheet, kartu, dialog |
| Integrasi | Vitest + fake-indexeddb | DB, transaksi, migrasi, pemulihan, impor |
| E2E | Playwright (Chromium, emulasi HP, GPS palsu, jam palsu) | Setelah fitur utama (Gate 7); sebagian lebih awal untuk M10/M11 |
| Keamanan | Manual + skrip | Fase 11 (Gate 8) |
| Perangkat nyata | Anda di HP (Brave) | M0, M8, M10, M11 |
| UAT | Anda | Sebelum rilis (Gate 10) |

Setiap modul menjalankan **uji regresi** seluruh uji sebelumnya sebelum dinyatakan selesai.

## 2. Data uji
- Semua data **palsu** (repo publik, D-17). Jejak GPS sintetis di lokasi fiktif; generator skrip menghasilkan: lintasan lurus, belokan, berhenti lama dengan jitter ±5–25 m (B-2), lompatan 100 km/jam, celah sinyal 60 detik, akurasi buruk 50 m.
- Tanggal diuji dengan jam palsu: bulan 28/30/31 hari, bulan mulai tiap hari dalam sepekan, 4 vs 5 pekan, pergantian tengah malam, Sabtu 11:59 vs 12:00, jam 06:59/07:00/10:59/11:00 untuk air.

## 3. Uji per modul → AC

| Modul | Kasus uji utama | AC | Lapis |
|---|---|---|---|
| M0 | Kontras token ≥ 4,5:1 (teks) dan ≥ 7:1 (angka rekam) kedua tema; navigasi 5 tab; skema Dexie dibuat dan migrasi naik versi; manifest valid; instalasi; input tanpa auto-zoom di 360/390/420 px; **uji kelayakan HP** (GPS, Wake Lock, persist, SW, WebGL peta, unduh .ics/.gpx, hapus-data-keluar Brave) | AC-030, 031 | Unit, komponen, HP |
| M1 | Dua gowes di tanggal sama terhitung; edit jarak mengubah total; duplikat → peringatan tapi tersimpan; validasi VAL-001/002/006/007 (batas, masa depan, >70 km/jam peringatan); `parseAngka` menerima `12,5` dan `12.5`; kategori otomatis BR-010 (batas 12:00) | AC-002, 003, 004 | Unit, komponen |
| M2 | Target 130 km ÷ pekan beririsan (28/30/31 hari, mulai tiap hari); progres >100% tampil angka asli; ganti metrik; garis target hanya Jarak; tanpa data → "belum ada data" | AC-005, 006, 001 (sebagian) | Unit, komponen |
| M3 | Jurnal kemarin kosong → netral; tidur segar + 2 buah + air cukup = 4 🟢; **air pagi (D-20): 06:00 dan 10:59 memakai total kemarin, 11:00 memakai proporsional**; ambang tepat 07:00/19:00; +250/+500/koreksi tak negatif; hari baru 0; jurnal kemarin diisi belakangan menghitung ulang | AC-007…010 | Unit, integrasi |
| M4 | Tambah/hapus item (+urungkan); reset harian; hapus item tak mengubah hari lampau; item baru muncul di hari itu | AC-013 | Integrasi |
| M5 | Satu baris per tanggal (gabung); rentang berat/pinggang; minimal satu terisi; edit/hapus; jarak ke target | AC-012 | Unit, integrasi |
| M6 | Minggu kosong tanpa NaN/Infinity; minggu berjalan "baru N dari 7 hari"; perubahan berat; mood seri → terbaru; % checklist hanya hari yang punya baris; keseimbangan nol gowes | AC-014, 015 | Unit |
| M7 | Ceklis anak bertahan setelah muat ulang; "Ide Baru" acak ≠ ide sama berturut-turut; timer 60 dtk selesai dengan penanda; **pemindai konten: tidak ada kata sayur sebagai solusi utama**; disclaimer ada | AC-011, 015, 016 | Komponen, unit |
| M8 | ICS: escape karakter, RRULE, VALARM, zona Asia/Jakarta, jam sesuai FR-111; **uji nyata: file terbuka di Kalender HP dan alarm berbunyi sesuai jam (B-7)** | AC-017 | Unit, HP |
| M9 | Ekspor→impor di DB bersih identik (termasuk titik GPS); file rusak/versi baru/terlalu besar (>50 MB)/skrip di teks ditolak, data lama utuh; gagal di tengah = rollback; impor diblokir saat rekaman aktif; pengingat cadangan 14 hari atau 10 gowes; tanpa cadangan awal = tanggal data pertama; snooze | AC-018, 019 | Integrasi |
| M10 | Izin ditolak → jalan ke manual; peringatan keselamatan sekali; GPS belum kunci; jeda otomatis dengan **jitter saat diam** (B-2) tidak menambah jarak; jarak dari semua titik valid (B-3); filter akurasi >30 m dan lonjakan >70 km/jam; celah >30 dtk tidak dihitung garis lurus; elevasi dihaluskan ambang 2 m; tutup paksa → Lanjutkan/Simpan/Buang tanpa kehilangan titik; Selesai → jenis + kondisi sekali; gowes muncul di riwayat/grafik/target; rekaman dikunci, kolom lain boleh diedit; peringatan layar terkunci; Kembali dicegat; Wake Lock diminta ulang saat layar kembali | AC-020, 021 (tanpa peta), 022, 024, 025, 026, 028, 029 | Unit, integrasi, E2E, **lapangan** |
| M11 | Peta menampilkan posisi dan jejak; peta gagal/offline → rekaman jalan; atribusi tampil; GPX valid (skema), karakter ter-escape, potong 200 m (<400 m dinonaktifkan); CSP tidak memblokir peta (`vite preview` + header); jejak ikut cadangan | AC-021, 023, 027, 018 | Unit, E2E, **lapangan** |
| M12 | Beranda sesuai Design Brief (tiga hal, tanpa menggulir jauh); semua keadaan kosong/galat/sukses; aksesibilitas (label, fokus, kurangi-animasi); regresi seluruh AC | AC-001, 031 + semua | E2E, manual |

## 4. E2E baseline (Gate 7) — perjalanan kritis
1. Catat gowes manual → muncul di riwayat, grafik, target.
2. Rekam gowes dengan GPS palsu (jalan, berhenti, jalan) → Selesai → Simpan → tampil di riwayat.
3. Pemulihan: tutup paksa saat merekam → Lanjutkan/Simpan/Buang.
4. Jurnal kemarin + air hari ini → status kesiapan.
5. Cadangan: ekspor → hapus data → impor → data identik.
6. Ekspor GPX dengan potong 200 m.
7. Pasang PWA / buka tanpa sinyal (cangkang).
Dijalankan ulang setelah perbaikan keamanan dan setelah refactor.

## 5. Uji keamanan (Gate 8) — dari PERMISSION-MATRIX bagian 5
| # | Uji | Cara |
|---|---|---|
| 1 | Impor JSON berisi data rusak, terlalu besar, atau skrip tidak menjalankan kode dan tidak merusak data lama | File jahat sintetis, DOM dipantau |
| 2 | Teks pengguna (catatan, judul checklist) tampil sebagai teks | Isi `<img onerror>` dan `<script>` di semua kolom teks; cek di semua layar dan di GPX/ICS |
| 3 | GPX dan ICS meloloskan karakter khusus | Validasi XML/ICS dengan karakter `& < > " '`, baris baru, emoji |
| 4 | CSP: skrip hanya dari domain sendiri; koneksi hanya OpenFreeMap/OSM | Periksa header; coba muat skrip luar |
| 5 | Izin lokasi hanya selama merekam; berhenti saat Selesai/Buang | Pantau `clearWatch`, indikator lokasi Android |
| 6 | Tidak ada rahasia/kunci/token; tidak ada data pribadi di repo publik | Pindai riwayat Git (mis. gitleaks) + tinjau manual file yang akan terbit |
| 7 | Service Worker tidak menyimpan data pengguna atau tile publik | Periksa Cache Storage |
| 8 | Penyimpanan permanen: status tampil; pengingat cadangan bekerja | Manual |
| 9 | Validasi lapis kedua: nilai di luar rentang ditolak saat menulis ke DB (bukan hanya di form) | Unit pada lapisan DB |
| 10 | `npm audit` tanpa temuan tinggi/kritis | Skrip |
Catatan: tidak ada server, jadi "tombol disembunyikan = aman" tidak relevan; fokusnya klien, impor, dan penyimpanan.

## 6. Uji perangkat nyata (Anda, di Motorola Edge 60 Fusion + Brave)
| Kapan | Uji | Lulus bila |
|---|---|---|
| Akhir M0 | Halaman kelayakan lewat `adb reverse` | GPS, Wake Lock, instalasi, SW, WebGL, unduhan berfungsi; data tidak hilang setelah tutup Brave |
| M8 | Buka file .ics di Kalender | Acara berulang benar; alarm sesuai jam, atau tercatat cara pengaturan |
| M10 (lapangan) | Gowes sungguhan ±10–30 menit dengan deploy pratinjau | Jarak mendekati Strava/odometer (selisih kecil diterima); jeda otomatis saat berhenti; layar tetap menyala; baterai wajar; pemulihan setelah tutup paksa |
| M11 (lapangan) | Peta + GPX | Jejak benar di peta; GPX berhasil diunggah ke situs Strava |
| UAT | Pemakaian sepekan | Alur harian terasa ringan (NFR-006) |

## 7. Kriteria keluar
- Gate 6 per modul: AC modul lulus + regresi hijau + laporan.
- Gate 7: semua perjalanan kritis E2E hijau.
- Gate 8: tabel keamanan lulus atau temuan tercatat dan diperbaiki, lalu E2E hijau lagi.
- Gate 9/10: seluruh AC lulus, UAT disetujui.
