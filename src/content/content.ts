// Konten statis (tanpa AI di v1). Aturan: BR-003 tidak menyebut sayur sebagai solusi;
// BR-004 saran bersifat umum, bukan nasihat medis. Dijaga oleh content.test.ts.

export const DISCLAIMER = 'Saran umum, bukan nasihat medis. Bila ada keluhan, tanyakan ke dokter.'

export interface KidIdea {
  id: string
  title: string
  tip: string
}

export const KID_IDEAS: KidIdea[] = [
  {
    id: 'berburu-warna',
    title: 'Berburu warna',
    tip: 'Cari benda berwarna merah, lalu biru, lalu kuning di sekitar rumah.',
  },
  {
    id: 'lomba-balon',
    title: 'Lomba balon',
    tip: 'Jaga balon agar tidak jatuh ke lantai selama satu lagu.',
  },
  {
    id: 'rintangan-bantal',
    title: 'Lintasan bantal',
    tip: 'Susun bantal jadi lintasan: lompat, merayap, melangkah.',
  },
  {
    id: 'cerita-gambar',
    title: 'Cerita dari gambar',
    tip: 'Gambar satu bentuk, minta anak melanjutkannya jadi cerita.',
  },
  {
    id: 'masak-bareng',
    title: 'Masak bareng',
    tip: 'Biarkan anak mengaduk atau menata bahan. Pilih tugas yang aman.',
  },
  {
    id: 'jalan-pagi',
    title: 'Jalan pagi keliling komplek',
    tip: 'Hitung berapa burung, kucing, atau motor yang terlihat.',
  },
  {
    id: 'tebak-gerakan',
    title: 'Tebak gerakan',
    tip: 'Peragakan hewan tanpa suara, anak menebak lalu gantian.',
  },
  {
    id: 'menara-balok',
    title: 'Menara balok',
    tip: 'Bangun menara setinggi mungkin, lalu bongkar sambil tertawa.',
  },
  {
    id: 'piknik-kecil',
    title: 'Piknik kecil',
    tip: 'Gelar tikar di teras atau taman dan makan camilan buah bersama.',
  },
  {
    id: 'dansa-musik',
    title: 'Dansa berhenti',
    tip: 'Menari saat musik jalan, berhenti seperti patung saat musik mati.',
  },
  {
    id: 'bacakan-buku',
    title: 'Baca buku bergantian',
    tip: 'Anak memilih buku, lalu kalian bergantian membaca satu halaman.',
  },
  {
    id: 'cuci-sepeda',
    title: 'Cuci sepeda bareng',
    tip: 'Beri anak spons dan tugas kecil untuk membersihkan roda.',
  },
]

export interface Pillar {
  id: string
  title: string
  body: string
  examples: string
}

export const PILLARS: Pillar[] = [
  {
    id: 'buah',
    title: 'Buah kaya serat',
    body: 'Buah memberi serat dan tenaga ringan. Targetkan beberapa porsi per hari.',
    examples: 'Pisang, apel, pepaya, jambu biji, pir.',
  },
  {
    id: 'karbo',
    title: 'Karbohidrat kompleks',
    body: 'Sumber tenaga yang bertahan lama, cocok sebelum gowes panjang.',
    examples: 'Nasi merah, oatmeal, ubi, singkong rebus, roti gandum.',
  },
  {
    id: 'protein',
    title: 'Protein',
    body: 'Membantu otot pulih setelah gowes.',
    examples: 'Telur, ayam, ikan, tempe, tahu, kacang-kacangan.',
  },
  {
    id: 'elektrolit',
    title: 'Elektrolit alami',
    body: 'Membantu menggantikan cairan yang hilang lewat keringat.',
    examples: 'Air kelapa, pisang, air putih dengan sedikit garam.',
  },
]

export interface Stretch {
  id: string
  area: string
  guide: string
}

/** Empat gerakan x 15 detik = 60 detik (FR-050). */
export const STRETCH_SECONDS = 15
export const STRETCHES: Stretch[] = [
  {
    id: 'leher',
    area: 'Leher',
    guide: 'Miringkan kepala pelan ke kanan lalu ke kiri. Bahu tetap rileks.',
  },
  {
    id: 'bahu',
    area: 'Bahu',
    guide: 'Putar kedua bahu ke belakang dengan gerakan besar dan lambat.',
  },
  {
    id: 'pergelangan',
    area: 'Pergelangan tangan',
    guide: 'Putar pergelangan tangan ke dua arah, lalu kepalkan dan buka jari.',
  },
  {
    id: 'pinggul',
    area: 'Pinggul',
    guide: 'Berdiri, putar pinggul membentuk lingkaran besar ke dua arah.',
  },
]
