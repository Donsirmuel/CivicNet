import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import { notificationsService } from '../services/notifications';
import type { Notification as ApiNotification } from '../types';

type NotificationFilter = 'all' | 'official' | 'mentions';

interface NotificationRecord {
  id: string;
  type: 'official_response' | 'mention' | 'community';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const notificationFilters: Array<{ id: NotificationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'official', label: 'Official' },
  { id: 'mentions', label: 'Mentions' },
];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function toRecord(item: ApiNotification): NotificationRecord {
  const type: NotificationRecord['type'] =
    item.notification_type === 'mention'
      ? 'mention'
      : item.actor_role === 'official'
        ? 'official_response'
        : 'community';
  const actionUrl = item.issue
    ? `/issue/${item.issue}`
    : item.post
      ? `/post/${item.post}`
      : item.notification_type === 'message'
        ? '/messages'
        : undefined;
  return {
    id: String(item.id),
    type,
    title: item.title,
    body: item.message,
    timestamp: relativeTime(item.created_at),
    read: item.is_read,
    actionUrl,
  };
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await notificationsService.getNotifications();
      setNotifications(items.map(toRecord));
    } catch {
      setError('We could not load your notifications. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'official') return item.type === 'official_response';
      if (activeFilter === 'mentions') return item.type === 'mention';
      return true;
    });
  }, [activeFilter, notifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    } catch {
      setError('We could not mark everything as read. Try again.');
    }
  };

  const openNotification = (notification: NotificationRecord) => {
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
    notificationsService.markAsRead(Number(notification.id)).catch(() => {});

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getIcon = (type: NotificationRecord['type']) => {
    if (type === 'official_response') return 'account_balance';
    if (type === 'mention') return 'alternate_email';
    return 'notifications';
  };

  const getOfficialTitle = (notification: NotificationRecord) =>
    notification.type === 'official_response' ? `Verified reply — ${notification.title}` : notification.title;

  return (
    <StandardLayout showRightSidebar={false}>
      <div className="min-h-screen" style={{ background: 'var(--civic-bg)' }}>
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
              <section className="rounded-2xl border border-[var(--civic-border)] bg-[var(--civic-surface)] px-5 py-6 lg:px-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-4xl tracking-[-0.02em] text-[var(--civic-text)]">Updates that need your attention</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--civic-muted)]">
                      Replies to your reports, mentions, and account changes — newest first.
                    </p>
                  </div>

                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-[13px] font-semibold text-[var(--civic-primary)] transition hover:underline disabled:no-underline disabled:opacity-45"
                  >
                    Mark all as read
                  </button>
                </div>

                <nav aria-label="Notification filters" className="mt-6 flex items-center gap-6 border-b border-[var(--civic-border)]">
                  {notificationFilters.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`-mb-px pb-2 text-[13px] font-semibold transition ${
                          isActive
                            ? 'border-b-2 border-[var(--civic-primary)] text-[var(--civic-text)]'
                            : 'border-b-2 border-transparent text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </nav>
              </section>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Unread', unreadCount],
                  ['Showing', filteredNotifications.length],
                  ['Total', notifications.length],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="rounded-2xl border border-[var(--civic-border)] bg-[var(--civic-surface)] px-4 py-4"
                  >
                    <p className="text-xs text-[var(--civic-muted)]">{label}</p>
                    <p className="mt-1 font-display text-2xl tracking-[-0.02em] text-[var(--civic-text)]">
                      {value as number}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {error && (
                  <div className="rounded-2xl border border-[rgba(218,92,78,0.25)] bg-[var(--civic-surface)] px-6 py-8 text-center">
                    <p className="text-lg font-bold text-[var(--civic-text)]">Could not load notifications</p>
                    <p className="mt-2 text-sm text-[var(--civic-muted)]">{error}</p>
                    <button
                      onClick={loadNotifications}
                      className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[13px] font-semibold text-[var(--civic-primary-contrast)]"
                      style={{ background: 'var(--civic-primary)' }}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!error && isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((card) => (
                      <div key={card} className="h-28 animate-pulse rounded-2xl border border-[var(--civic-border)] bg-[var(--civic-surface)]" />
                    ))}
                  </div>
                )}

                {!error && !isLoading && filteredNotifications.length > 0 && (
                  filteredNotifications.map((notification) => {
                    const isOfficial = notification.type === 'official_response';
                    return (
                      <article
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                        className="cursor-pointer rounded-2xl border border-[var(--civic-border)] bg-[var(--civic-surface)] px-5 py-5 transition hover:-translate-y-0.5"
                        style={
                          isOfficial
                            ? { background: 'rgba(10,106,59,.05)', borderLeft: '3px solid var(--civic-primary)' }
                            : notification.read
                              ? undefined
                              : { borderLeft: '3px solid var(--civic-primary)' }
                        }
                      >
                        <div className="flex gap-4">
                          <div
                            className="flex size-11 shrink-0 items-center justify-center rounded-md"
                            style={{ background: 'var(--civic-surface-strong)', color: 'var(--civic-primary)' }}
                          >
                            <Icon name={getIcon(notification.type)} className="text-[1.1rem]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-base font-bold text-[var(--civic-text)]">{getOfficialTitle(notification)}</p>
                              <div className="flex items-center gap-2">
                                {!notification.read && <span className="size-2 rounded-full bg-[var(--civic-primary)]" />}
                                <span className="text-xs text-[var(--civic-muted)]">{notification.timestamp}</span>
                              </div>
                            </div>

                            <p className="mt-2 text-[15px] leading-7 text-[var(--civic-muted)]">{notification.body}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}

                {!error && !isLoading && filteredNotifications.length === 0 && (
                  <div className="rounded-2xl border border-[var(--civic-border)] bg-[var(--civic-surface)] px-6 py-10 text-center">
                    <p className="text-lg font-bold text-[var(--civic-text)]">
                      {notifications.length ? 'Nothing under this tab' : 'No notifications yet'}
                    </p>
                    <p className="mt-2 text-sm text-[var(--civic-muted)]">
                      {notifications.length
                        ? 'Try another tab.'
                        : 'When an official replies to your report or someone mentions you, it lands here.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-[96px] xl:self-start">
              <section className="rounded-[28px] border border-[var(--civic-border)] bg-[var(--civic-surface)] p-5 shadow-[0_24px_48px_-36px_rgba(22,33,51,0.28)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--civic-muted)]">At a glance</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[20px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Unread</p>
                    <p className="mt-2 font-display text-xl tracking-[-0.02em] text-[var(--civic-text)]">{unreadCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Visible</p>
                    <p className="mt-2 font-display text-xl tracking-[-0.02em] text-[var(--civic-text)]">{filteredNotifications.length}</p>
                  </div>
                  <div className="rounded-[20px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">All items</p>
                    <p className="mt-2 font-display text-xl tracking-[-0.02em] text-[var(--civic-text)]">{notifications.length}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[var(--civic-border)] bg-[var(--civic-surface)] p-5 shadow-[0_24px_48px_-36px_rgba(22,33,51,0.28)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--civic-muted)]">What lands here</p>
                <p className="mt-3 text-sm leading-7 text-[var(--civic-muted)]">
                  Official replies, mentions, and account changes collect here. Anything unread carries a green dot.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
