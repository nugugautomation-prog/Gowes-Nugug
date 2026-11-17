import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { db } from './db/database'
import { ensureDefaults } from './db/settings'
import { applyTheme, readTheme } from './ui/theme'

applyTheme(readTheme())

// Nilai awal pengaturan; kegagalan penyimpanan tidak boleh mematikan aplikasi (ERR-004 menyusul di modul data).
ensureDefaults(db).catch((e) => console.error('Gagal menyiapkan pengaturan awal', e))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
