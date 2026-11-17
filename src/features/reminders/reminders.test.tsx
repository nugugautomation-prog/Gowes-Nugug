import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db/database'
import { ensureDefaults } from '../../db/settings'
import { addDays } from '../../domain/stats'
import { toLocalDate } from '../../domain/ride'
import { ToastProvider } from '../../ui/Toast'
import { RemindersPage } from './RemindersPage'
import { addReminder, deleteReminder, restoreReminder, updateReminder } from './remindersRepo'
import { UpcomingCard } from './UpcomingCard'

const today = toLocalDate(new Date())
let blobs: Blob[] = []

beforeEach(async () => {
  for (const t of db.tables) await t.clear()
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
    <MemoryRouter>
      <ToastProvider>
        <RemindersPage />
      </ToastProvider>
    </MemoryRouter>,
  )

const base = {
  title: 'Servis sepeda',
  date: addDays(today, 3),
  time: '08:00',
  repeat: 'none' as const,
}

describe('remindersRepo', () => {
  it('menyimpan, mengubah, menghapus, dan memulihkan', async () => {
    const r = await addReminder({ ...base, note: '  bawa kunci ' })
    expect(r).toMatchObject({ title: 'Servis sepeda', note: 'bawa kunci', done: false })
    await updateReminder(r.id, { ...base, title: 'Servis rem', repeat: 'weekly' })
    expect(await db.reminders.get(r.id)).toMatchObject({ title: 'Servis rem', repeat: 'weekly' })
    expect(await db.reminders.get(r.id)).not.toHaveProperty('note')
    const snap = await deleteReminder(r.id)
    expect(await db.reminders.count()).toBe(0)
    await restoreReminder(snap!)
    expect(await db.reminders.count()).toBe(1)
  })
  it('menolak data tidak valid tanpa menyimpan', async () => {
    await expect(addReminder({ ...base, title: ' ' })).rejects.toThrow()
    await expect(addReminder({ ...base, time: '99:99' })).rejects.toThrow()
    expect(await db.reminders.count()).toBe(0)
  })
  it('mengubah waktu pengingat yang selesai mengaktifkannya lagi', async () => {
    const r = await addReminder(base)
    await db.reminders.update(r.id, { done: true })
    await updateReminder(r.id, { ...base, time: '09:30' })
    expect((await db.reminders.get(r.id))?.done).toBe(false)
  })
})

describe('Halaman Pengingat', () => {
  it('kosong: ajakan membuat pengingat', async () => {
    renderPage()
    expect(await screen.findByText('Belum ada pengingat')).toBeInTheDocument()
  })

  it('membuat pengingat lewat form dan tampil di "Akan datang"', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Tambah' }))
    const sheet = await screen.findByRole('dialog')
    await user.type(within(sheet).getByLabelText('Judul'), 'Bayar pajak')
    await user.click(within(sheet).getByRole('button', { name: 'Tiap bulan' }))
    await user.type(within(sheet).getByLabelText('Catatan (opsional)'), 'jangan telat')
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    await waitFor(async () =>
      expect(await db.reminders.toArray()).toMatchObject([
        { title: 'Bayar pajak', repeat: 'monthly', note: 'jangan telat' },
      ]),
    )
    const upcoming = await screen.findByRole('region', { name: 'Akan datang' })
    expect(within(upcoming).getByText('Bayar pajak')).toBeInTheDocument()
  })

  it('validasi: judul kosong ditolak dengan pesan', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Tambah' }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    expect(await within(sheet).findByText(/Tulis judul/)).toBeInTheDocument()
    expect(await db.reminders.count()).toBe(0)
  })

  it('preset Gowes Sabtu sore mengisi judul, jam 16:30, dan berulang mingguan', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Tambah' }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: 'Gowes Sabtu sore' }))
    expect(within(sheet).getByLabelText('Jam')).toHaveValue('16:30')
    expect(within(sheet).getByRole('button', { name: 'Tiap minggu' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(within(sheet).getByRole('button', { name: 'Simpan' }))
    await waitFor(async () =>
      expect((await db.reminders.toArray())[0]).toMatchObject({ time: '16:30', repeat: 'weekly' }),
    )
    const sat = new Date((await db.reminders.toArray())[0]!.date + 'T00:00')
    expect(sat.getDay()).toBe(6)
  })

  it('pengingat sekali yang lewat masuk "Terlewat"; Selesai memindahkannya', async () => {
    const user = userEvent.setup()
    await addReminder({ ...base, title: 'Kemarin', date: addDays(today, -1) })
    renderPage()
    const late = await screen.findByRole('region', { name: 'Terlewat' })
    expect(within(late).getByText('Kemarin')).toBeInTheDocument()
    await user.click(within(late).getByRole('button', { name: 'Selesai Kemarin' }))
    const done = await screen.findByRole('region', { name: 'Selesai' })
    expect(within(done).getByText('Kemarin')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Terlewat' })).toBeNull()
  })

  it('Kalender: mengunduh .ics dengan alarm dan RRULE sesuai pengulangan', async () => {
    const user = userEvent.setup()
    await addReminder({ ...base, title: 'Gowes 🚴', repeat: 'weekly' })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Kalender Gowes 🚴' }))
    await waitFor(() => expect(blobs).toHaveLength(1))
    const text = await blobs[0]!.text()
    expect(text).toContain('BEGIN:VCALENDAR')
    expect(text).toContain('RRULE:FREQ=WEEKLY;BYDAY=')
    expect(text).toContain('TRIGGER:-PT0M')
    expect(text).toContain('Gowes 🚴')
  })

  it('"Kirim semua" muncul bila ada lebih dari satu dan memuat semuanya', async () => {
    const user = userEvent.setup()
    await addReminder(base)
    await addReminder({ ...base, title: 'Kedua', time: '10:00' })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Kirim semua ke Kalender' }))
    await waitFor(() => expect(blobs).toHaveLength(1))
    expect((await blobs[0]!.text()).match(/BEGIN:VEVENT/g)).toHaveLength(2)
  })

  it('hapus dari form dengan Urungkan memulihkan pengingat', async () => {
    const user = userEvent.setup()
    await addReminder(base)
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Pengingat Servis sepeda' }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Hapus' }),
    )
    await waitFor(async () => expect(await db.reminders.count()).toBe(0))
    await user.click(await screen.findByRole('button', { name: 'Urungkan' }))
    await waitFor(async () => expect(await db.reminders.count()).toBe(1))
  })

  it('teks pengguna tampil sebagai teks (tidak menjadi markup)', async () => {
    await addReminder({ ...base, title: '<img src=x onerror=alert(1)>' })
    renderPage()
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })
})

describe('UpcomingCard di Beranda', () => {
  const renderCard = () =>
    render(
      <MemoryRouter>
        <UpcomingCard />
      </MemoryRouter>,
    )
  it('kosong → ajakan; ada → tampil terdekat; terlewat → peringatan', async () => {
    renderCard()
    expect(await screen.findByText('Belum ada pengingat.')).toBeInTheDocument()
  })
  it('menampilkan pengingat 7 hari ke depan dan jumlah yang terlewat', async () => {
    await addReminder({ ...base, title: 'Dekat', date: addDays(today, 2) })
    await addReminder({ ...base, title: 'Jauh sekali', date: addDays(today, 30) })
    await addReminder({ ...base, title: 'Lewat', date: addDays(today, -2) })
    renderCard()
    expect(await screen.findByText('Dekat')).toBeInTheDocument()
    expect(screen.queryByText('Jauh sekali')).toBeNull()
    expect(screen.getByText('1 pengingat terlewat')).toBeInTheDocument()
  })
})
