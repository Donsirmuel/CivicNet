import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './';
import {
  NOTIFICATIONS_CHANGED_EVENT,
  notificationsService,
} from '../../services/notifications';

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  const edgeItems = [
    { icon: 'home', label: 'Home', path: '/feed' },
    { icon: 'mail', label: 'Messages', path: '/messages' },
    {
      icon: 'notifications',
      label: 'Notifications',
      path: '/notifications',
      hasNotification: unreadNotifications > 0,
    },
    { icon: 'person', label: 'Profile', path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handlePrimaryAction = () => {
    if (location.pathname !== '/feed') {
      navigate('/feed');
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('civic:open-composer'));
      }, 150);
    } else {
      window.dispatchEvent(new CustomEvent('civic:open-composer'));
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl lg:hidden"
      style={{ borderColor: 'var(--civic-border)', background: 'rgba(17, 13, 11, 0.88)' }}
    >
      <div className="relative grid h-[76px] grid-cols-5 items-center px-2">
        {edgeItems.slice(0, 2).map((item) => (
          <Link
            key={`${item.path}-${item.label}`}
            to={item.path}
            className={`relative flex flex-col items-center justify-center gap-1 px-2 py-2 transition ${
              isActive(item.path) ? 'text-[var(--civic-primary)]' : 'text-[var(--civic-muted)]'
            }`}
          >
            <Icon name={item.icon} filled={isActive(item.path)} className="text-xl" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{item.label}</span>
          </Link>
        ))}

        <button
          type="button"
          onClick={handlePrimaryAction}
          className="relative mx-auto -mt-8 flex size-14 items-center justify-center rounded-[18px] text-[var(--civic-primary-contrast)] shadow-[0_22px_40px_rgba(10,106,59,0.24)]"
          style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
          aria-label="Report an issue"
        >
          <Icon name="add" className="text-[1.7rem]" />
        </button>

        {edgeItems.slice(2).map((item) => (
          <Link
            key={`${item.path}-${item.label}`}
            to={item.path}
            className={`relative flex flex-col items-center justify-center gap-1 px-2 py-2 transition ${
              isActive(item.path) ? 'text-[var(--civic-primary)]' : 'text-[var(--civic-muted)]'
            }`}
          >
            <Icon name={item.icon} filled={isActive(item.path)} className="text-xl" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">{item.label}</span>
            {item.hasNotification && (
              <span className="absolute right-3 top-1 size-2 rounded-full bg-[var(--civic-primary)]" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
