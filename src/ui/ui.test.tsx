import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Chip } from './Chip'
import { Dialog } from './Dialog'
import { Sheet } from './Sheet'
import { Stat } from './Stat'
import { ToastProvider, useToast } from './Toast'

describe('Chip', () => {
  it('memberi tanda dengan aria-pressed dan ikon centang (bukan warna saja)', async () => {
    function Demo() {
      const [on, setOn] = useState(false)
      return (
        <Chip selected={on} onClick={() => setOn(!on)}>
          Me-time
        </Chip>
      )
    }
    render(<Demo />)
    const chip = screen.getByRole('button', { name: /Me-time/ })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(chip).toHaveTextContent('✓')
  })
})

describe('Button', () => {
  it('tombol besar min 72 px untuk Layar Rekam, tombol biasa min 48 px', () => {
    render(
      <>
        <Button large>Jeda</Button>
        <Button>Simpan</Button>
      </>,
    )
    expect(screen.getByText('Jeda').className).toContain('min-h-[72px]')
    expect(screen.getByText('Simpan').className).toContain('min-h-12')
  })
  it('nonaktif tidak bisa diklik', async () => {
    const fn = vi.fn()
    render(
      <Button disabled onClick={fn}>
        X
      </Button>,
    )
    await userEvent.click(screen.getByText('X'))
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('Stat', () => {
  it('menampilkan angka, satuan, dan label', () => {
    render(<Stat value="42,5" unit="km" label="Jarak" />)
    expect(screen.getByText('42,5')).toBeInTheDocument()
    expect(screen.getByText('km')).toBeInTheDocument()
    expect(screen.getByText('Jarak')).toBeInTheDocument()
  })
})

describe('Sheet', () => {
  it('tertutup tidak merender; terbuka berperan dialog; Escape menutup', async () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Sheet open={false} title="Catat Gowes" onClose={onClose}>
        isi
      </Sheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(
      <Sheet open title="Catat Gowes" onClose={onClose}>
        isi
      </Sheet>,
    )
    expect(screen.getByRole('dialog', { name: 'Catat Gowes' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('Dialog', () => {
  it('fokus awal di Batal; aksi bernama jelas; Hapus memanggil onConfirm', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <Dialog
        open
        danger
        title="Hapus gowes?"
        message="Hapus gowes 12 Nov, 18 km?"
        confirmLabel="Hapus"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Hapus' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })
})

describe('Toast', () => {
  it('muncul lalu hilang sendiri', () => {
    vi.useFakeTimers()
    function Demo() {
      const toast = useToast()
      return <button onClick={() => toast.show('Gowes tersimpan ✓')}>go</button>
    }
    render(
      <ToastProvider durationMs={1000}>
        <Demo />
      </ToastProvider>,
    )
    act(() => screen.getByText('go').click())
    expect(screen.getByText('Gowes tersimpan ✓')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(screen.queryByText('Gowes tersimpan ✓')).toBeNull()
    vi.useRealTimers()
  })
})
