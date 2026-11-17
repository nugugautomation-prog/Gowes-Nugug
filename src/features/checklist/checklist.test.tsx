import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Harian } from '../../app/pages/Harian'
import { db } from '../../db/database'
import { validateChecklistTitle } from '../../domain/checklist'
import { toLocalDate } from '../../domain/ride'
import { addDays } from '../../domain/stats'
import { ToastProvider } from '../../ui/Toast'
import {
  addChecklistItem,
  deleteChecklistItem,
  ensureChecklistDay,
  restoreChecklistItem,
  setChecklistDone,
} from './checklistRepo'

const today = toLocalDate(new Date())
const yesterday = addDays(today, -1)
const tomorrow = addDays(today, 1)

beforeEach(async () => {
  await db.checklist_items.clear()
  await db.checklist_days.clear()
})

function renderHarian() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Harian />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('validateChecklistTitle (VAL-007)', () => {
  it('dipangkas; kosong dan >60 ditolak', () => {
    expect(validateChecklistTitle('  Jalan kaki  ')).toEqual({ ok: true, title: 'Jalan kaki' })
    expect(validateChecklistTitle('   ').ok).toBe(false)
    expect(validateChecklistTitle('a'.repeat(60)).ok).toBe(true)
    expect(validateChecklistTitle('a'.repeat(61)).ok).toBe(false)
  })
})

describe('checklistRepo (BR-020)', () => {
  it('isi awal 3 contoh dibuat sekali dan baris hari ini terbentuk', async () => {
    await ensureChecklistDay(today)
    await ensureChecklistDay(today) // idempoten
    expect(await db.checklist_items.count()).toBe(3)
    const rows = await db.checklist_days.where('date').equals(today).toArray()
    expect(rows.map((r) => r.title).sort()).toEqual([
      'Jurnal malam',
      'Minum air pagi',
      'Peregangan',
    ])
    expect(rows.every((r) => !r.done)).toBe(true)
  })

  it('AC-013: hari baru ter-reset (centang kemarin tidak terbawa)', async () => {
    await ensureChecklistDay(yesterday)
    const rows = await db.checklist_days.where('date').equals(yesterday).toArray()
    await setChecklistDone(yesterday, rows[0]!.itemId, true)
    await ensureChecklistDay(today)
    const todayRows = await db.checklist_days.where('date').equals(today).toArray()
    expect(todayRows).toHaveLength(3)
    expect(todayRows.every((r) => !r.done)).toBe(true)
    expect((await db.checklist_days.get([yesterday, rows[0]!.itemId]))?.done).toBe(true)
  })

  it('AC-013: item ditambah muncul hari itu juga', async () => {
    await ensureChecklistDay(today)
    await addChecklistItem('  Jalan sore ', today)
    const rows = await db.checklist_days.where('date').equals(today).toArray()
    expect(rows.map((r) => r.title)).toContain('Jalan sore')
  })

  it('AC-013: hapus item tidak mengubah hasil hari-hari lalu, dan hari depan tidak memuatnya', async () => {
    await ensureChecklistDay(yesterday)
    const past = await db.checklist_days.where('date').equals(yesterday).toArray()
    const target = past.find((r) => r.title === 'Peregangan')!
    await setChecklistDone(yesterday, target.itemId, true)
    await ensureChecklistDay(today)

    await deleteChecklistItem(target.itemId, today)

    // kemarin utuh (judul tersalin + status selesai)
    const pastAfter = await db.checklist_days.where('date').equals(yesterday).toArray()
    expect(pastAfter).toEqual(
      past.map((r) => (r.itemId === target.itemId ? { ...r, done: true } : r)),
    )
    // hari ini dan besok tanpa item itu
    await ensureChecklistDay(tomorrow)
    for (const d of [today, tomorrow]) {
      const rows = await db.checklist_days.where('date').equals(d).toArray()
      expect(rows.map((r) => r.title)).not.toContain('Peregangan')
      expect(rows).toHaveLength(2)
    }
  })

  it('menghapus semua item tidak memicu isi awal dibuat ulang', async () => {
    await ensureChecklistDay(today)
    for (const r of await db.checklist_days.where('date').equals(today).toArray())
      await deleteChecklistItem(r.itemId, today)
    await ensureChecklistDay(today)
    expect(await db.checklist_days.where('date').equals(today).count()).toBe(0)
  })

  it('Urungkan mengembalikan item beserta status centangnya', async () => {
    await ensureChecklistDay(today)
    const row = (await db.checklist_days.where('date').equals(today).toArray())[0]!
    await setChecklistDone(today, row.itemId, true)
    const snap = await deleteChecklistItem(row.itemId, today)
    expect(await db.checklist_days.get([today, row.itemId])).toBeUndefined()
    await restoreChecklistItem(snap)
    expect(await db.checklist_days.get([today, row.itemId])).toMatchObject({ done: true })
    expect((await db.checklist_items.get(row.itemId))?.active).toBe(true)
  })

  it('judul kosong ditolak di lapisan data', async () => {
    await expect(addChecklistItem('   ', today)).rejects.toThrow()
  })
})

describe('kartu Rutinitas di tab Harian', () => {
  it('menampilkan 3 contoh dan mencentang tanpa konfirmasi', async () => {
    const user = userEvent.setup()
    renderHarian()
    const box = await screen.findByRole('checkbox', { name: 'Peregangan' })
    await user.click(box)
    await waitFor(() => expect(box).toBeChecked())
    expect(await screen.findByText('1 dari 3')).toBeInTheDocument()
  })

  it('tambah item lewat form; judul kosong menampilkan pesan', async () => {
    const user = userEvent.setup()
    renderHarian()
    await screen.findByRole('checkbox', { name: 'Peregangan' })
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    expect(await screen.findByText('Tulis nama rutinitas dulu')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Rutinitas baru'), 'Jalan sore')
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    expect(await screen.findByRole('checkbox', { name: 'Jalan sore' })).toBeInTheDocument()
  })

  it('hapus lalu Urungkan', async () => {
    const user = userEvent.setup()
    renderHarian()
    await screen.findByRole('checkbox', { name: 'Peregangan' })
    await user.click(screen.getByRole('button', { name: 'Hapus Peregangan' }))
    await waitFor(() =>
      expect(screen.queryByRole('checkbox', { name: 'Peregangan' })).not.toBeInTheDocument(),
    )
    await user.click(await screen.findByRole('button', { name: 'Urungkan' }))
    expect(await screen.findByRole('checkbox', { name: 'Peregangan' })).toBeInTheDocument()
  })

  it('teks pengguna tampil sebagai teks, bukan HTML', async () => {
    const user = userEvent.setup()
    renderHarian()
    await screen.findByRole('checkbox', { name: 'Peregangan' })
    const jahat = '<img src=x onerror=alert(1)>'
    await user.type(screen.getByLabelText('Rutinitas baru'), jahat)
    await user.click(screen.getByRole('button', { name: 'Tambah' }))
    expect(await screen.findByText(jahat)).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
  })

  it('daftar kosong menampilkan ajakan menambah', async () => {
    await ensureChecklistDay(today)
    for (const r of await db.checklist_days.where('date').equals(today).toArray())
      await deleteChecklistItem(r.itemId, today)
    renderHarian()
    expect(await screen.findByText('Tambah rutinitas pertamamu.')).toBeInTheDocument()
  })
})
