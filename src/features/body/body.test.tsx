import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Harian } from '../../app/pages/Harian'
import { Progres } from '../../app/pages/Progres'
import { db } from '../../db/database'
import { ensureDefaults, getSetting, setSetting } from '../../db/settings'
import { toLocalDate } from '../../domain/ride'
import { ToastProvider } from '../../ui/Toast'
import { deleteBodyLog, saveBodyLog } from './bodyRepo'

const today = toLocalDate(new Date())

beforeEach(async () => {
  await db.body_logs.clear()
  await db.settings.clear()
  await db.checklist_items.clear()
  await db.checklist_days.clear()
  await ensureDefaults(db)
})

function renderPage(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ToastProvider>{ui}</ToastProvider>
    </MemoryRouter>,
  )
}

describe('bodyRepo', () => {
  it('satu catatan per tanggal; merge menggabung tanpa menghapus nilai lain', async () => {
    await saveBodyLog('2026-11-10', { weightKg: 80.26, waistCm: 90 })
    await saveBodyLog('2026-11-10', { mood: 0 }) // mood cepat
    expect(await db.body_logs.count()).toBe(1)
    expect(await db.body_logs.get('2026-11-10')).toMatchObject({
      weightKg: 80.3,
      waistCm: 90,
      mood: 0,
    })
  })

  it('replace menimpa seluruh catatan (kolom dikosongkan ikut hilang)', async () => {
    await saveBodyLog('2026-11-10', { weightKg: 80, waistCm: 90, mood: 1 })
    await saveBodyLog('2026-11-10', { weightKg: 79 }, 'replace')
    const row = await db.body_logs.get('2026-11-10')
    expect(row?.weightKg).toBe(79)
    expect(row).not.toHaveProperty('waistCm')
    expect(row).not.toHaveProperty('mood')
  })

  it('menolak catatan kosong dan tidak menyimpan', async () => {
    await expect(saveBodyLog('2026-11-10', {})).rejects.toThrow()
    expect(await db.body_logs.count()).toBe(0)
  })

  it('hapus', async () => {
    await saveBodyLog('2026-11-10', { weightKg: 80 })
    await deleteBodyLog('2026-11-10')
    expect(await db.body_logs.count()).toBe(0)
  })
})

describe('Mood cepat di Harian', () => {
  it('menyimpan mood hari ini dan tidak menghapus berat yang sudah ada', async () => {
    await saveBodyLog(today, { weightKg: 80 })
    const user = userEvent.setup()
    renderPage(<Harian />)
    await user.click(await screen.findByRole('button', { name: 'Mood Segar' }))
    await waitFor(async () =>
      expect(await db.body_logs.get(today)).toMatchObject({ mood: 0, weightKg: 80 }),
    )
    expect(screen.getAllByRole('button', { name: 'Mood Segar' }).at(-1)).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('Tab Progres: tubuh & mood', () => {
  it('AC-012: berat, pinggang, mood tersimpan lewat form dan tampil di riwayat', async () => {
    const user = userEvent.setup()
    renderPage(<Progres />)
    await user.click(await screen.findByRole('button', { name: 'Catat' }))
    const sheet = await screen.findByRole('dialog')
    await user.type(within(sheet).getByLabelText('Berat (kg)'), '78,5')
    await user.type(within(sheet).getByLabelText('Lingkar pinggang (cm)'), '92')
    await user.click(within(sheet).getByRole('button', { name: 'Mood Biasa' }))
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    await waitFor(async () =>
      expect(await db.body_logs.get(today)).toMatchObject({ weightKg: 78.5, waistCm: 92, mood: 1 }),
    )
    expect(await screen.findByRole('button', { name: /^Catatan / })).toBeInTheDocument()
  })

  it('validasi: semua kosong dan berat di luar batas ditolak', async () => {
    const user = userEvent.setup()
    renderPage(<Progres />)
    await user.click(await screen.findByRole('button', { name: 'Catat' }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    expect(await within(sheet).findByText(/Isi minimal satu/)).toBeInTheDocument()
    await user.type(within(sheet).getByLabelText('Berat (kg)'), '5')
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    expect(await within(sheet).findByText(/antara 20 dan 300 kg/)).toBeInTheDocument()
    await user.clear(within(sheet).getByLabelText('Berat (kg)'))
    await user.type(within(sheet).getByLabelText('Berat (kg)'), 'abc')
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    expect(await within(sheet).findByText(/antara 20 dan 300 kg/)).toBeInTheDocument()
    expect(await db.body_logs.count()).toBe(0)
  })

  it('AC-012: jarak ke target berat tampil', async () => {
    await saveBodyLog('2026-11-10', { weightKg: 85.5 })
    await setSetting(db, 'idealWeightKg', 80)
    renderPage(<Progres />)
    expect(await screen.findByText(/5,5 kg di atas target/)).toBeInTheDocument()
  })

  it('target berat ideal bisa diatur dan divalidasi', async () => {
    const user = userEvent.setup()
    renderPage(<Progres />)
    const input = await screen.findByLabelText('Target berat ideal (kg)')
    await user.type(input, '10')
    await user.click(screen.getByRole('button', { name: 'Simpan target' }))
    expect(await screen.findByText(/antara 20 dan 300 kg/)).toBeInTheDocument()
    await user.clear(input)
    await user.type(input, '72,5')
    await user.click(screen.getByRole('button', { name: 'Simpan target' }))
    await waitFor(async () => expect(await getSetting(db, 'idealWeightKg')).toBe(72.5))
  })

  it('AC-012: edit menimpa catatan, hapus meminta konfirmasi', async () => {
    await saveBodyLog('2026-11-10', { weightKg: 80, waistCm: 90 })
    const user = userEvent.setup()
    renderPage(<Progres />)
    await user.click(await screen.findByRole('button', { name: /^Catatan / }))
    const sheet = await screen.findByRole('dialog')
    const w = within(sheet).getByLabelText('Berat (kg)')
    expect(w).toHaveValue('80')
    await user.clear(w)
    await user.type(w, '79,2')
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    await waitFor(async () => expect((await db.body_logs.get('2026-11-10'))?.weightKg).toBe(79.2))

    await user.click(await screen.findByRole('button', { name: /^Catatan / }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Hapus' }),
    )
    const confirm = await screen.findByRole('alertdialog')
    expect(confirm).toHaveTextContent('10 Nov 2026')
    await user.click(within(confirm).getByRole('button', { name: 'Hapus' }))
    await waitFor(async () => expect(await db.body_logs.count()).toBe(0))
  })

  it('saran menimbang muncul bila belum ada berat, dan tanpa NaN', async () => {
    renderPage(<Progres />)
    expect(await screen.findByText(/Belum ada catatan berat/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/)
  })
})
