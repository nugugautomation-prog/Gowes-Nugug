import { useState } from 'react'
import { Link } from 'react-router-dom'
import pkg from '../../../package.json'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { PageHeader } from '../../ui/PageHeader'
import { readTheme, saveTheme, type ThemePref } from '../../ui/theme'

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'dark', label: 'Gelap' },
  { value: 'light', label: 'Terang' },
  { value: 'system', label: 'Ikut sistem' },
]

export function Lainnya() {
  const [theme, setTheme] = useState<ThemePref>(readTheme)
  return (
    <>
      <PageHeader title="Lainnya" />
      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-semibold">Tema</h2>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <Chip
                key={t.value}
                selected={theme === t.value}
                onClick={() => {
                  saveTheme(t.value)
                  setTheme(t.value)
                }}
              >
                {t.label}
              </Chip>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Panduan</h2>
          <ul className="space-y-2">
            <li>
              <Link className="flex min-h-12 items-center text-brand underline" to="/lainnya/anak">
                Ide bareng anak
              </Link>
            </li>
            <li>
              <Link
                className="flex min-h-12 items-center text-brand underline"
                to="/lainnya/nutrisi"
              >
                Panduan nutrisi
              </Link>
            </li>
            <li>
              <Link
                className="flex min-h-12 items-center text-brand underline"
                to="/lainnya/pengingat"
              >
                Pengingat
              </Link>
            </li>
            <li>
              <Link
                className="flex min-h-12 items-center text-brand underline"
                to="/lainnya/cadangan"
              >
                Cadangan data
              </Link>
            </li>
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Pengembang</h2>
          <ul className="space-y-2">
            <li>
              <Link
                className="flex min-h-12 items-center text-brand underline"
                to="/lainnya/uji-hp"
              >
                Uji kelayakan HP
              </Link>
            </li>
            <li>
              <Link
                className="flex min-h-12 items-center text-brand underline"
                to="/lainnya/galeri"
              >
                Galeri komponen
              </Link>
            </li>
          </ul>
        </Card>
        <p className="text-center text-sm text-muted">
          GowesSehat v{pkg.version} · Modul M0 (Fondasi)
        </p>
      </div>
    </>
  )
}
