import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Beranda } from '../../app/pages/Beranda'
import { Harian } from '../../app/pages/Harian'
import { db } from '../../db/database'
import { ensureDefaults } from '../../db/settings'
import { toLocalDate } from '../../domain/ride'
import { addDays } from '../../domain/stats'
import { ToastProvider } from '../../ui/Toast'
import { changeWater, saveJournal } from './dailyRepo'

const today = toLocalDate(new Date())
const yesterday = addDays(today, -1)

beforeEach(async () => {
  await db.journals.clear()
  await db.hydration.clear()
  await db.rides.clear()
  await db.settings.clear()
  await ensureDefaults(db)
})

function renderPage(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>,
  )
}

describe('dailyRepo', () => {
  it('AC-010: +250, +500 menambah; koreksi mengurangi; tidak di bawah 0', async () => {
    expect(await changeWater(today, 250)).toBe(250)
    expect(await changeWater(today, 500)).toBe(750)
    expect(await changeWater(today, -250)).toBe(500)
    expect(await changeWater(today, -9999)).toBe(0)
  })
  it('AC-010: hari baru mulai 0 (baris terpisah per tanggal)', async () => {
    await changeWater(yesterday, 1000)
    expect((await db.hydration.get(today))?.ml).toBeUndefined()
    expect(await changeWater(today, 250)).toBe(250)
    expect((await db.hydration.get(yesterday))?.ml).toBe(1000)
  })
  it('jurnal: simpan ulang menimpa dan mempertahankan createdAt', async () => {
    await saveJournal(today, { sleep: 'cukup', fruitPortions: 1, kidMinutes: 15 })
    const first = await db.journals.get(today)
    await saveJournal(today, { sleep: 'segar', fruitPortions: 2, kidMinutes: 30 })
    const second = await db.journals.get(today)
    expect(await db.journals.count()).toBe(1)
    expect(second).toMatchObject({ sleep: 'segar', fruitPortions: 2, kidMinutes: 30 })
    expect(second?.createdAt).toBe(first?.createdAt)
  })
})

describe('tab Harian', () => {
  it('tombol air menambah total dan menyimpan', async () => {
    const user = userEvent.setup()
    renderPage(<Harian />)
    await user.click(await screen.findByRole('button', { name: '+250' }))
    await user.click(screen.getByRole('button', { name: '+500' }))
    await waitFor(async () => expect((await db.hydration.get(today))?.ml).toBe(750))
    expect(await screen.findByText('750')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Koreksi/ }))
    await waitFor(async () => expect((await db.hydration.get(today))?.ml).toBe(500))
  })

  it('jurnal tanpa pilihan tidur ditolak dengan pesan', async () => {
    const user = userEvent.setup()
    renderPage(<Harian />)
    await user.click(await screen.findByRole('button', { name: 'Simpan jurnal' }))
    expect(await screen.findByText('Pilih kualitas tidur')).toBeInTheDocument()
    expect(await db.journals.count()).toBe(0)
  })

  it('AC-009: jurnal bisa diisi untuk kemarin', async () => {
    const user = userEvent.setup()
    renderPage(<Harian />)
    await user.click(await screen.findByRole('button', { name: 'Kemarin' }))
    await user.click(await screen.findByRole('button', { name: 'Segar' }))
    await user.click(screen.getByRole('button', { name: 'Tambah Buah serat' }))
    await user.click(screen.getByRole('button', { name: 'Tambah Buah serat' }))
    const menit = screen.getByLabelText('Main bareng anak (menit)')
    await user.clear(menit)
    await user.type(menit, '20')
    await user.click(screen.getByRole('button', { name: 'Simpan jurnal' }))
    await waitFor(async () =>
      expect(await db.journals.get(yesterday)).toMatchObject({
        sleep: 'segar',
        fruitPortions: 2,
        kidMinutes: 20,
      }),
    )
    expect(await db.journals.get(today)).toBeUndefined()
  })

  it('memuat jurnal tersimpan saat berganti hari', async () => {
    await saveJournal(yesterday, { sleep: 'kurang', fruitPortions: 3, kidMinutes: 0 })
    const user = userEvent.setup()
    renderPage(<Harian />)
    await user.click(await screen.findByRole('button', { name: 'Kemarin' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Kurang' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
  })
})

describe('menit bareng anak (kolom bebas)', () => {
  it('menolak menit di luar 0–1440 atau bukan angka, tanpa menyimpan', async () => {
    const user = userEvent.setup()
    renderPage(<Harian />)
    await user.click(await screen.findByRole('button', { name: 'Segar' }))
    const menit = screen.getByLabelText('Main bareng anak (menit)')
    for (const bad of ['1441', 'abc', '12,5']) {
      await user.clear(menit)
      await user.type(menit, bad)
      await user.click(screen.getByRole('button', { name: 'Simpan jurnal' }))
      expect(await screen.findByText(/Menit harus antara 0 dan 1440/)).toBeInTheDocument()
    }
    expect(await db.journals.count()).toBe(0)
  })
  it('kolom kosong dianggap 0', async () => {
    const user = userEvent.setup()
    renderPage(<Harian />)
    await user.click(await screen.findByRole('button', { name: 'Segar' }))
    await user.clear(screen.getByLabelText('Main bareng anak (menit)'))
    await user.click(screen.getByRole('button', { name: 'Simpan jurnal' }))
    await waitFor(async () => expect((await db.journals.get(today))?.kidMinutes).toBe(0))
  })
})

describe('kesiapan di Beranda', () => {
  it('AC-007: jurnal kemarin kosong → "Belum ada data", bukan merah', async () => {
    renderPage(<Beranda />)
    const card = (await screen.findByText('Kesiapan gowes')).closest('div')!
    expect(await within(card).findByText(/Belum ada data/)).toBeInTheDocument()
    expect(screen.queryByText(/Istirahat/)).not.toBeInTheDocument()
  })

  it('AC-009/EC-10: jurnal kemarin diisi belakangan mengubah status; status selalu ikon + teks', async () => {
    renderPage(<Beranda />)
    expect(await screen.findByText(/Belum ada data/)).toBeInTheDocument()
    await saveJournal(yesterday, { sleep: 'kurang', fruitPortions: 0, kidMinutes: 0 })
    expect(await screen.findByText(/Istirahat/)).toBeInTheDocument()
    expect(screen.getByText(/!/, { selector: 'span[aria-hidden="true"]' })).toBeInTheDocument()
  })

  it('AC-008: tidur segar + buah 2 + air cukup → Siap', async () => {
    await saveJournal(yesterday, { sleep: 'segar', fruitPortions: 2, kidMinutes: 0 })
    await changeWater(yesterday, 2000) // air pagi (D-20) memakai total kemarin
    await changeWater(today, 2500) // air hari ini melebihi ambang di jam berapa pun
    renderPage(<Beranda />)
    expect(await screen.findByText(/^Siap$/, { exact: false })).toBeInTheDocument()
  })
})

describe('useNow', () => {
  it('menyegarkan waktu sesuai interval', async () => {
    const { useNow } = await import('../../ui/useNow')
    const { renderHook, act } = await import('@testing-library/react')
    const { vi } = await import('vitest')
    vi.useFakeTimers()
    const { result } = renderHook(() => useNow(1000))
    const first = result.current.getTime()
    act(() => {
      vi.advanceTimersByTime(61_000)
    })
    expect(result.current.getTime()).toBeGreaterThan(first)
    vi.useRealTimers()
  })
})
