import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { remainingSeconds } from '../domain/timer'
import { StretchCard } from '../features/stretch/StretchCard'
import { DISCLAIMER, STRETCHES, STRETCH_SECONDS } from './content'

describe('konten peregangan', () => {
  it('id unik; tiap gerakan punya langkah, tip, dan gambar', () => {
    const ids = STRETCHES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of STRETCHES) {
      expect(s.steps.length).toBeGreaterThanOrEqual(2)
      expect(s.tip.length).toBeGreaterThan(10)
      expect(s.figure).toBeTruthy()
    }
  })
  it('gerakan satu sisi selalu berpasangan kanan dan kiri', () => {
    const count = (side: 'kanan' | 'kiri') => STRETCHES.filter((s) => s.side === side).length
    expect(count('kanan')).toBe(count('kiri'))
    expect(count('kanan')).toBeGreaterThan(0)
  })
  it('lama tiap gerakan wajar dan tidak ada klaim medis', () => {
    expect(STRETCH_SECONDS).toBeGreaterThanOrEqual(10)
    expect(JSON.stringify(STRETCHES)).not.toMatch(/diagnosis|obat|terapi/i)
  })
})

describe('remainingSeconds', () => {
  it('tidak negatif dan tidak melebihi total', () => {
    expect(remainingSeconds(1000, 1000, 60)).toBe(60)
    expect(remainingSeconds(0, 30_000, 60)).toBe(30)
    expect(remainingSeconds(0, 99_000, 60)).toBe(0)
    expect(remainingSeconds(5000, 1000, 60)).toBe(60) // jam mundur
  })
})

describe('StretchCard (AC-011)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  const total = STRETCHES.length * STRETCH_SECONDS

  it('sebelum mulai: daftar gerakan, kapan melakukannya, dan disclaimer', () => {
    render(<StretchCard />)
    expect(screen.getByText(/sebelum gowes/)).toBeInTheDocument()
    expect(screen.getAllByText(/Leher/).length).toBeGreaterThan(0)
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`${STRETCHES.length} gerakan`))).toBeInTheDocument()
  })

  it('berjalan: langkah, sisi, dan gambar tampil; pindah gerakan tiap interval', () => {
    render(<StretchCard />)
    act(() => screen.getByRole('button', { name: 'Mulai' }).click())
    expect(screen.getByText(/Leher · sisi kanan/)).toBeInTheDocument()
    expect(screen.getByText(/telinga kanan mendekati bahu kanan/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Sisa \d+ detik/)).toBeInTheDocument()
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
    act(() => void vi.advanceTimersByTime((STRETCH_SECONDS + 1) * 1000))
    expect(screen.getByText(/Leher · sisi kiri/)).toBeInTheDocument()
  })

  it('Lewati langsung ke gerakan berikutnya', () => {
    render(<StretchCard />)
    act(() => screen.getByRole('button', { name: 'Mulai' }).click())
    act(() => screen.getByRole('button', { name: 'Lewati' }).click())
    expect(screen.getByText(/Leher · sisi kiri/)).toBeInTheDocument()
  })

  it('selesai seluruhnya dengan penanda', () => {
    render(<StretchCard />)
    act(() => screen.getByRole('button', { name: 'Mulai' }).click())
    act(() => void vi.advanceTimersByTime((total + 2) * 1000))
    expect(screen.getByRole('status')).toHaveTextContent('Selesai')
    expect(screen.getByRole('button', { name: 'Ulangi' })).toBeInTheDocument()
  })

  it('Berhenti membatalkan tanpa penanda selesai', () => {
    render(<StretchCard />)
    act(() => screen.getByRole('button', { name: 'Mulai' }).click())
    act(() => screen.getByRole('button', { name: 'Berhenti' }).click())
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByRole('button', { name: 'Mulai' })).toBeInTheDocument()
  })
})
