import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

const stroke = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const TABS: { to: string; label: string; icon: ReactNode }[] = [
  {
    to: '/',
    label: 'Beranda',
    icon: (
      <svg {...stroke}>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    to: '/gowes',
    label: 'Gowes',
    icon: (
      <svg {...stroke}>
        <circle cx="6" cy="16" r="4" />
        <circle cx="18" cy="16" r="4" />
        <path d="M6 16l4-8h5l3 8M10 8l4 8" />
      </svg>
    ),
  },
  {
    to: '/harian',
    label: 'Harian',
    icon: (
      <svg {...stroke}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M8 13l3 3 5-6" />
      </svg>
    ),
  },
  {
    to: '/progres',
    label: 'Progres',
    icon: (
      <svg {...stroke}>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),
  },
  {
    to: '/lainnya',
    label: 'Lainnya',
    icon: (
      <svg {...stroke}>
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>
    ),
  },
]

/** Tab aktif ditandai warna aksen dan garis di atas ikon (bukan warna saja). */
export function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-[480px]">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-0.5 border-t-2 text-xs ${
                  isActive
                    ? 'border-accent font-semibold text-brand'
                    : 'border-transparent text-muted'
                }`
              }
            >
              {t.icon}
              <span>{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
