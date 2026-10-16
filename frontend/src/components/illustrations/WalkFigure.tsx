import { HAIR, INK, PRIMARY } from './tokens';

/** Tiny walking figure — footer mark. */
export function WalkFigure({ className = '', skin = '#8d6548' }: { className?: string; skin?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect x="18" y="34" width="8" height="22" rx="4" fill={INK} />
      <rect x="32" y="34" width="8" height="22" rx="4" fill={INK} opacity="0.8" />
      <path d="M19 22 h20 a5 5 0 0 1 5 5 v7 h-30 v-7 a5 5 0 0 1 5-5z" fill={PRIMARY} />
      <circle cx="29" cy="14" r="8" fill={skin} />
      <path d="M21 13 a8 8 0 0 1 16 0 c-1 -4 -4.5 -6 -8 -6s-7 2 -8 6z" fill={HAIR} />
    </svg>
  );
}
