import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon, Logo } from './';
import { authService, usersService } from '../../services';
import type { User } from '../../types';
import {
  DEFAULT_NOTIFICATION_STATE,
  getNotificationEventName,
  readNotificationState,
  getUnreadCount,
} from '../../utils/notificationState';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(() =>
    getUnreadCount(readNotificationState(DEFAULT_NOTIFICATION_STATE)),
  );
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
      setUnreadNotifications(getUnreadCount(readNotificationState(DEFAULT_NOTIFICATION_STATE)));
    };

    const eventName = getNotificationEventName();
    window.addEventListener(eventName, syncUnreadCount as EventListener);
    window.addEventListener('storage', syncUnreadCount);

    return () => {
      window.removeEventListener(eventName, syncUnreadCount as EventListener);
      window.removeEventListener('storage', syncUnreadCount);
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
    if (location.pathname !== '/feed') {
      navigate('/feed');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <aside
      className={`sticky top-0 flex h-screen w-full flex-col justify-between py-5 transition-all duration-300 ${
        isCollapsed ? 'px-2' : 'px-3'
      }`}
      style={{ background: 'var(--civic-surface-muted)' }}
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
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 px-3 py-3 transition ${
                isCollapsed ? 'justify-center' : ''
              } ${
                isActive(item.path)
                  ? 'text-[var(--civic-primary)]'
                  : 'text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
              }`}
              style={isActive(item.path) ? { background: 'var(--civic-surface-strong)' } : undefined}
            >
              {!isCollapsed && isActive(item.path) && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[var(--civic-primary)]" />
              )}
              <Icon name={item.icon} filled={isActive(item.path)} className="text-[1.1rem]" />
              {!isCollapsed && <span className="text-sm font-bold">{item.label}</span>}
              {item.hasNotification && (
                <span className={`absolute ${isCollapsed ? 'right-3 top-2' : 'right-4 top-4'} size-2 rounded-full bg-[var(--civic-primary)]`} />
              )}
            </Link>
          ))}
        </nav>

        {!isCollapsed ? (
          <button
            onClick={handlePrimaryAction}
            className="grid min-h-14 w-full grid-cols-[24px_1fr_24px] items-center rounded-full px-6 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:brightness-105"
            style={{
              background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)',
              color: 'var(--civic-primary-contrast)',
              boxShadow: '0 18px 38px rgba(10,106,59,0.16)',
            }}
          >
            <Icon name="add" className="text-lg" />
            <span className="text-center">Create</span>
            <span />
          </button>
        ) : (
          <button
            onClick={handlePrimaryAction}
            className="mx-auto flex size-12 items-center justify-center rounded-full text-[var(--civic-primary-contrast)] shadow-[0_18px_38px_rgba(10,106,59,0.16)] transition hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
            title="Create"
          >
            <Icon name="add" className="text-xl" />
          </button>
        )}
      </div>

      <div ref={menuRef} className="space-y-4">
        {!isCollapsed && (
          <div className="space-y-3 px-2">
            <div className="civic-hairline" />
            <div className="space-y-3 rounded-md px-1 py-2">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">
                <span className="civic-rail-footer-link">Privacy</span>
                <span className="civic-rail-footer-link">Terms</span>
                <span className="civic-rail-footer-link">Report</span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--civic-muted)]/80">
                Civic Pulse
              </p>
            </div>
          </div>
        )}

        <div className="relative">
        {!isCollapsed ? (
          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition"
            style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
          >
            <img
              className="size-11 rounded-md object-cover"
              src={
                user?.avatar ||
                user?.profile_picture ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
              }
              alt="User avatar"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--civic-text)]">{userDisplayName}</p>
              <p className="mt-1 truncate text-[11px] text-[var(--civic-muted)]">@{user?.username || 'citizen'}</p>
            </div>
            <Icon name="more_horiz" className="text-[var(--civic-muted)]" />
          </button>
        ) : (
          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="mx-auto transition hover:opacity-90"
            title={userDisplayName}
          >
            <img
              className="size-11 rounded-md object-cover"
              src={
                user?.avatar ||
                user?.profile_picture ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
              }
              alt="User avatar"
            />
          </button>
        )}

        {isMenuOpen && (
          <div
            className="absolute bottom-full mb-2 w-56 rounded-md py-2 shadow-[0_20px_40px_rgba(22,33,51,0.12)]"
            style={{ background: 'var(--civic-surface-strong)', boxShadow: '0 20px 40px rgba(22,33,51,0.12), inset 0 0 0 1px var(--civic-ghost-border)' }}
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
              <span className="text-sm font-bold">View Profile</span>
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
              <span className="text-sm font-bold">Logout</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </aside>
  );
}
