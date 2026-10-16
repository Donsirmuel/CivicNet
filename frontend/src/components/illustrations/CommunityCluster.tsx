import { BLUE, CLAY, GOLD, HAIR, INK, PRIMARY } from './tokens';

/** Small community gathering — closing band. */
export function CommunityCluster({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 110" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="110" cy="102" rx="80" ry="6" fill={INK} opacity="0.12" />
      <g>
        <rect x="28" y="62" width="11" height="32" rx="5.5" fill={INK} />
        <rect x="51" y="62" width="11" height="32" rx="5.5" fill={INK} opacity="0.85" />
        <path d="M30 40 h30 a7 7 0 0 1 7 7 v15 h-44 v-15 a7 7 0 0 1 7-7z" fill={PRIMARY} />
        <circle cx="45" cy="28" r="12" fill="#8d6548" />
        <path d="M33 27 a12 12 0 0 1 24 0 c-1.5 -6 -7 -8.5 -12 -8.5s-10.5 2.5 -12 8.5z" fill={HAIR} />
        <circle cx="72" cy="40" r="9" fill={GOLD} />
        <path d="M68 40 l3 3 5.5 -6" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g>
        <rect x="99" y="58" width="12" height="36" rx="6" fill={INK} />
        <rect x="123" y="58" width="12" height="36" rx="6" fill={INK} opacity="0.85" />
        <path d="M101 34 h32 a7 7 0 0 1 7 7 v17 h-46 v-17 a7 7 0 0 1 7-7z" fill={BLUE} />
        <circle cx="117" cy="22" r="12" fill="#6b4a35" />
        <circle cx="105" cy="16" r="6" fill={HAIR} />
        <circle cx="117" cy="13" r="7" fill={HAIR} />
        <circle cx="129" cy="16" r="6" fill={HAIR} />
      </g>
      <g>
        <rect x="160" y="62" width="11" height="32" rx="5.5" fill={INK} />
        <rect x="181" y="62" width="11" height="32" rx="5.5" fill={INK} opacity="0.85" />
        <path d="M162 40 h28 a7 7 0 0 1 7 7 v15 h-42 v-15 a7 7 0 0 1 7-7z" fill={CLAY} />
        <circle cx="176" cy="28" r="12" fill="#c49a7a" />
        <path d="M164 24 c0 -7 24 -7 24 2 c-4 -1 -6 1 -9 1 s-4 -3 -8 -2 s-6 3 -7 -1z" fill={HAIR} />
      </g>
    </svg>
  );
}
