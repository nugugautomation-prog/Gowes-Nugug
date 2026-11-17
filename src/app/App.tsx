import { KidIdeasPage } from '../features/kids/KidIdeasPage'
import { RemindersPage } from '../features/reminders/RemindersPage'
import { NutritionPage } from '../features/nutrition/NutritionPage'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../ui/Toast'
import { AppLayout } from './AppLayout'
import { Beranda } from './pages/Beranda'
import { Gowes } from './pages/Gowes'
import { Harian } from './pages/Harian'
import { Progres } from './pages/Progres'
import { Lainnya } from './pages/Lainnya'
import { Galeri } from './pages/Galeri'
import { DiagnosticsPage } from '../features/diagnostics/DiagnosticsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Beranda />} />
        <Route path="gowes" element={<Gowes />} />
        <Route path="harian" element={<Harian />} />
        <Route path="progres" element={<Progres />} />
        <Route path="lainnya" element={<Lainnya />} />
        <Route path="lainnya/anak" element={<KidIdeasPage />} />
        <Route path="lainnya/nutrisi" element={<NutritionPage />} />
        <Route path="lainnya/pengingat" element={<RemindersPage />} />
        <Route path="lainnya/uji-hp" element={<DiagnosticsPage />} />
        <Route path="lainnya/galeri" element={<Galeri />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </ToastProvider>
  )
}
