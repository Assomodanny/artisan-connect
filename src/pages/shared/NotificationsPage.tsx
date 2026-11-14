import { useState } from 'react'
import { Link } from 'react-router'
import { Bell, CheckCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { cx } from '../../lib/classNames'
import { formatDateTime } from '../../lib/dateTime'
import { getJobPathForRole } from '../../lib/jobLinks'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function NotificationsPage() {
  const { user } = useAuth()
  const { items, unreadCount, markRead, markAllRead } = useNotifications(user?.id ?? null)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  function handleMarkRead(id: string) {
    const result = markRead(id)
    setError(result.ok ? null : result.error)
  }

  function handleMarkAll() {
    const result = markAllRead()
    setError(result.ok ? null : result.error)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all as read
          </Button>
        )}
      </div>

      <p role="status" className="mt-2 text-slate-600">
        {items.length === 0
          ? 'Nothing here yet.'
          : unreadCount === 0
            ? "You're all caught up."
            : `${unreadCount} unread`}
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <Card className="mt-6 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">No notifications yet</h2>
          <p className="mt-1 text-slate-600">
            Updates about your jobs, quotations and payments appear here.
          </p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className={cx('p-4', !item.read && 'border border-brand-200 bg-brand-50')}>
                <div className="flex items-start gap-3">
                  <Bell
                    className={cx('mt-0.5 h-5 w-5 shrink-0', item.read ? 'text-slate-400' : 'text-brand-700')}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.read && <Badge tone="brand">New</Badge>}
                      <span className="text-xs text-slate-600">{formatDateTime(item.createdAt)}</span>
                    </div>

                    {item.jobId ? (
                      <Link
                        to={getJobPathForRole(user.role, item.jobId)}
                        onClick={() => markRead(item.id)}
                        className={cx(
                          'mt-1 block text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-brand-700',
                          !item.read && 'font-semibold',
                        )}
                      >
                        {item.message}
                      </Link>
                    ) : (
                      <p className={cx('mt-1 text-slate-900', !item.read && 'font-semibold')}>
                        {item.message}
                      </p>
                    )}

                    {!item.read && (
                      <Button size="sm" variant="ghost" className="mt-2 -ml-3" onClick={() => handleMarkRead(item.id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}