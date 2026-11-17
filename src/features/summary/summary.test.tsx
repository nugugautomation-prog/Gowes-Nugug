import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Progres } from '../../app/pages/Progres'
import { db } from '../../db/database'
import { ensureDefaults } from '../../db/settings'
import { addDays, weekStart } from '../../domain/stats'
import { toLocalDate } from '../../domain/ride'
import { ToastProvider } from '../../ui/Toast'
import { addManualRide } from '../rides/rideRepo'

const today = toLocalDate(new Date())

beforeEach(async () => {
  for (const t of [db.rides, db.body_logs, db.checklist_days, db.checklist_items, db.settings])
    await t.clear()
  await ensureDefaults(db)
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Progres />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('Tab Progres: ringkasan pekan & keseimbangan', () => {
  it('AC-014: tanpa data → "belum ada data", tanpa NaN/Infinity', async () => {
    renderPage()
    expect(await screen.findByText(/Belum ada data di pekan ini/)).toBeInTheDocument()
    expect(screen.getByText(/Belum ada gowes bulan ini/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/)
  })

  it('AC-014: pekan berjalan berlabel "baru N dari 7 hari" (kecuali hari Minggu)', async () => {
    renderPage()
    await screen.findByText(/Belum ada data di pekan ini/)
    const isSunday = new Date().getDay() === 0
    const label = screen.queryByText(/baru \d dari 7 hari/)
    if (isSunday) expect(label).toBeNull()
    else expect(label).toBeInTheDocument()
  })

  it('menampilkan total gowes pekan ini dan batang keseimbangan mengikuti jenis (AC-015)', async () => {
    await addManualRide({
      date: today,
      distanceKm: 20,
      movingSec: 3600,
      elevationM: 100,
      category: 'lainnya',
      type: 'metime',
      condition: 1,
    })
    await addManualRide({
      date: today,
      distanceKm: 10,
      movingSec: 1800,
      elevationM: 50,
      category: 'lainnya',
      type: 'bareng_anak',
      condition: 0,
    })
    renderPage()
    expect(await screen.findByText('2 kali')).toBeInTheDocument()
    expect(screen.getByText('30,0 km')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Me-time 50 persen, Bareng anak 50 persen' }),
    ).toBeInTheDocument()
  })

  it('pemilih pekan: mundur ke pekan lalu, maju dikunci di pekan berjalan', async () => {
    const user = userEvent.setup()
    renderPage()
    const next = await screen.findByRole('button', { name: 'Pekan berikutnya' })
    expect(next).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Pekan sebelumnya' }))
    expect(screen.getByRole('button', { name: 'Pekan berikutnya' })).toBeEnabled()
    expect(screen.queryByText(/baru \d dari 7 hari/)).toBeNull()
    const prev = addDays(weekStart(today), -7)
    expect(
      within(screen.getByRole('heading', { name: 'Ringkasan pekan' }).parentElement!).getByText(
        new RegExp(String(Number(prev.slice(8)))),
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Pekan berikutnya' }))
    expect(screen.getByRole('button', { name: 'Pekan berikutnya' })).toBeDisabled()
  })
})
