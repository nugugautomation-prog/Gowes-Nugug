import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './App'
import { TABS } from './BottomNav'
import { ToastProvider } from '../ui/Toast'

function renderAt(path = '/') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('navigasi 5 tab', () => {
  it('punya tepat lima tab dengan label sesuai Design Brief', () => {
    expect(TABS.map((t) => t.label)).toEqual(['Beranda', 'Gowes', 'Harian', 'Progres', 'Lainnya'])
  })

  it('setiap tab bisa dibuka dan menampilkan judul halamannya', async () => {
    renderAt('/')
    const nav = screen.getByRole('navigation', { name: 'Navigasi utama' })
    for (const label of ['Gowes', 'Harian', 'Progres', 'Lainnya', 'Beranda']) {
      await userEvent.click(screen.getByRole('link', { name: label }))
      expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument()
    }
    expect(nav).toBeInTheDocument()
  })

  it('tab aktif ditandai dengan aria-current', async () => {
    renderAt('/harian')
    expect(screen.getByRole('link', { name: 'Harian' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Beranda' })).not.toHaveAttribute('aria-current')
  })

  it('alamat tak dikenal kembali ke Beranda', () => {
    renderAt('/tidak-ada')
    expect(screen.getByRole('heading', { level: 1, name: 'Beranda' })).toBeInTheDocument()
  })

  it('halaman pengembang terjangkau dari Lainnya', async () => {
    renderAt('/lainnya')
    await userEvent.click(screen.getByRole('link', { name: 'Uji kelayakan HP' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Uji kelayakan HP' })).toBeInTheDocument()
  })

  it('mengganti tema mengubah atribut data-theme dan tersimpan', async () => {
    localStorage.clear()
    renderAt('/lainnya')
    await userEvent.click(screen.getByRole('button', { name: /Terang/ }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('gowessehat.theme')).toBe('light')
  })
})
