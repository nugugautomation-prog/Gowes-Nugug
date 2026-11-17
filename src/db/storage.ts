// Penyimpanan permanen (PER-003). Di browser Chromium (Brave/Chrome) jawabannya otomatis,
// bukan dialog, jadi UI hanya menampilkan statusnya (AUDIT B-10).

export interface StorageStatus {
  supported: boolean
  persisted: boolean | null
  usageBytes: number | null
  quotaBytes: number | null
}

export async function getStorageStatus(): Promise<StorageStatus> {
  if (!('storage' in navigator)) {
    return { supported: false, persisted: null, usageBytes: null, quotaBytes: null }
  }
  const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : null
  const est = navigator.storage.estimate ? await navigator.storage.estimate() : null
  return {
    supported: true,
    persisted,
    usageBytes: est?.usage ?? null,
    quotaBytes: est?.quota ?? null,
  }
}

/** Dipanggil saat data pertama tersimpan (bukan saat aplikasi dibuka). */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !navigator.storage.persist) return false
  if (navigator.storage.persisted && (await navigator.storage.persisted())) return true
  return navigator.storage.persist()
}
