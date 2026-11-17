# DATA MODEL — GowesSehat

Status: Gate 4 disetujui (2026-11-16). Penyimpanan: IndexedDB (Dexie). Skema berversi (`schemaVersion`).
Konvensi: `date` = teks tanggal lokal `YYYY-MM-DD`; `ts` = milidetik epoch (UTC); `id` = angka/teks unik dibuat aplikasi. **[ASSUMPTION]** untuk detail kolom di bawah ini kecuali ditandai.

## 1. Entitas (bahasa sederhana)
| Entitas | Arti |
|---|---|
| Gowes | Satu sesi bersepeda (hasil rekaman atau input manual) |
| Titik GPS | Satu titik posisi dalam jejak gowes rekaman |
| Rekaman Aktif | Salinan sementara gowes yang sedang direkam (untuk pemulihan) |
| Jurnal | Catatan harian: tidur, buah, menit bareng anak |
| Hidrasi | Total air per hari |
| Catatan Tubuh | Berat, pinggang, mood pada satu tanggal |
| Item Checklist | Daftar rutinitas yang aktif |
| Hasil Checklist Harian | Salinan item dan status centang tiap hari |
| Ceklis Anak | Aktivitas anak yang pernah dicentang |
| Pengaturan | Target bulanan, jam pengingat, tanggal cadangan, dsb. |

## 2. Tabel (object store)

### rides (Gowes)
| Kolom | Tipe | Aturan |
|---|---|---|
| id | teks | kunci utama |
| date | teks `YYYY-MM-DD` | tanggal lokal saat **mulai** (EC-02); tidak di masa depan |
| source | `'recorded'` \| `'manual'` | BR-009; tidak berubah |
| distanceKm | angka | > 0, ≤ 300; 2 desimal |
| movingSec | bilangan bulat | > 0 |
| elevationM | angka | ≥ 0 |
| category | `'hari_kerja'` \| `'sabtu_sore'` \| `'minggu_pagi'` \| `'lainnya'` | `'lainnya'` menunggu G-1 |
| type | `'metime'` \| `'bareng_anak'` | wajib |
| condition | `0`\|`1`\|`2` (😄 😐 😫) | wajib |
| note | teks ≤ 280 | opsional |
| startedAt | ts | hanya source recorded |
| elapsedSec | bilangan bulat | total termasuk jeda (recorded) |
| maxSpeedKmh | angka | opsional (recorded) |
| hasTrack | boolean | true untuk recorded |
| createdAt / updatedAt | ts | audit |
Kolom turunan (tidak disimpan): `avgSpeedKmh = distanceKm / (movingSec/3600)`.
Indeks: `date`, `source`.
Pada `source='recorded'`: `distanceKm`, `movingSec`, `elevationM`, `startedAt` **dikunci** (FR-142).

### track_points (Titik GPS)
| Kolom | Tipe | Aturan |
|---|---|---|
| rideId | teks | → rides.id |
| seq | bilangan bulat | urutan, awal 0 |
| ts | ts | |
| lat, lon | angka | 6 desimal |
| ele | angka? | tinggi sudah dihaluskan saat finalisasi; elevasi mentah hanya di memori selama merekam (D-24, tanpa `eleRaw`) |
| acc | angka | akurasi horizontal (m) |
| paused | boolean | titik direkam saat jeda otomatis (tidak dihitung jarak) |
Kunci: `[rideId+seq]`. Dihapus bersama gowes.

### active_recording (Rekaman Aktif / pemulihan)
Satu baris (`id='current'`): `startedAt`, `state` (`merekam`/`jeda`/`terputus`), `pausedTotalSec`, `lastPointTs`, statistik berjalan (`distanceKm`, `movingSec`, `elevationM`), dan titik-titik sementara di `active_points` (kolom seperti track_points tanpa rideId). Dihapus setelah Simpan atau Buang. (B1, FR-138/139)

### journals
`date` (kunci), `sleep` (`'segar'|'cukup'|'kurang'`), `fruitPortions` (bil. bulat ≥ 0), `kidMinutes` (bil. bulat ≥ 0), `createdAt`, `updatedAt`. Satu baris per hari.

### hydration
`date` (kunci), `ml` (bil. bulat ≥ 0). Hari baru mulai 0 (tidak perlu reset: baris baru per tanggal).

### body_logs
`date` (kunci; satu per tanggal, gabungan), `weightKg?` (20–300, 1 desimal), `waistCm?` (30–200), `mood?` (`0|1|2`), `updatedAt`. Minimal satu dari tiga terisi.

### checklist_items
`id`, `title` (1–60 karakter), `order`, `active` (boolean), `createdAt`. Menghapus = `active=false` (hasil lama tetap, B11).

### checklist_days
`[date+itemId]` kunci; `title` (salinan nama saat hari itu), `done` (boolean). Baris untuk hari ini dibuat saat Harian/Beranda dibuka (hari yang tak pernah dibuka tidak punya baris). Item yang ditambahkan di tengah hari muncul hari itu juga.

### kid_checks
`activityId` (kunci, mengacu konten statis), `done`, `updatedAt`.

### settings (kunci-nilai)
`monthlyTargetKm`, `idealWeightKg?`, `reminderTimes` (objek), `lastBackupAt`, `lastImportAt`, `ridesSinceBackup` (diturunkan dari rides.createdAt > lastBackupAt), `theme`, `backupSnoozeUntil`, `mapStyleUrl`, `safetyNoticeSeen`, `schemaVersion`.
Nilai awal: `monthlyTargetKm = 100` [ASSUMPTION].

## 3. Hubungan
```
rides 1 ── 0..1 jejak (track_points banyak)       [recorded saja]
checklist_items 1 ── * checklist_days             [salinan nama]
(journals, hydration, body_logs) berdiri sendiri, kunci = date
active_recording ──(Simpan)──► rides + track_points
```
Konten statis (ide anak, nutrisi, gerakan peregangan) berada di kode aplikasi, bukan di database.

## 4. Format cadangan JSON
```
{
 "app": "gowessehat", "schemaVersion": 1, "exportedAt": "ISO",
 "includesTracks": true,
 "rides": [...], "trackPoints": [[rideId, seq, ts, lat, lon, ele, acc, paused], ...],
 "journals": [...], "hydration": [...], "bodyLogs": [...],
 "checklistItems": [...], "checklistDays": [...], "kidChecks": [...], "settings": {...}
}
```
- Titik GPS disimpan sebagai larik ringkas agar file kecil. Pengguna dapat mematikan "sertakan jejak GPS" (G-3).
- Impor (D-22) = **ganti semua data**: validasi struktur, versi, dan tiap baris/titik dengan Zod (VAL-005) → batas ukuran **50 MB** → pratinjau (jumlah data lama vs baru) → konfirmasi → tulis **semua atau tidak sama sekali** (transaksi). Gagal di tengah = data lama utuh. **Diblokir bila ada rekaman aktif.**
- `schemaVersion` lebih baru dari aplikasi → ditolak dengan pesan "perbarui aplikasi".

## 5. Migrasi
Perubahan skema = versi Dexie baru + fungsi migrasi + uji. Tidak ada migrasi dari prototipe (tidak dibawa).

## 6. Keterlacakan
| Data | Requirement | Modul |
|---|---|---|
| rides | FR-010…015, FR-141/142, BR-009 | M1, M10 |
| track_points, active_recording | FR-138/139/144/146 | M10, M11 |
| journals, hydration | FR-030…041 | M3 |
| body_logs | FR-060…063 | M5 |
| checklist_* | FR-070…072 | M4 |
| kid_checks | FR-090 | M7 |
| settings | FR-022, FR-111/112, FR-121/122 | banyak |
