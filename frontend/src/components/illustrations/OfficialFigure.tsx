import { GOLD, HAIR, INK, PRIMARY } from './tokens';

/** Verified official with check badge — hero + "Answer" card. */
export function OfficialFigure({ className = '', skin = '#6b4a35' }: { className?: string; skin?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="110" rx="30" ry="5" fill={INK} opacity="0.08" />
      <rect x="36" y="72" width="12" height="30" rx="6" fill="#243b53" />
      <rect x="62" y="72" width="12" height="30" rx="6" fill="#243b53" opacity="0.9" />
      <rect x="36" y="98" width="16" height="7" rx="3.5" fill="#fff" stroke={INK} strokeOpacity="0.12" />
      <rect x="60" y="98" width="16" height="7" rx="3.5" fill="#fff" stroke={INK} strokeOpacity="0.12" />
      <path d="M38 46 h36 a8 8 0 0 1 8 8 v18 h-52 v-18 a8 8 0 0 1 8-8z" fill="#fff" stroke={INK} strokeOpacity="0.12" />
      <path d="M38 46 h14 v26 h-22 v-18 a8 8 0 0 1 8-8z" fill={PRIMARY} opacity="0.9" />
      <path d="M68 46 h6 v26 h-14z" fill={PRIMARY} opacity="0.9" />
      <rect x="36" y="52" width="10" height="22" rx="5" fill="#fff" stroke={INK} strokeOpacity="0.1" />
      <circle cx="41" cy="70" r="4.5" fill={skin} />
      <circle cx="60" cy="30" r="13" fill={skin} />
      <path d="M47 29 a13 13 0 0 1 26 -1 c-2 -6 -8 -9 -13 -9s-11 4 -13 10z" fill={HAIR} />
      <circle cx="88" cy="72" r="13" fill={PRIMARY} stroke="#fff" strokeWidth="3" />
      <path d="M82.5 72 l4 4 7.5 -8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="88" cy="34" r="9" fill={GOLD} opacity="0.35" />
    </svg>
  );
}
