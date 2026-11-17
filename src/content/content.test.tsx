import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/database'
import { pickNext, remainingSeconds } from '../domain/ideas'
import { KidIdeasPage } from '../features/kids/KidIdeasPage'
import { NutritionPage } from '../features/nutrition/NutritionPage'
import { StretchCard } from '../features/stretch/StretchCard'
import { DISCLAIMER, KID_IDEAS, PILLARS, STRETCHES, STRETCH_SECONDS } from './content'

describe('pemindai konten (BR-003, AC-016)', () => {
  const all = JSON.stringify({ KID_IDEAS, PILLARS, STRETCHES, DISCLAIMER })
  it('tidak ada kata sayur di konten statis', () => {
    expect(all).not.toMatch(/sayur/i)
  })
  it('id unik dan konten tidak kosong', () => {
    const ids = KID_IDEAS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThanOrEqual(8)
    expect(PILLARS).toHaveLength(4)
  })
  it('timer: empat gerakan menjumlah 60 detik', () => {
    expect(STRETCHES.length * STRETCH_SECONDS).toBe(60)
  })
})

describe('pickNext (FR-091)', () => {
  const ids = ['a', 'b', 'c']
  it('tidak pernah mengembalikan ide yang sama berturut-turut', () => {
    for (let i = 0; i < 200; i++) expect(pickNext(ids, 'b')).not.toBe('b')
  })
  it('bisa menjangkau semua ide lain', () => {
    expect(pickNext(ids, 'a', () => 0)).toBe('b')
    expect(pickNext(ids, 'a', () => 0.999)).toBe('c')
  })
  it('kasus tepi: kosong dan satu ide', () => {
    expect(pickNext([], null)).toBeNull()
    expect(pickNext(['x'], 'x')).toBe('x')
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

describe('Halaman konten', () => {
  beforeEach(async () => {
    await db.kid_checks.clear()
  })

  it('AC-015: ceklis anak tersimpan dan bertahan setelah dimuat ulang', async () => {
    const user = userEvent.setup()
    const first = render(
      <MemoryRouter>
        <KidIdeasPage />
      </MemoryRouter>,
    )
    const box = await screen.findByRole('checkbox', { name: /Berburu warna/ })
    await user.click(box)
    await waitFor(async () =>
      expect(await db.kid_checks.get('berburu-warna')).toMatchObject({ done: true }),
    )
    await waitFor(() => expect(box).toBeChecked())
    first.unmount()

    render(
      <MemoryRouter>
        <KidIdeasPage />
      </MemoryRouter>,
    )
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /Berburu warna/ })).toBeChecked(),
    )
  })

  it('"Ide Baru" mengganti ide hari ini dan disclaimer tampil', async () => {
    const user = userEvent.setup()
    render(<KidIdeasPage rng={() => 0} />)
    const heading = () => screen.getAllByRole('heading', { level: 2 })[0]?.textContent
    const before = heading()
    await user.click(screen.getByRole('button', { name: 'Ide Baru' }))
    expect(heading()).not.toBe(before)
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
  })

  it('panduan nutrisi memuat 4 pilar tanpa kata sayur dan ada disclaimer', () => {
    render(<NutritionPage />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)
    expect(document.body.textContent).not.toMatch(/sayur/i)
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument()
  })
})

describe('StretchCard (AC-011)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('berjalan 60 detik, berpindah gerakan, lalu selesai dengan penanda', () => {
    render(<StretchCard />)
    act(() => screen.getByRole('button', { name: 'Mulai' }).click())
    expect(screen.getByText(/1\/4 · Leher/)).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(16_000))
    expect(screen.getByText(/2\/4 · Bahu/)).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(45_000))
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
