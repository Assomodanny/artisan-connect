import { commitWrites } from '../lib/commit'
import type { ActionResult } from '../lib/commit'
import { createId } from '../lib/ids'
import { STORAGE_KEYS, readList } from '../lib/storage'
import type { Notification } from '../types'

// Builds a notification. The caller saves it together with the change that caused it.
export function buildNotification(userId: string, message: string, jobId?: string): Notification {
  return {
    id: createId('note'),
    userId,
    message,
    jobId,
    read: false,
    createdAt: new Date().toISOString(),
  }
}

// One person's notifications, newest first.
export function getNotificationsForUser(userId: string): Notification[] {
  return readList<Notification>(STORAGE_KEYS.notifications)
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function markNotificationRead(userId: string, notificationId: string): ActionResult {
  const all = readList<Notification>(STORAGE_KEYS.notifications)

  // A notification that belongs to someone else looks exactly like one that doesn't exist.
  const target = all.find((item) => item.id === notificationId && item.userId === userId)
  if (!target) return { ok: false, error: 'This notification no longer exists.' }
  if (target.read) return { ok: true }

  return commitWrites([
    {
      key: STORAGE_KEYS.notifications,
      value: all.map((item) => (item.id === target.id ? { ...item, read: true } : item)),
      old: all,
    },
  ])
}

export function markAllNotificationsRead(userId: string): ActionResult {
  const all = readList<Notification>(STORAGE_KEYS.notifications)
  if (!all.some((item) => item.userId === userId && !item.read)) return { ok: true }

  return commitWrites([
    {
      key: STORAGE_KEYS.notifications,
      value: all.map((item) => (item.userId === userId ? { ...item, read: true } : item)),
      old: all,
    },
  ])
}