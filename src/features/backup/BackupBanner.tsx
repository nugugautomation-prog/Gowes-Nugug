import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { requestPersistentStorage } from '../../db/storage'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useNow } from '../../ui/useNow'
import { snoozeBackup, useBackupDue } from './backupRepo'

/** Pengingat cadangan di Beranda (BR-021): ≥ 14 hari atau ≥ 10 gowes baru; bisa ditunda 1 hari. */
export function BackupBanner() {
  const now = useNow().getTime()
  const due = useBackupDue(now)

  // PER-003: minta penyimpanan permanen saat sudah ada data yang layak dilindungi.
  useEffect(() => {
    if (due) void requestPersistentStorage()
  }, [due])

  if (!due) return null
  return (
    <Card className="border-warn">
      <p className="font-semibold">Waktunya cadangkan data</p>
      <p className="mt-1 text-muted">
        Simpan file cadangan agar catatanmu aman bila data browser terhapus.
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          to="/lainnya/cadangan"
          className="inline-flex min-h-12 items-center rounded-xl bg-brand px-4 font-semibold text-black"
        >
          Cadangkan
        </Link>
        <Button variant="secondary" onClick={() => void snoozeBackup()}>
          Besok saja
        </Button>
      </div>
    </Card>
  )
}
