import { cx } from '../../lib/classNames'
import { formatDate } from '../../lib/formatters'
import { STATUS_LABELS } from '../../lib/statusMachine'
import type { StatusChange } from '../../types'

export default function StatusTimeline({ history }: { history: StatusChange[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-600">No history recorded yet.</p>
  }

  return (
    <ol className="space-y-4">
      {history.map((change, index) => {
        const isCurrent = index === history.length - 1
        return (
          <li key={`${change.at}-${index}`} className="flex gap-3">
            <span
              aria-hidden="true"
              className={cx(
                'mt-1.5 h-3 w-3 shrink-0 rounded-full',
                isCurrent ? 'bg-brand-700' : 'bg-slate-300',
              )}
            />
            <div>
              <p className={cx('text-sm', isCurrent ? 'font-semibold text-slate-900' : 'text-slate-700')}>
                {STATUS_LABELS[change.to]}
                {isCurrent && (
                  <span className="ml-2 text-xs font-semibold text-brand-800">Current</span>
                )}
              </p>
              <p className="text-xs text-slate-600">{formatDate(change.at)}</p>
              {change.note && <p className="mt-0.5 text-sm text-slate-600">{change.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}