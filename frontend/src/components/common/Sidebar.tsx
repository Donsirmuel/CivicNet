import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Logo } from './';
import { authService, usersService } from '../../services';
import type { User } from '../../types';
import {
  NOTIFICATIONS_CHANGED_EVENT,
  notificationsService,
} from '../../services/notifications';

const AVATAR_COLORS = ['#a87b5a', '#0a6a3b', '#31572c', '#d4a540'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ? parts[0][0] : '';
  const second = parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : '';
  return `${first}${second}`.toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % 2147483647;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0] ?? '#0a6a3b';
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await usersService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const eventName = usersService.getUserUpdatedEventName();
    const handleUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<User>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      }
    };

    window.addEventListener(eventName, handleUserUpdated as EventListener);
    return () => window.removeEventListener(eventName, handleUserUpdated as EventListener);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const syncUnreadCount = () => {
      notificationsService.getUnreadCount().then(setUnreadNotifications).catch(() => {});
    };

    syncUnreadCount();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, syncUnreadCount as EventListener);

    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, syncUnreadCount as EventListener);
    };
  }, []);

  const navItems = [
    { icon: 'home', label: 'Home', path: '/feed' },
    { icon: 'mail', label: 'Messages', path: '/messages' },
    {
      icon: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      hasNotification: unreadNotifications > 0,
    },
    { icon: 'person', label: 'Profile', path: '/profile' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handlePrimaryAction = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (location.pathname !== '/feed') {
      navigate('/feed');
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('civic:open-composer'));
      }, 150);
    } else {
      window.dispatchEvent(new CustomEvent('civic:open-composer'));
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const userDisplayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.full_name || user?.name || 'Citizen';

  const userAvatar = user?.avatar || user?.profile_picture;

  return (
    <aside
      className={`sticky top-0 flex h-screen w-full flex-col justify-between py-5 transition-all duration-300 ${
        isCollapsed ? 'px-2' : 'px-3'
      } border-r`}
      style={{ background: 'var(--civic-bg)', borderColor: 'var(--civic-border)' }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 px-2">
          {!isCollapsed && <Logo size="sm" linkTo="/feed" showTagline={true} subtitle="Community First" />}
          <button
            onClick={() => setIsCollapsed((current) => !current)}
            className="civic-icon-button size-10"
            style={{ color: 'var(--civic-muted)' }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={isCollapsed ? 'chevron_right' : 'chevron_left'} className="text-xl" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-3 transition ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                style={
                  active
                    ? { background: 'rgba(10,106,59,.10)', color: '#132033' }
                    : { color: 'var(--civic-muted)' }
                }
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = '#132033';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--civic-muted)';
                }}
              >
                {!isCollapsed && active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0a6a3b]" />
                )}
                <Icon name={item.icon} filled={active} className="text-[1.25rem]" />
                {!isCollapsed && (
                  <span className="text-[15px] font-semibold tracking-[-0.01em]">{item.label}</span>
                )}
                {item.hasNotification && (
                  <span className={`absolute ${isCollapsed ? 'right-3 top-2' : 'right-4 top-4'} size-2 rounded-full bg-[#0a6a3b]`} />
                )}
              </Link>
            );
          })}
        </nav>

        {!isCollapsed ? (
          <button
            onClick={handlePrimaryAction}
            className="grid min-h-12 w-full grid-cols-[24px_1fr_24px] items-center rounded-xl px-6 py-3 text-[15px] font-semibold transition hover:brightness-105"
            style={{
              background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)',
              color: 'var(--civic-primary-contrast)',
              boxShadow: '0 18px 38px rgba(10,106,59,0.12)',
            }}
          >
            <Icon name="add" className="text-lg" />
            <span className="text-center">Report</span>
            <span />
          </button>
        ) : (
          <button
            onClick={handlePrimaryAction}
            className="mx-auto flex size-12 items-center justify-center rounded-xl text-[var(--civic-primary-contrast)] shadow-[0_18px_38px_rgba(10,106,59,0.12)] transition hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
            title="Report an issue"
          >
            <Icon name="add" className="text-xl" />
          </button>
        )}
      </div>

      <div ref={menuRef} className="space-y-4">
        {!isCollapsed && (
          <div className="px-3">
            <div className="civic-hairline" />
            <p className="pt-3 text-[13px] font-medium italic text-[var(--civic-muted)]">
              Nothing goes silent.
            </p>
            <p className="mt-1 text-xs text-[var(--civic-muted)]/80">
              CivicNet &middot; {new Date().getFullYear()}
            </p>
          </div>
        )}

        <div className="relative">
        {!isCollapsed ? (
          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition"
            style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
          >
            {userAvatar ? (
              <img className="size-11 rounded-lg object-cover" src={userAvatar} alt="User avatar" />
            ) : (
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold text-white"
                style={{ background: getAvatarColor(userDisplayName) }}
                aria-hidden="true"
              >
                {getInitials(userDisplayName)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--civic-text)]">{userDisplayName}</p>
              <p className="mt-0.5 truncate text-[13px] text-[var(--civic-muted)]">@{user?.username || 'citizen'}</p>
            </div>
            <Icon name="more_horiz" className="text-[var(--civic-muted)]" />
          </button>
        ) : (
          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="mx-auto transition hover:opacity-90"
            title={userDisplayName}
          >
            {userAvatar ? (
              <img className="size-11 rounded-lg object-cover" src={userAvatar} alt="User avatar" />
            ) : (
              <span
                className="flex size-11 items-center justify-center rounded-lg text-[15px] font-bold text-white"
                style={{ background: getAvatarColor(userDisplayName) }}
                aria-hidden="true"
              >
                {getInitials(userDisplayName)}
              </span>
            )}
          </button>
        )}

        {isMenuOpen && (
          <div
            className="absolute bottom-full mb-2 w-56 rounded-[18px] py-2 shadow-[0_20px_40px_rgba(22,33,51,0.12)]"
            style={{ background: 'var(--civic-surface-strong)', boxShadow: '0 20px 40px rgba(22,33,51,0.12), inset 0 0 0 1px var(--civic-border)' }}
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/profile');
              }}
              className="flex w-full items-center gap-3 px-4 py-3 transition hover:text-[var(--civic-text)]"
              style={{ color: 'var(--civic-muted)' }}
            >
              <Icon name="person" className="text-lg" />
              <span className="text-sm font-bold">View profile</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/settings');
              }}
              className="flex w-full items-center gap-3 px-4 py-3 transition hover:text-[var(--civic-text)]"
              style={{ color: 'var(--civic-muted)' }}
            >
              <Icon name="settings" className="text-lg" />
              <span className="text-sm font-bold">Settings</span>
            </button>
            <div className="my-2 border-t" style={{ borderColor: 'var(--civic-border)' }} />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-[var(--civic-danger)] transition hover:bg-[rgba(218,92,78,0.08)]"
            >
              <Icon name="logout" className="text-lg" />
              <span className="text-sm font-bold">Log out</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </aside>
  );
}
