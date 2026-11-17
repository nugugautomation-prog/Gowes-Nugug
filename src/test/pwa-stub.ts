// Pengganti 'virtual:pwa-register/react' saat uji (modul virtual hanya ada di build Vite).
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: async () => {},
  }
}
