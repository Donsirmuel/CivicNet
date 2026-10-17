type Props = {
  className?: string;
};

/**
 * Small flat-vector patch of road with a pothole, drawn to match the
 * surrounding illustration style (bold fills, thin dark outlines).
 * Decorative: the accessible name lives on the figure beside it.
 */
export function PotholeRoad({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 320 160"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* asphalt slab, seen at a shallow angle */}
      <path
        d="M4 44 L316 22 L320 126 L0 140 Z"
        fill="#3d434a"
        stroke="#14181b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* worn top edge / curb */}
      <path
        d="M4 44 L316 22 L317 38 L3 58 Z"
        fill="#5a626a"
        stroke="#14181b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* lane dashes */}
      <g fill="#f4f1e8" opacity="0.8">
        <path d="M30 92 L70 90 L70 98 L30 100 Z" transform="rotate(-2 50 95)" />
        <path d="M96 88 L136 86 L136 94 L96 96 Z" transform="rotate(-2 116 91)" />
      </g>
      {/* cracks reaching out from the hole */}
      <g
        fill="none"
        stroke="#14181b"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      >
        <path d="M188 66 l-16 14 l10 10 l-14 12" />
        <path d="M206 60 l16 -6" />
        <path d="M244 72 l22 8" />
        <path d="M232 128 l14 10" />
      </g>
      {/* the pothole */}
      <path
        d="M186 84 c10 -9 32 -12 48 -8 c15 4 26 15 24 27 c-2 13 -18 21 -37 21 c-19 0 -35 -8 -38 -20 c-2 -9 0 -15 3 -20 Z"
        fill="#12161a"
        stroke="#14181b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* ragged rim */}
      <path
        d="M186 84 c10 -9 32 -12 48 -8 c15 4 26 15 24 27"
        fill="none"
        stroke="#6b747d"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* standing water */}
      <path
        d="M205 100 c9 -4 22 -4 28 1 c5 4 1 11 -8 13 c-10 2 -19 0 -22 -5 c-2 -3 -1 -7 2 -9 Z"
        fill="#0a6a3b"
        opacity="0.55"
      />
      {/* loose stones */}
      <g fill="#5a626a" stroke="#14181b" strokeWidth="1.5">
        <circle cx="166" cy="120" r="4" />
        <circle cx="176" cy="132" r="3" />
        <circle cx="286" cy="96" r="3.5" />
      </g>
    </svg>
  );
}
