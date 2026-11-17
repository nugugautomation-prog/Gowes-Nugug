import { describe, expect, it } from 'vitest'
import type { BodyLog } from '../db/types'
import {
  gapToTarget,
  latestWeightLog,
  roundWeight,
  shouldSuggestWeighing,
  validateBody,
  validateIdealWeight,
} from './body'

const today = '2026-11-17'
const ok = { date: today, weightKg: 80, waistCm: 90, mood: 0 as const }

describe('validateBody (VAL-003)', () => {
  it('data wajar lolos', () => expect(validateBody(ok, today)).toEqual({}))
  it('batas berat 20–300', () => {
    expect(validateBody({ ...ok, weightKg: 19.9 }, today).weightKg).toBeTruthy()
    expect(validateBody({ ...ok, weightKg: 20 }, today).weightKg).toBeUndefined()
    expect(validateBody({ ...ok, weightKg: 300 }, today).weightKg).toBeUndefined()
    expect(validateBody({ ...ok, weightKg: 300.1 }, today).weightKg).toBeTruthy()
  })
  it('batas pinggang 30–200', () => {
    expect(validateBody({ ...ok, waistCm: 29 }, today).waistCm).toBeTruthy()
    expect(validateBody({ ...ok, waistCm: 200 }, today).waistCm).toBeUndefined()
    expect(validateBody({ ...ok, waistCm: 201 }, today).waistCm).toBeTruthy()
  })
  it('salah satu dari berat/pinggang/mood boleh kosong, semua kosong ditolak', () => {
    expect(validateBody({ ...ok, weightKg: null, waistCm: null }, today)).toEqual({})
    expect(validateBody({ ...ok, waistCm: null, mood: null }, today)).toEqual({})
    expect(
      validateBody({ ...ok, weightKg: null, waistCm: null, mood: null }, today).any,
    ).toBeTruthy()
  })
  it('tanggal masa depan ditolak', () => {
    expect(validateBody({ ...ok, date: '2026-11-18' }, today).date).toBeTruthy()
  })
})

describe('target berat', () => {
  it('validateIdealWeight', () => {
    expect(validateIdealWeight(70)).toBeNull()
    expect(validateIdealWeight(null)).toBeTruthy()
    expect(validateIdealWeight(10)).toBeTruthy()
  })
  it('gapToTarget: di atas, di bawah, tepat', () => {
    expect(gapToTarget(85.5, 80)).toEqual({ state: 'di_atas', kg: 5.5 })
    expect(gapToTarget(78, 80)).toEqual({ state: 'di_bawah', kg: 2 })
    expect(gapToTarget(80.04, 80)).toEqual({ state: 'tepat', kg: 0 })
  })
  it('roundWeight 1 desimal', () => expect(roundWeight(80.26)).toBe(80.3))
})

const log = (date: string, weightKg?: number): BodyLog => ({ date, weightKg, updatedAt: 1 })

describe('latestWeightLog & saran menimbang (FR-061)', () => {
  it('mengambil catatan berat terbaru, mengabaikan yang tanpa berat', () => {
    const logs = [log('2026-11-01', 82), log('2026-11-10', 81), log('2026-11-15')]
    expect(latestWeightLog(logs)?.date).toBe('2026-11-10')
    expect(latestWeightLog([log('2026-11-15')])).toBeUndefined()
  })
  it('saran muncul bila belum pernah, atau ≥ 7 hari', () => {
    expect(shouldSuggestWeighing([], today)).toBe(true)
    expect(shouldSuggestWeighing([log('2026-11-10', 80)], today)).toBe(true) // tepat 7 hari
    expect(shouldSuggestWeighing([log('2026-11-11', 80)], today)).toBe(false) // 6 hari
    expect(shouldSuggestWeighing([log('2026-11-17', 80)], today)).toBe(false)
  })
})
