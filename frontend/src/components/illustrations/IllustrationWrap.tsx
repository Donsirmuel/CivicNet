import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  float?: 'a' | 'b' | 'c' | 'none';
  hideOnMobile?: boolean;
  label?: string;
};

/** Absolute-position wrapper: subtle float, hides extras on small screens for low-data/mobile. */
export function IllustrationWrap({ children, className = '', float = 'a', hideOnMobile = false, label }: Props) {
  const floatCls = float === 'none' ? '' : float === 'a' ? 'float-a' : float === 'b' ? 'float-b' : 'float-c';
  return (
    <div
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      className={`pointer-events-none select-none ${hideOnMobile ? 'hidden sm:block ' : ''}${floatCls} ${className}`}
    >
      {children}
    </div>
  );
}
