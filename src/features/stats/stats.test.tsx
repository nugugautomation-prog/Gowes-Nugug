import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Gowes } from '../../app/pages/Gowes'
import { db } from '../../db/database'
import { ensureDefaults, getSetting, setSetting } from '../../db/settings'
import { ToastProvider } from '../../ui/Toast'
import { weeksInMonth } from '../../domain/stats'

beforeEach(async () => {
  await db.rides.clear()
  await db.settings.clear()
  await ensureDefaults(db)
})

function renderGowes() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Gowes />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('Target & grafik di tab Gowes', () => {
  it('AC-005: target 130 menghitung garis mingguan = 130 ÷ pekan bulan ini', async () => {
    const user = userEvent.setup()
    renderGowes()
    await user.type(await screen.findByLabelText('Target lain (km)'), '130')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    await waitFor(async () => expect(await getSetting(db, 'monthlyTargetKm')).toBe(130))
    const now = new Date()
    const weekly = (130 / weeksInMonth(now.getFullYear(), now.getMonth() + 1))
      .toFixed(1)
      .replace('.', ',')
    expect(await screen.findByText(`Target mingguan ${weekly} km`)).toBeInTheDocument()
  })

  it('4 tombol cepat menyimpan target', async () => {
    const user = userEvent.setup()
    renderGowes()
    await user.click(await screen.findByRole('button', { name: '150' }))
    await waitFor(async () => expect(await getSetting(db, 'monthlyTargetKm')).toBe(150))
  })

  it('target tidak valid ditolak dan tidak tersimpan', async () => {
    const user = userEvent.setup()
    renderGowes()
    await user.type(await screen.findByLabelText('Target lain (km)'), '0')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(await screen.findByText('Target harus lebih dari 0')).toBeInTheDocument()
    expect(await getSetting(db, 'monthlyTargetKm')).toBe(100)
  })

  it('AC-006: garis target hanya muncul untuk metrik Jarak', async () => {
    const user = userEvent.setup()
    renderGowes()
    expect(await screen.findByText(/Target mingguan/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Elevasi' }))
    expect(screen.queryByText(/Target mingguan/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Waktu' }))
    expect(screen.queryByText(/Target mingguan/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Jarak' }))
    expect(screen.getByText(/Target mingguan/)).toBeInTheDocument()
  })

  it('AC-003: mengubah jarak gowes mengubah total bulan dan grafik', async () => {
    const today = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    const date = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`
    await setSetting(db, 'monthlyTargetKm', 100)
    await db.rides.add({
      id: 'x',
      date,
      source: 'manual',
      distanceKm: 40,
      movingSec: 7200,
      elevationM: 0,
      category: 'hari_kerja',
      type: 'metime',
      condition: 1,
      hasTrack: false,
      createdAt: 1,
      updatedAt: 1,
    })
    renderGowes()
    expect(await screen.findByText(/dari 100 km \(40%\)/)).toBeInTheDocument()
    await db.rides.update('x', { distanceKm: 55 })
    expect(await screen.findByText(/dari 100 km \(55%\)/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /55,0 km/ })).toBeInTheDocument()
  })

  it('tanpa data: grafik menampilkan "Belum ada data" dan tanpa NaN', async () => {
    renderGowes()
    expect(await screen.findByText('Belum ada data')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/)
  })
})
