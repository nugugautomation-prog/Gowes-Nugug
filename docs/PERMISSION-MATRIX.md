# PERMISSION MATRIX — GowesSehat

Status: Gate 4 disetujui (2026-11-16).
Hanya **satu peran: Pemilik**. Tidak ada login, admin, atau pengguna lain [CONFIRMED]. Maka matriks ini mencakup tiga hal: izin perangkat, akses data, dan perlindungan di sisi klien. Uji keamanan fase 11 memakai matriks ini.

## 1. Peran
| Peran | Hak |
|---|---|
| Pemilik | Semua fungsi aplikasi pada data di HP-nya |
| Orang lain yang memegang HP terbuka | Di luar model keamanan; pelindung = kunci layar HP |

## 2. Izin perangkat (PRD bagian 11)
| ID | Izin | Dipakai untuk | Kapan diminta | Bila ditolak |
|---|---|---|---|---|
| PER-001 | Lokasi (GPS) | Merekam jejak | Mulai Gowes pertama | Mode cyclocomp tidak jalan → input manual (ERR-001) |
| PER-002 | Wake Lock (layar menyala) | Layar tetap hidup saat merekam | Saat merekam dimulai | Peringatan; rekaman tetap bisa berjalan |
| PER-003 | Penyimpanan permanen | Mencegah browser menghapus data | Saat pertama kali ada data | Tetap bisa dipakai; tampil peringatan risiko |
| PER-004 | Kamera, mikrofon, kontak, notifikasi push | — | **Tidak diminta di v1** | — |

## 3. Matriks fungsi × peran
| Fungsi | Pemilik | Catatan |
|---|---|---|
| Lihat/tambah/edit/hapus gowes manual | ✔ | Semua kolom bisa diedit |
| Edit gowes rekaman | ✔ terbatas | Hanya kategori, jenis, kondisi, catatan (FR-142) |
| Hapus gowes rekaman (+ jejaknya) | ✔ | Konfirmasi |
| Rekam gowes, jeda, selesai | ✔ | Butuh PER-001 |
| Jurnal, hidrasi, tubuh, checklist, ceklis anak | ✔ | |
| Ekspor JSON / GPX | ✔ | |
| Impor JSON (menimpa data) | ✔ | Konfirmasi + validasi |
| Ubah pengaturan, buat file kalender | ✔ | |

## 4. Matriks data × risiko keamanan (pengganti hak akses backend)
| Data | Sensitivitas | Di mana | Perlindungan |
|---|---|---|---|
| Jejak GPS (rumah/rute) | **Tinggi** | Hanya di HP | Tidak dikirim ke server mana pun; ekspor GPX dengan opsi potong 200 m (B6); peta memuat gambar peta saja |
| Berat, pinggang, tidur | Sedang (kesehatan) | Hanya di HP | Tanpa analitik/pelacak; ekspor dijaga pengguna |
| File cadangan JSON | Tinggi (berisi semuanya) | Di HP pengguna | Peringatan "simpan di tempat aman, file tidak terenkripsi" [RECOMMENDATION] |
| Pengaturan, checklist | Rendah | HP | — |

## 5. Pemeriksaan keamanan untuk fase Security (rujukan)
Karena tak ada server, risiko nyata berada di sisi klien. Daftar uji yang diturunkan dari PRD dan matriks ini:
1. Impor JSON berisi data rusak, terlalu besar, atau skrip berbahaya tidak menjalankan kode dan tidak merusak data lama.
2. Teks pengguna (catatan, nama checklist) selalu ditampilkan sebagai teks, bukan HTML.
3. Berkas GPX dan .ics yang dihasilkan meloloskan karakter khusus (XML/ICS escape).
4. Kebijakan keamanan konten (CSP) membatasi sumber skrip; hanya OpenFreeMap (dan cadangan OSM) boleh dihubungi.
5. Izin lokasi hanya digunakan selama merekam; pelacakan dihentikan saat Selesai/Buang.
6. Tidak ada rahasia, kunci API, atau token di repositori.
7. Service Worker tidak menyimpan data pengguna atau gambar peta di cache publik.
8. Penyimpanan permanen diminta; kehilangan data akibat penghapusan browser tertangani lewat pengingat cadangan.
