import type { Condition } from '../../db/types'
import { CONDITION_EMOJI, CONDITION_LABEL } from '../../domain/ride'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { useToast } from '../../ui/Toast'
import { saveBodyLog, useBodyLog } from './bodyRepo'

/** Mood cepat hari ini: satu ketukan, digabung ke catatan tubuh hari itu (tanpa menghapus berat/pinggang). */
export function MoodCard({ today }: { today: string }) {
  const toast = useToast()
  const log = useBodyLog(today)

  async function pick(mood: Condition) {
    try {
      await saveBodyLog(today, { mood }, 'merge')
      toast.show('Mood tersimpan ✓')
    } catch {
      toast.show('Gagal menyimpan mood. Coba lagi.')
    }
  }

  return (
    <Card>
      <h2 className="font-semibold">Mood hari ini</h2>
      <div className="mt-2 flex gap-2">
        {([0, 1, 2] as Condition[]).map((m) => (
          <Chip
            key={m}
            selected={log?.mood === m}
            aria-label={`Mood ${CONDITION_LABEL[m]}`}
            onClick={() => void pick(m)}
          >
            {CONDITION_EMOJI[m]}
          </Chip>
        ))}
      </div>
    </Card>
  )
}
