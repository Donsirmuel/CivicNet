import { Link } from 'react-router-dom';
import Icon from './Icon';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  linkTo?: string | null;
  subtitle?: string;
}

export default function Logo({
  size = 'md',
  showTagline = true,
  linkTo = '/',
  subtitle = 'Community First',
}: LogoProps) {
  const sizeClasses = {
    sm: {
      iconBox: 'size-10 rounded-md',
      iconSize: 'text-[1.45rem]',
      title: 'text-lg',
      subtitle: 'text-[10px]',
      gap: 'gap-3',
    },
    md: {
      iconBox: 'size-12 rounded-md',
      iconSize: 'text-[1.65rem]',
      title: 'text-[1.65rem]',
      subtitle: 'text-[11px]',
      gap: 'gap-3.5',
    },
    lg: {
      iconBox: 'size-14 rounded-lg',
      iconSize: 'text-[1.85rem]',
      title: 'text-[2.1rem]',
      subtitle: 'text-xs',
      gap: 'gap-4',
    },
  } as const;

  const classes = sizeClasses[size];

  const logoContent = (
    <div className={`flex items-center ${classes.gap}`}>
      <div
        className={`${classes.iconBox} flex shrink-0 items-center justify-center bg-[linear-gradient(180deg,#0a6a3b_0%,#005129_100%)] text-white shadow-[0_14px_26px_rgba(0,81,41,0.12)]`}
      >
        <Icon name="account_balance" className={classes.iconSize} />
      </div>

      <div className="min-w-0">
        <p
          className={`${classes.title} font-black uppercase tracking-[-0.03em] leading-none text-[var(--civic-text)]`}
        >
          CivicNet
        </p>
        {showTagline && (
          <p
            className={`${classes.subtitle} mt-1 uppercase tracking-[0.28em] font-bold leading-none text-[var(--civic-primary)]`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-block transition-opacity hover:opacity-85">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
