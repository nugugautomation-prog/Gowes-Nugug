import { describe, expect, it } from 'vitest'
import {
  applyWater,
  computeReadiness,
  validateJournal,
  waterThreshold,
  type ReadinessInput,
} from './readiness'

describe('waterThreshold (BR-011)', () => {
  it('0 sebelum 07:00, 2000 sejak 19:00, proporsional di antaranya', () => {
    expect(waterThreshold(6)).toBe(0)
    expect(waterThreshold(7)).toBe(0)
    expect(waterThreshold(13)).toBe(1000)
    expect(waterThreshold(19)).toBe(2000)
    expect(waterThreshold(23)).toBe(2000)
  })
  it('16:30 ≈ 1.583 ml', () => expect(Math.round(waterThreshold(16.5))).toBe(1583))
})

const j = (sleep: 'segar' | 'cukup' | 'kurang', fruitPortions: number) => ({ sleep, fruitPortions })
const base: ReadinessInput = {
  journalYesterday: j('segar', 2),
  hydrationTodayMl: 0,
  hydrationYesterdayMl: 0,
  hour: 14,
}

describe('computeReadiness', () => {
  it('AC-007: jurnal kemarin kosong → netral, bukan merah', () => {
    expect(computeReadiness({ ...base, journalYesterday: undefined })).toEqual({
      status: 'netral',
      score: null,
    })
  })
  it('AC-008: segar + buah 2 + air cukup → skor 4 = siap', () => {
    const r = computeReadiness({ ...base, hour: 16.5, hydrationTodayMl: 1600 })
    expect(r).toEqual({ status: 'siap', score: 4 })
  })
  it('air kurang dari ambang jam itu tidak memberi poin', () => {
    const r = computeReadiness({ ...base, hour: 16.5, hydrationTodayMl: 1500 })
    expect(r).toEqual({ status: 'siap', score: 3 }) // 2 + 1 + 0
  })
  it('batas skor: 3 siap, 2 santai, <2 istirahat', () => {
    expect(computeReadiness({ ...base, journalYesterday: j('cukup', 2) }).status).toBe('santai') // 1+1+0
    expect(
      computeReadiness({
        ...base,
        journalYesterday: j('cukup', 2),
        hour: 19,
        hydrationTodayMl: 2000,
      }).status,
    ).toBe('siap') // 3
    expect(computeReadiness({ ...base, journalYesterday: j('cukup', 1) }).status).toBe('istirahat') // 1
    expect(computeReadiness({ ...base, journalYesterday: j('kurang', 2) }).status).toBe('istirahat') // 1
    expect(computeReadiness({ ...base, journalYesterday: j('segar', 0) }).status).toBe('santai') // 2
  })
  it('buah 1 porsi tidak memberi poin, 2 memberi', () => {
    expect(computeReadiness({ ...base, journalYesterday: j('kurang', 1) }).score).toBe(0)
    expect(computeReadiness({ ...base, journalYesterday: j('kurang', 2) }).score).toBe(1)
  })
  it('D-20: sebelum 11:00 air memakai total kemarin ≥ 2.000', () => {
    const pagi = { ...base, hour: 8, hydrationTodayMl: 0 }
    expect(computeReadiness({ ...pagi, hydrationYesterdayMl: 2000 }).score).toBe(4)
    expect(computeReadiness({ ...pagi, hydrationYesterdayMl: 1999 }).score).toBe(3)
  })
  it('D-20: sejak 11:00 memakai air hari ini, bukan kemarin', () => {
    const r = computeReadiness({
      ...base,
      hour: 11,
      hydrationYesterdayMl: 3000,
      hydrationTodayMl: 0,
    })
    expect(r.score).toBe(3) // ambang(11)=667 → 0 < 667 → tanpa poin air
  })
  it('EC-10: jurnal diisi belakangan mengubah hasil', () => {
    expect(computeReadiness({ ...base, journalYesterday: undefined }).status).toBe('netral')
    expect(computeReadiness({ ...base }).status).not.toBe('netral')
  })
})

describe('applyWater (BR-023 / AC-010)', () => {
  it('+250 dan +500 menambah', () => {
    expect(applyWater(0, 250)).toBe(250)
    expect(applyWater(250, 500)).toBe(750)
  })
  it('koreksi mengurangi dan tidak pernah di bawah 0', () => {
    expect(applyWater(750, -250)).toBe(500)
    expect(applyWater(100, -250)).toBe(0)
  })
})

describe('validateJournal (VAL-004)', () => {
  const ok = { sleep: 'segar' as const, fruitPortions: 2, kidMinutes: 30 }
  it('valid', () => expect(validateJournal(ok)).toEqual({}))
  it('tidur wajib', () => expect(validateJournal({ ...ok, sleep: null }).sleep).toBeTruthy())
  it('buah bulat ≥ 0', () => {
    expect(validateJournal({ ...ok, fruitPortions: -1 }).fruitPortions).toBeTruthy()
    expect(validateJournal({ ...ok, fruitPortions: 1.5 }).fruitPortions).toBeTruthy()
    expect(validateJournal({ ...ok, fruitPortions: 0 }).fruitPortions).toBeUndefined()
  })
  it('menit 0–1440', () => {
    expect(validateJournal({ ...ok, kidMinutes: 1440 }).kidMinutes).toBeUndefined()
    expect(validateJournal({ ...ok, kidMinutes: 1441 }).kidMinutes).toBeTruthy()
    expect(validateJournal({ ...ok, kidMinutes: -5 }).kidMinutes).toBeTruthy()
  })
})
