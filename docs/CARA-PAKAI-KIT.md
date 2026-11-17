# Cara Pakai Vibe Coding Kit Ini

## Isi folder
```
CLAUDE.md              ← jangan diedit, cuma jembatan ke pedoman.md
pedoman.md              ← aturan utama project (edit di sini kalau mau ubah aturan)
prompts/00-...16-...    ← prompt siap-copy untuk tiap fase
docs/                    ← hasil tiap fase disimpan di sini (PRD.md, dst)
```

## Langkah-langkah

1. **Ekstrak** isi kit ini ke dalam folder project kamu (root folder, sejajar dengan folder source code nanti / repo git).
2. **Fase dokumen (00–07):** buka `prompts/00-discovery.md`, copy isinya, paste ke chat atau CLI. Setelah hasilnya keluar, simpan sebagai file di `docs/` sesuai nama yang disebut di prompt (mis. `docs/PROJECT-CONTEXT.md`). Lanjut ke `prompts/01-...`, dst sampai `07-development-plan.md`.
3. **Fase coding (08 ke atas):** buka terminal, `cd` ke folder project ini, jalankan `claude` (atau `gemini`). CLI otomatis membaca `CLAUDE.md` → `pedoman.md`, jadi aturan main sudah aktif tanpa kamu ketik ulang.
4. Copy isi `prompts/08-develop-module.md`, ganti `[ISI NAMA MODULE]` dengan nama module yang mau dikerjakan (lihat `docs/MODULE-BREAKDOWN.md`), paste ke CLI.
5. Setelah module selesai dan lolos test → pakai `prompts/09-git-checkpoint.md` untuk commit.
6. Ulangi langkah 4–5 untuk tiap module.
7. Setelah semua module utama selesai → lanjut `prompts/10-e2e-baseline.md`, `11-security-redteam.md`, `12-security-hardening.md`, `13-cleanup-refactor.md`, `14-final-audit.md`, `15-uat-release.md`, `16-extract-skills.md` — urut, jangan lompat.

## Tips
- Kalau CLI kelihatan "lupa" pedoman.md setelah sesi panjang, cukup ketik: `baca ulang pedoman.md` — atau di Claude Code ketik `/memory` untuk cek file mana saja yang ke-load.
- Jangan taruh commit ke Git sebelum kamu benar-benar cek file yang berubah (`git status`, `git diff`).
- Skill hasil ekstraksi di fase 16 bisa dipindah ke `~/.claude/skills/` (folder home) kalau mau dipakai lagi di project lain di luar project ini.
