import { writeJSON } from './storage'
import type { StorageKey } from './storage'

export type ActionResult = { ok: true } | { ok: false; error: string }

export interface WriteStep {
  key: StorageKey
  value: unknown // what to save
  old: unknown // what was there before, restored if a later save fails
}

// Saves several lists as one unit. If any save fails, the ones already saved are put back,
// so a half-finished change (for example: payment held but job status unchanged) can't happen.
export function commitWrites(steps: WriteStep[]): ActionResult {
  const saved: WriteStep[] = []

  for (const step of steps) {
    const result = writeJSON(step.key, step.value)
    if (!result.ok) {
      for (const done of saved) writeJSON(done.key, done.old)
      return { ok: false, error: result.error }
    }
    saved.push(step)
  }

  return { ok: true }
}