# GowesSehat

PWA satu pengguna untuk HP Android: memantau gowes, kebugaran harian, dan waktu bareng anak, plus mode cyclocomp (rekam GPS, peta, ekspor GPX). Tanpa server, tanpa login; data tersimpan di HP.

Status: **dalam pengembangan (M0 Fondasi)**. Rencana dan keputusan ada di [`docs/`](docs/).

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm install` | Pasang dependensi |
| `npm run dev` | Server pengembangan di `http://localhost:5173` |
| `npm run phone` | Build produksi + `vite preview` di `http://localhost:4173` (untuk uji PWA/Service Worker di HP) |
| `npm test` | Uji Vitest |
| `npm run lint` · `npm run typecheck` | Pemeriksaan kode |
| `npm run build` | Build produksi ke `dist/` |
| `npm run icons` | Buat ulang ikon PNG di `public/icons/` |

## Mencoba di HP Android (lokal)

GPS, Wake Lock, dan pemasangan PWA hanya jalan di `localhost` atau HTTPS, jadi alamat IP Wi-Fi **tidak** dipakai.

1. Di HP: Opsi Pengembang → aktifkan **Debugging USB**; sambungkan kabel USB data dan setujui "Izinkan debugging USB".
2. Di komputer: `adb devices` (HP harus berstatus `device`).
3. `adb reverse tcp:5173 tcp:5173` lalu buka `http://localhost:5173` di Brave HP (mode dev), **atau**
   `npm run phone`, `adb reverse tcp:4173 tcp:4173`, dan buka `http://localhost:4173` (untuk uji Service Worker/pemasangan).
4. Buka **Lainnya → Uji kelayakan HP**.

## Privasi

Repo ini publik. Jangan commit data pribadi: file cadangan JSON, jejak GPS nyata, atau folder `Referensi/` (sudah di `.gitignore`). Data uji harus palsu.

## Dokumentasi

`docs/PRD.md`, `docs/DESIGN-BRIEF.md`, `docs/SYSTEM-DESIGN.md`, `docs/MODULE-BREAKDOWN.md`, `docs/DEVELOPMENT-PLAN.md`, `docs/TEST-PLAN.md`, `docs/DECISION-LOG.md`, dan lainnya.
