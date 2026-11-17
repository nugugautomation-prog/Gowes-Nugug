// Konten statis (tanpa AI di v1). BR-004: saran bersifat umum, bukan nasihat medis.
// Ide bareng anak dan panduan nutrisi dihapus (D-26).

export const DISCLAIMER = 'Saran umum, bukan nasihat medis. Bila ada keluhan, tanyakan ke dokter.'

export type FigureId = 'leher' | 'bahu' | 'pergelangan' | 'paha'

export interface Stretch {
  id: string
  /** Bagian tubuh yang diregangkan. */
  area: string
  /** Sisi yang diregangkan; undefined = kedua sisi sekaligus. */
  side?: 'kanan' | 'kiri'
  figure: FigureId
  /** Langkah berurutan: apa yang dilakukan. */
  steps: string[]
  /** Yang seharusnya terasa, dan batas aman. */
  tip: string
}

/** Lama tiap gerakan (detik). Satu sisi = satu gerakan. */
export const STRETCH_SECONDS = 15

export const STRETCH_INTRO =
  'Lakukan sebelum gowes sebagai pemanasan dan sesudah gowes untuk melemaskan otot. Bergeraklah pelan, napas biasa, dan berhenti bila terasa nyeri (bukan sekadar tertarik).'

export const STRETCHES: Stretch[] = [
  {
    id: 'leher-kanan',
    area: 'Leher',
    side: 'kanan',
    figure: 'leher',
    steps: [
      'Berdiri atau duduk tegak, kedua bahu turun dan rileks.',
      'Miringkan kepala ke kanan: telinga kanan mendekati bahu kanan.',
      'Tangan kanan boleh menekan lembut sisi kepala. Tahan sambil bernapas pelan.',
    ],
    tip: 'Tarikan terasa di sisi kiri leher. Jangan angkat bahu kiri.',
  },
  {
    id: 'leher-kiri',
    area: 'Leher',
    side: 'kiri',
    figure: 'leher',
    steps: [
      'Tegakkan kepala, bahu tetap turun.',
      'Miringkan kepala ke kiri: telinga kiri mendekati bahu kiri.',
      'Tangan kiri boleh menekan lembut sisi kepala. Tahan sambil bernapas pelan.',
    ],
    tip: 'Tarikan terasa di sisi kanan leher. Jangan angkat bahu kanan.',
  },
  {
    id: 'bahu',
    area: 'Bahu',
    figure: 'bahu',
    steps: [
      'Berdiri tegak, lengan di samping badan.',
      'Angkat kedua bahu ke arah telinga, lalu putar ke belakang membentuk lingkaran besar.',
      'Ulangi pelan dan berkesinambungan selama waktu berjalan.',
    ],
    tip: 'Bahu dan punggung atas terasa mengendur. Bagus untuk posisi membungkuk di sepeda.',
  },
  {
    id: 'pergelangan-kanan',
    area: 'Pergelangan tangan',
    side: 'kanan',
    figure: 'pergelangan',
    steps: [
      'Luruskan lengan kanan ke depan setinggi dada, telapak menghadap ke atas.',
      'Dengan tangan kiri, tarik pelan jari-jari tangan kanan ke arah badan.',
      'Tahan. Siku kanan tetap lurus.',
    ],
    tip: 'Tarikan terasa di sisi bawah lengan. Penting untuk tangan yang menahan setang.',
  },
  {
    id: 'pergelangan-kiri',
    area: 'Pergelangan tangan',
    side: 'kiri',
    figure: 'pergelangan',
    steps: [
      'Luruskan lengan kiri ke depan setinggi dada, telapak menghadap ke atas.',
      'Dengan tangan kanan, tarik pelan jari-jari tangan kiri ke arah badan.',
      'Tahan. Siku kiri tetap lurus.',
    ],
    tip: 'Tarikan terasa di sisi bawah lengan. Penting untuk tangan yang menahan setang.',
  },
  {
    id: 'paha-kanan',
    area: 'Paha depan dan pinggul',
    side: 'kanan',
    figure: 'paha',
    steps: [
      'Berdiri tegak, pegang dinding atau sandaran kursi bila perlu.',
      'Tekuk lutut kanan ke belakang, pegang pergelangan kaki kanan dengan tangan kanan.',
      'Tarik tumit mendekati bokong, dorong pinggul sedikit ke depan. Lutut menunjuk ke lantai.',
    ],
    tip: 'Tarikan terasa di paha depan kanan. Punggung tetap tegak, jangan melengkung.',
  },
  {
    id: 'paha-kiri',
    area: 'Paha depan dan pinggul',
    side: 'kiri',
    figure: 'paha',
    steps: [
      'Berdiri tegak, pegang dinding atau sandaran kursi bila perlu.',
      'Tekuk lutut kiri ke belakang, pegang pergelangan kaki kiri dengan tangan kiri.',
      'Tarik tumit mendekati bokong, dorong pinggul sedikit ke depan. Lutut menunjuk ke lantai.',
    ],
    tip: 'Tarikan terasa di paha depan kiri. Punggung tetap tegak, jangan melengkung.',
  },
]
