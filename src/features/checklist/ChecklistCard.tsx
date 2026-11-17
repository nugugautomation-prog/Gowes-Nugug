import { useEffect, useState } from 'react'
import { MAX_CHECKLIST_TITLE, validateChecklistTitle } from '../../domain/checklist'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useToast } from '../../ui/Toast'
import {
  addChecklistItem,
  deleteChecklistItem,
  ensureChecklistDay,
  restoreChecklistItem,
  setChecklistDone,
  useChecklist,
} from './checklistRepo'

/** Rutinitas harian: centang tanpa konfirmasi; hapus dengan Urungkan (Design Brief bagian 18). */
export function ChecklistCard({ today }: { today: string }) {
  const toast = useToast()
  const rows = useChecklist(today)
  const [readyDate, setReadyDate] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Hari baru → baris baru dibuat saat dibuka (reset harian, BR-020).
  useEffect(() => {
    let cancelled = false
    ensureChecklistDay(today)
      .then(() => {
        if (!cancelled) setReadyDate(today)
      })
      .catch(() => {
        if (!cancelled) setError('Gagal menyiapkan checklist. Muat ulang aplikasi.')
      })
    return () => {
      cancelled = true
    }
  }, [today])

  const loading = rows === undefined || readyDate !== today
  const done = rows?.filter((r) => r.done).length ?? 0

  async function add(ev: React.FormEvent) {
    ev.preventDefault()
    const v = validateChecklistTitle(text)
    if (!v.ok) {
      setError(v.error)
      return
    }
    try {
      await addChecklistItem(v.title, today)
      setText('')
      setError(null)
    } catch {
      setError('Gagal menambah. Coba lagi.')
    }
  }

  async function remove(itemId: string, title: string) {
    const snapshot = await deleteChecklistItem(itemId, today)
    toast.show(`"${title}" dihapus`, {
      label: 'Urungkan',
      onClick: () => void restoreChecklistItem(snapshot),
    })
  }

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Rutinitas hari ini</h2>
        {!loading && rows.length > 0 ? (
          <span className="tabular text-sm text-muted">
            {done} dari {rows.length}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-2 text-muted" role="status">
          Memuat…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-muted">Tambah rutinitas pertamamu.</p>
      ) : (
        <ul className="mt-2">
          {rows.map((r) => (
            <li key={r.itemId} className="flex items-center gap-2">
              <label className="flex min-h-12 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  className="h-6 w-6 accent-[var(--brand)]"
                  checked={r.done}
                  onChange={(e) => void setChecklistDone(today, r.itemId, e.target.checked)}
                />
                {/* Teks pengguna selalu sebagai teks (React meng-escape); tidak ada innerHTML. */}
                <span className={r.done ? 'text-muted line-through' : ''}>{r.title}</span>
              </label>
              <Button
                variant="secondary"
                aria-label={`Hapus ${r.title}`}
                className="px-3"
                onClick={() => void remove(r.itemId, r.title)}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} noValidate className="mt-3 flex items-start gap-2">
        <div className="flex-1">
          <input
            aria-label="Rutinitas baru"
            className="min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-text placeholder:text-muted"
            placeholder="Tambah rutinitas"
            maxLength={MAX_CHECKLIST_TITLE + 20}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error ? (
            <span role="alert" className="mt-1 block text-sm text-danger">
              {error}
            </span>
          ) : null}
        </div>
        <Button type="submit" variant="secondary">
          Tambah
        </Button>
      </form>
    </Card>
  )
}
