import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Gowes } from '../../app/pages/Gowes'
import { db } from '../../db/database'
import { ToastProvider } from '../../ui/Toast'
import { addManualRide, deleteRide, updateManualRide } from './rideRepo'

const base = {
  date: '2026-11-10',
  distanceKm: 18,
  movingSec: 3600,
  elevationM: 100,
  category: 'hari_kerja',
  type: 'metime',
  condition: 1,
} as const

beforeEach(async () => {
  await db.rides.clear()
  await db.track_points.clear()
})
afterEach(async () => {
  await db.rides.clear()
})

describe('rideRepo', () => {
  it('AC-002: dua gowes di tanggal sama tersimpan keduanya', async () => {
    await addManualRide(base)
    await addManualRide({ ...base, distanceKm: 10 })
    const all = await db.rides.where('date').equals('2026-11-10').toArray()
    expect(all).toHaveLength(2)
    expect(all.reduce((s, r) => s + r.distanceKm, 0)).toBe(28)
    expect(all.every((r) => r.source === 'manual' && !r.hasTrack)).toBe(true)
  })

  it('AC-003: edit jarak mengubah data tersimpan', async () => {
    const r = await addManualRide(base)
    await updateManualRide(r.id, { ...base, distanceKm: 25.5 })
    expect((await db.rides.get(r.id))?.distanceKm).toBe(25.5)
  })

  it('BR-009: gowes rekaman tidak bisa diubah angkanya', async () => {
    await db.rides.add({
      ...base,
      id: 'rec',
      source: 'recorded',
      hasTrack: true,
      createdAt: 1,
      updatedAt: 1,
    })
    await expect(updateManualRide('rec', { ...base, distanceKm: 99 })).rejects.toThrow()
    expect((await db.rides.get('rec'))?.distanceKm).toBe(18)
  })

  it('catatan kosong tidak disimpan; jarak dibulatkan 2 desimal', async () => {
    const r = await addManualRide({ ...base, distanceKm: 12.3456, note: '   ' })
    expect(r.note).toBeUndefined()
    expect(r.distanceKm).toBe(12.35)
  })

  it('hapus gowes ikut menghapus jejaknya', async () => {
    const r = await addManualRide(base)
    await db.track_points.add({
      rideId: r.id,
      seq: 0,
      ts: 1,
      lat: 0,
      lon: 0,
      acc: 5,
      paused: false,
    })
    await deleteRide(r.id)
    expect(await db.rides.count()).toBe(0)
    expect(await db.track_points.count()).toBe(0)
  })
})

function renderGowes() {
  return render(
    <ToastProvider>
      <Gowes />
    </ToastProvider>,
  )
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, km: string, mnt: string) {
  const dialog = await screen.findByRole('dialog')
  await user.type(within(dialog).getByPlaceholderText('mis. 18,5'), km)
  await user.type(within(dialog).getByLabelText('Menit'), mnt)
  await user.type(within(dialog).getByPlaceholderText('mis. 120'), '50')
  return dialog
}

describe('halaman Gowes', () => {
  it('keadaan kosong', async () => {
    renderGowes()
    expect(await screen.findByText('Belum ada gowes')).toBeInTheDocument()
  })

  it('mencatat gowes dengan koma desimal dan muncul di riwayat', async () => {
    const user = userEvent.setup()
    renderGowes()
    await user.click(screen.getByRole('button', { name: 'Catat Gowes' }))
    const dialog = await fillForm(user, '12,5', '45')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
    expect(await screen.findByRole('button', { name: /12,5 km/ })).toBeInTheDocument()
    expect((await db.rides.toArray())[0]?.distanceKm).toBe(12.5)
  })

  it('validasi: jarak kosong menampilkan pesan dan tidak menyimpan', async () => {
    const user = userEvent.setup()
    renderGowes()
    await user.click(screen.getByRole('button', { name: 'Catat Gowes' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
    expect(await within(dialog).findByText('Isi jarak dalam km')).toBeInTheDocument()
    expect(await db.rides.count()).toBe(0)
  })

  it('AC-004: duplikat menampilkan peringatan tetapi tetap bisa disimpan', async () => {
    const today = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    const date = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`
    await addManualRide({ ...base, date, distanceKm: 20, movingSec: 3600 })
    const user = userEvent.setup()
    renderGowes()
    await screen.findByRole('button', { name: /20,0 km/ })
    await user.click(screen.getByRole('button', { name: 'Catat Gowes' }))
    const dialog = await fillForm(user, '20', '0')
    await user.type(within(dialog).getByLabelText('Jam'), '1')
    expect(await within(dialog).findByText(/Sudah ada gowes/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
    await waitFor(async () => expect(await db.rides.count()).toBe(2))
  })

  it('hapus meminta konfirmasi lalu menghapus', async () => {
    await addManualRide(base)
    const user = userEvent.setup()
    renderGowes()
    await user.click(await screen.findByRole('button', { name: /18,0 km/ }))
    await user.click(screen.getByRole('button', { name: 'Hapus' }))
    const confirm = await screen.findByRole('alertdialog')
    expect(confirm).toHaveTextContent('10 Nov 2026')
    await user.click(within(confirm).getByRole('button', { name: 'Hapus' }))
    await waitFor(async () => expect(await db.rides.count()).toBe(0))
  })
})
