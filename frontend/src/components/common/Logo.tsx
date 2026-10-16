import { Link } from 'react-router-dom';

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
      title: 'text-[1.35rem]',
      subtitle: 'text-[9px]',
    },
    md: {
      title: 'text-[1.65rem]',
      subtitle: 'text-[10px]',
    },
    lg: {
      title: 'text-[2.1rem]',
      subtitle: 'text-[11px]',
    },
  } as const;

  const classes = sizeClasses[size];

  const logoContent = (
    <span className="inline-flex min-w-0 flex-col leading-none">
      <span
        className={`font-display ${classes.title} font-bold tracking-[-0.02em] text-[#132033]`}
      >
        Civic<span className="italic text-[#0a6a3b]">Net</span>
        <span className="text-[#d4a540]">.</span>
      </span>
      {showTagline && (
        <span
          className={`${classes.subtitle} mt-1 font-semibold uppercase tracking-[0.24em] text-[#0a6a3b]/80`}
        >
          {subtitle}
        </span>
      )}
    </span>
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
