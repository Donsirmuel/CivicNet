import { GOLD, HAIR, INK, PRIMARY } from './tokens';

/** Figure climbing Ward → LGA → State ladder — "Route" card. */
export function RouteFigure({ className = '', skin = '#a87b5a' }: { className?: string; skin?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="110" rx="32" ry="5" fill={INK} opacity="0.08" />
      <g stroke={INK} strokeOpacity="0.2" strokeWidth="3" strokeLinecap="round">
        <line x1="78" y1="18" x2="78" y2="108" />
        <line x1="100" y1="18" x2="100" y2="108" />
      </g>
      <g stroke={GOLD} strokeWidth="4" strokeLinecap="round">
        <line x1="78" y1="40" x2="100" y2="40" />
        <line x1="78" y1="64" x2="100" y2="64" />
        <line x1="78" y1="88" x2="100" y2="88" />
      </g>
      <circle cx="89" cy="40" r="3.5" fill={PRIMARY} />
      <rect x="28" y="66" width="11" height="28" rx="5.5" fill={INK} />
      <rect x="50" y="60" width="11" height="28" rx="5.5" fill={INK} opacity="0.85" />
      <path d="M30 42 h24 a7 7 0 0 1 7 7 v14 h-38 v-14 a7 7 0 0 1 7-7z" fill={PRIMARY} />
      <rect x="24" y="48" width="9" height="20" rx="4.5" fill={PRIMARY} />
      <circle cx="28" cy="64" r="4.5" fill={skin} />
      <circle cx="44" cy="28" r="11" fill={skin} />
      <path d="M33 27 a11 11 0 0 1 22 0 c-1 -5 -6 -8 -11 -8s-10 3 -11 8z" fill={HAIR} />
      <rect x="58" y="46" width="9" height="18" rx="4.5" fill={skin} />
    </svg>
  );
}
