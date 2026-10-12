import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import {
  DEFAULT_NOTIFICATION_STATE,
  getUnreadCount,
  readNotificationState,
  writeNotificationState,
} from '../utils/notificationState';

type NotificationFilter = 'all' | 'official' | 'mentions';

interface NotificationRecord {
  id: string;
  type: 'official_response' | 'status_update' | 'mention' | 'community';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actor?: {
    name: string;
    avatar?: string;
  };
}

const notificationFilters: Array<{ id: NotificationFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'official', label: 'Official' },
  { id: 'mentions', label: 'Mentions' },
];

const initialNotifications: NotificationRecord[] = [
  {
    id: '1',
    type: 'official_response',
    title: 'Lagos State Ministry of Works replied to your report',
    body: 'The drainage work at Ikorodu Road has been scheduled for review next quarter.',
    timestamp: '2m ago',
    read: false,
    actionUrl: '/issue/1',
  },
  {
    id: '2',
    type: 'status_update',
    title: 'Your account was verified',
    body: 'Your account details have been confirmed. You can now post and send reports.',
    timestamp: '1h ago',
    read: false,
    actionUrl: '/settings',
  },
  {
    id: '3',
    type: 'mention',
    title: 'Amadi J. mentioned you',
    body: '"@Citizen_Abuja would have useful insight on this road project."',
    timestamp: '4h ago',
    read: true,
    actor: {
      name: 'Amadi J.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
    },
    actionUrl: '/feed',
  },
  {
    id: '4',
    type: 'community',
    title: 'A poll is closing soon',
    body: 'The minimum wage discussion in your area closes in 2 hours.',
    timestamp: 'Yesterday',
    read: true,
    actionUrl: '/feed',
  },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<NotificationRecord[]>(() =>
    initialNotifications.map((item) => {
      const stored = readNotificationState(DEFAULT_NOTIFICATION_STATE).find(
        (storedItem) => storedItem.id === item.id,
      );

      return stored ? { ...item, read: stored.read } : item;
    }),
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'official') {
        return item.type === 'official_response' || item.type === 'status_update';
      }
      if (activeFilter === 'mentions') {
        return item.type === 'mention';
      }
      return true;
    });
  }, [activeFilter, notifications]);

  const unreadCount = getUnreadCount(notifications);

  const markAllAsRead = () => {
    setNotifications((current) => {
      const next = current.map((item) => ({ ...item, read: true }));
      writeNotificationState(next);
      return next;
    });
  };

  const openNotification = (notification: NotificationRecord) => {
    setNotifications((current) => {
      const next = current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      );
      writeNotificationState(next);
      return next;
    });

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getIcon = (type: NotificationRecord['type']) => {
    if (type === 'official_response') return 'account_balance';
    if (type === 'status_update') return 'verified_user';
    if (type === 'mention') return 'alternate_email';
    return 'notifications';
  };

  const getAccent = (type: NotificationRecord['type']) => {
    if (type === 'official_response') return 'var(--civic-primary)';
    if (type === 'status_update') return 'var(--civic-gold)';
    return 'var(--civic-border-strong)';
  };

  return (
    <StandardLayout showRightSidebar={false}>
      <div
        className="min-h-screen"
        style={{ background: 'linear-gradient(180deg, var(--civic-surface-soft) 0%, var(--civic-bg) 100%)' }}
      >
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="overflow-hidden rounded-[32px] border border-[var(--civic-border)] bg-[var(--civic-surface)] shadow-[0_30px_70px_-36px_rgba(0,0,0,0.28)]">
              <header className="border-b border-[var(--civic-border)] px-5 py-5 lg:px-8">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="civic-label">Notifications</p>
                      <h1 className="mt-3 font-display text-4xl tracking-[-0.02em] text-[var(--civic-text)]">Updates that need your attention</h1>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--civic-muted)]">
                        Follow replies, account changes, and mentions without losing the thread.
                      </p>
                    </div>

                    <button
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-primary)] transition disabled:opacity-45"
                      style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ['Unread', unreadCount],
                      ['Visible', filteredNotifications.length],
                      ['Total', notifications.length],
                    ].map(([label, value]) => (
                      <div
                        key={label as string}
                        className="rounded-[22px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] px-4 py-4"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--civic-muted)]">
                          {label}
                        </p>
                        <p className="mt-2 font-display text-2xl tracking-[-0.02em] text-[var(--civic-text)]">
                          {value as number}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {notificationFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                          activeFilter === filter.id
                            ? 'rounded-full text-[var(--civic-text)]'
                            : 'text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
                        }`}
                        style={
                          activeFilter === filter.id
                            ? { background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }
                            : undefined
                        }
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="space-y-4 px-5 py-5 lg:px-8 lg:py-8">
                {filteredNotifications.length ? (
                  filteredNotifications.map((notification) => (
                    <article
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      className="cursor-pointer rounded-[24px] border border-[var(--civic-border)] px-5 py-5 transition hover:-translate-y-0.5"
                      style={{
                        background: notification.read ? 'var(--civic-surface-soft)' : 'var(--civic-surface)',
                        boxShadow: notification.read
                          ? 'var(--civic-shadow-soft)'
                          : '0 18px 34px rgba(10,106,59,0.08)',
                      }}
                    >
                      <div className="flex gap-4">
                        <div
                          className="mt-1 h-auto w-1 shrink-0 rounded-full"
                          style={{ background: getAccent(notification.type) }}
                        />

                        {notification.actor?.avatar ? (
                          <img
                            src={notification.actor.avatar}
                            alt={notification.actor.name}
                            className="size-11 rounded-md object-cover"
                          />
                        ) : (
                          <div
                            className="flex size-11 shrink-0 items-center justify-center rounded-md"
                            style={{ background: 'var(--civic-surface-strong)', color: 'var(--civic-primary)' }}
                          >
                            <Icon name={getIcon(notification.type)} className="text-[1.1rem]" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-base font-bold text-[var(--civic-text)]">{notification.title}</p>
                            <div className="flex items-center gap-2">
                              {!notification.read && <span className="size-2 rounded-full bg-[var(--civic-primary)]" />}
                              <span className="text-xs text-[var(--civic-muted)]">{notification.timestamp}</span>
                            </div>
                          </div>

                          <p className="mt-3 text-[15px] leading-7 text-[var(--civic-muted)]">{notification.body}</p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div
                    className="rounded-[24px] border border-[var(--civic-border)] px-6 py-10 text-center"
                    style={{ background: 'var(--civic-surface-soft)', boxShadow: 'var(--civic-shadow-soft)' }}
                  >
                    <p className="text-lg font-bold text-[var(--civic-text)]">No notifications here</p>
                    <p className="mt-2 text-sm text-[var(--civic-muted)]">Try another tab or check again later.</p>
                  </div>
                )}
              </div>
            </section>

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
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--civic-muted)]">About this page</p>
                <p className="mt-3 text-sm leading-7 text-[var(--civic-muted)]">
                  Read official replies, community mentions, and system updates in one place without losing the trail.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
