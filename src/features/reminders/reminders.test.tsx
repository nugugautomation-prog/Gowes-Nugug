import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/database'
import { ensureDefaults, getSetting } from '../../db/settings'
import { ToastProvider } from '../../ui/Toast'
import { RemindersPage } from './RemindersPage'

let blobs: Blob[] = []

beforeEach(async () => {
  await db.settings.clear()
  await ensureDefaults(db)
  blobs = []
  URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
    blobs.push(b as Blob)
    return 'blob:test'
  })
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

const renderPage = () =>
  render(
    <ToastProvider>
      <RemindersPage />
    </ToastProvider>,
  )

describe('Halaman Pengingat (AC-017)', () => {
  it('menampilkan jam bawaan FR-111', async () => {
    renderPage()
    expect(await screen.findByLabelText('Jurnal malam')).toHaveValue('20:00')
    expect(screen.getByLabelText('Gowes Sabtu')).toHaveValue('16:30')
    expect(screen.getByLabelText('Gowes Minggu')).toHaveValue('06:00')
    expect(screen.getByLabelText('Minum air 1')).toHaveValue('09:00')
  })

  it('Buat file → unduh .ics berisi jam & RRULE, dan jam tersimpan', async () => {
    const user = userEvent.setup()
    renderPage()
    const sabtu = await screen.findByLabelText('Gowes Sabtu')
    await user.clear(sabtu)
    await user.type(sabtu, '17:00')
    await user.click(screen.getByRole('button', { name: 'Buat file kalender' }))
    await waitFor(() => expect(blobs).toHaveLength(1))
    const text = await blobs[0]!.text()
    expect(text).toContain('BEGIN:VCALENDAR')
    expect(text).toMatch(/DTSTART;TZID=Asia\/Jakarta:\d{8}T170000/)
    expect(text).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA')
    expect((await getSetting(db, 'reminderTimes')).sabtu).toBe('17:00')
  })

  it('hanya jenis terpilih yang masuk file', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByLabelText('Jurnal malam')
    for (const n of ['Minum air', 'Gowes Sabtu sore', 'Gowes Minggu pagi'])
      await user.click(screen.getByRole('button', { name: n }))
    await user.click(screen.getByRole('button', { name: 'Buat file kalender' }))
    await waitFor(() => expect(blobs).toHaveLength(1))
    const text = await blobs[0]!.text()
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(1)
    expect(text).toContain('Isi jurnal malam')
  })

  it('jam kosong ditolak tanpa mengunduh', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.clear(await screen.findByLabelText('Jurnal malam'))
    await user.click(screen.getByRole('button', { name: 'Buat file kalender' }))
    expect(await screen.findByText(/Periksa jam/)).toBeInTheDocument()
    expect(blobs).toHaveLength(0)
  })

  it('tanpa jenis dipilih ditolak', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByLabelText('Jurnal malam')
    for (const n of ['Minum air', 'Jurnal malam', 'Gowes Sabtu sore', 'Gowes Minggu pagi'])
      await user.click(screen.getByRole('button', { name: n }))
    await user.click(screen.getByRole('button', { name: 'Buat file kalender' }))
    expect(await screen.findByText(/minimal satu jenis/)).toBeInTheDocument()
    expect(blobs).toHaveLength(0)
  })
})
