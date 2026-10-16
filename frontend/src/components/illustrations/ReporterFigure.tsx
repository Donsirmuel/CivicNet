import { BLUE, GOLD, HAIR, INK, PRIMARY } from './tokens';

/** Citizen reporting with a phone — hero + "File the case" card. */
export function ReporterFigure({ className = '', skin = '#8d6548' }: { className?: string; skin?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="110" rx="30" ry="5" fill={INK} opacity="0.08" />
      <rect x="34" y="72" width="12" height="30" rx="6" fill={INK} />
      <rect x="62" y="72" width="12" height="30" rx="6" fill={INK} opacity="0.85" />
      <rect x="36" y="98" width="16" height="7" rx="3.5" fill="#fff" stroke={INK} strokeOpacity="0.12" />
      <rect x="60" y="98" width="16" height="7" rx="3.5" fill="#fff" stroke={INK} strokeOpacity="0.12" />
      <path d="M38 46 h36 a8 8 0 0 1 8 8 v18 h-52 v-18 a8 8 0 0 1 8-8z" fill={PRIMARY} />
      <rect x="36" y="52" width="10" height="24" rx="5" fill={PRIMARY} />
      <rect x="36" y="70" width="9" height="9" rx="4.5" fill={skin} />
      <rect x="74" y="52" width="10" height="20" rx="5" fill={PRIMARY} />
      <rect x="76" y="100" width="14" height="20" rx="3" fill={INK} transform="rotate(-12 83 110)" />
      <rect x="78" y="102" width="10" height="14" rx="2" fill={BLUE} transform="rotate(-12 83 110)" />
      <circle cx="74" cy="66" r="5" fill={skin} />
      <circle cx="60" cy="30" r="13" fill={skin} />
      <path d="M47 30 a13 13 0 0 1 26 0 v-4 a8 10 0 0 0 -16 -6 a8 10 0 0 0 -10 6z" fill={HAIR} />
      <circle cx="86" cy="26" r="13" fill={GOLD} />
      <path d="M86 19 c-3.5 0 -6 2.6 -6 5.6 0 4 6 8 6 8s6-4 6-8c0-3-2.5-5.6-6-5.6z" fill="#fff" />
      <circle cx="86" cy="24.5" r="2" fill={PRIMARY} />
    </svg>
  );
}
