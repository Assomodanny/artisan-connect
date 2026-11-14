import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ActionResult } from '../lib/commit'
import { STORAGE_KEYS } from '../lib/storage'
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService'

// Fired after this tab changes notifications, so the top bar and the page stay in step.
const CHANGED_EVENT = 'ac-notifications-changed'

export function useNotifications(userId: string | null) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1)

    // Another tab changed the saved data.
    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.notifications || event.key === null) refresh()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(CHANGED_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(CHANGED_EVENT, refresh)
    }
  }, [])

  const items = useMemo(
    () => (userId ? getNotificationsForUser(userId) : []),
    [userId, version],
  )
  const unreadCount = items.filter((item) => !item.read).length

  const markRead = useCallback(
    (notificationId: string): ActionResult => {
      if (!userId) return { ok: false, error: 'You are signed out.' }
      const result = markNotificationRead(userId, notificationId)
      window.dispatchEvent(new Event(CHANGED_EVENT))
      return result
    },
    [userId],
  )

  const markAllRead = useCallback((): ActionResult => {
    if (!userId) return { ok: false, error: 'You are signed out.' }
    const result = markAllNotificationsRead(userId)
    window.dispatchEvent(new Event(CHANGED_EVENT))
    return result
  }, [userId])

  return { items, unreadCount, markRead, markAllRead }
}