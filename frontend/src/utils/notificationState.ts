export interface StoredNotificationState<T> {
  items: T[];
}

export interface NotificationStateItem {
  id: string;
  read: boolean;
}

const STORAGE_KEY = 'civic_notifications_state';
const EVENT_NAME = 'civic-notifications-updated';
export const DEFAULT_NOTIFICATION_STATE: NotificationStateItem[] = [
  { id: '1', read: false },
  { id: '2', read: false },
  { id: '3', read: true },
  { id: '4', read: true },
];

export function readNotificationState<T>(fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as StoredNotificationState<T>;
    return Array.isArray(parsed.items) ? parsed.items : fallback;
  } catch {
    return fallback;
  }
}

export function writeNotificationState<T extends { read?: boolean; is_read?: boolean }>(items: T[]) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { count: getUnreadCount(items) } }));
}

export function getNotificationEventName() {
  return EVENT_NAME;
}

export function getUnreadCount<T extends { read?: boolean; is_read?: boolean }>(items: T[]) {
  return items.filter((item) => item.read === false || item.is_read === false).length;
}
