import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin } from 'lucide-react';

export type Pin = {
  id: string;
  lga: string;
  state: string;
  x: number;
  y: number;
  status: 'open' | 'in_progress' | 'resolved';
  category: string;
  citizen: string;
  excerpt: string;
  official?: string;
  officialTitle?: string;
  reply?: string;
};

export const PINS: Pin[] = [
  {
    id: 'sok-01',
    lga: 'Sokoto South',
    state: 'Sokoto',
    x: 204,
    y: 109,
    status: 'in_progress',
    category: 'Health',
    citizen: 'Fatima B.',
    excerpt: 'Primary health centre in Runjin Sambo has no malaria drugs.',
    official: 'Dr. U. Bello',
    officialTitle: 'PHC Coordinator',
    reply: "Restock arrives Thursday. I'll be on site.",
  },
  {
    id: 'kn-04',
    lga: 'Nassarawa',
    state: 'Kano',
    x: 387,
    y: 158,
    status: 'open',
    category: 'Roads',
    citizen: 'Musa I.',
    excerpt: 'Zoo Road has 4 open manholes. Two accidents this week.',
  },
  {
    id: 'mai-02',
    lga: 'Jere',
    state: 'Borno',
    x: 646,
    y: 166,
    status: 'resolved',
    category: 'Water',
    citizen: 'Aisha K.',
    excerpt: 'Custom borehole finally flowing after 6 months.',
    official: 'Eng. M. Grema',
    officialTitle: 'State Water Board',
    reply: 'Pump replaced. New maintenance schedule posted.',
  },
  {
    id: 'kd-07',
    lga: 'Kaduna North',
    state: 'Kaduna',
    x: 326,
    y: 230,
    status: 'in_progress',
    category: 'Power',
    citizen: 'Yusuf T.',
    excerpt: 'Ungwan Rimi has been on 4 hours of light in 3 days.',
    official: 'KAEDCO Rep',
    officialTitle: 'Feeder Manager',
    reply: 'Transformer swap scheduled Saturday.',
  },
  {
    id: 'jos-01',
    lga: 'Jos North',
    state: 'Plateau',
    x: 408,
    y: 259,
    status: 'open',
    category: 'Sanitation',
    citizen: 'Nanret D.',
    excerpt: 'Terminus market drainage overflowing again.',
  },
  {
    id: 'fct-01',
    lga: 'AMAC',
    state: 'FCT',
    x: 329,
    y: 302,
    status: 'in_progress',
    category: 'Transit',
    citizen: 'Blessing E.',
    excerpt: 'Kubwa BRT stop still has no shelter after 8 months.',
    official: 'Hon. R. Danjuma',
    officialTitle: 'FCT Transport Sec.',
    reply: 'Contractor mobilises Monday.',
  },
  {
    id: 'ib-03',
    lga: 'Ibadan North',
    state: 'Oyo',
    x: 128,
    y: 384,
    status: 'resolved',
    category: 'Education',
    citizen: 'Tunde A.',
    excerpt: 'Bodija primary got its new roof before rainy season.',
    official: 'Mrs. F. Adebayo',
    officialTitle: 'SUBEB Director',
    reply: 'Photos uploaded. Thanks for the pressure.',
  },
  {
    id: 'ike-02',
    lga: 'Ikeja',
    state: 'Lagos',
    x: 98,
    y: 423,
    status: 'in_progress',
    category: 'Waste',
    citizen: 'Ada C.',
    excerpt: 'Allen Ave PSP truck skipped our street 3 weeks.',
    official: 'LAWMA Zonal Officer',
    officialTitle: 'Lagos West',
    reply: 'New PSP assigned. Pickup resumes tomorrow.',
  },
  {
    id: 'lg-11',
    lga: 'Eti-Osa',
    state: 'Lagos',
    x: 109,
    y: 430,
    status: 'open',
    category: 'Roads',
    citizen: 'Kelechi O.',
    excerpt: 'Ajah–Sangotedo axis: pothole crater blocking one lane.',
  },
  {
    id: 'bn-02',
    lga: 'Oredo',
    state: 'Edo',
    x: 225,
    y: 436,
    status: 'in_progress',
    category: 'Security',
    citizen: 'Osaro U.',
    excerpt: 'Streetlights out on Airport Road since December.',
    official: 'Hon. P. Ize',
    officialTitle: 'LGA Chair',
    reply: 'Poles surveyed. Restoration in phases.',
  },
  {
    id: 'en-05',
    lga: 'Enugu East',
    state: 'Enugu',
    x: 333,
    y: 430,
    status: 'open',
    category: 'Health',
    citizen: 'Ngozi M.',
    excerpt: 'Abakpa PHC delivery room without power for 2 weeks.',
  },
  {
    id: 'nnw-01',
    lga: 'Nnewi North',
    state: 'Anambra',
    x: 296,
    y: 451,
    status: 'in_progress',
    category: 'Water',
    citizen: 'Chinelo N.',
    excerpt: 'Umudim borehole dry 3 weeks — kids walk 40 min for water.',
    official: 'Hon. A. Okeke',
    officialTitle: 'LGA Chairman',
    reply: 'Repair team on site today. Photo update Friday.',
  },
  {
    id: 'ph-03',
    lga: 'Port Harcourt',
    state: 'Rivers',
    x: 302,
    y: 512,
    status: 'resolved',
    category: 'Waste',
    citizen: 'Ibim W.',
    excerpt: 'Rumuola gutter finally cleared before the rains.',
    official: 'RIWAMA',
    officialTitle: 'Zone 3',
    reply: 'Monthly desilting now on the schedule.',
  },
  {
    id: 'cal-01',
    lga: 'Calabar Municipality',
    state: 'Cross River',
    x: 377,
    y: 503,
    status: 'open',
    category: 'Housing',
    citizen: 'Etim B.',
    excerpt: 'Marian flood-prone estate needs surveyed drainage plan.',
  },
];

/** Accurate Nigeria outline (Natural Earth 110m, public domain),
 *  projected lon 2.5–15E / lat 4–14.2N into the 800x600 viewBox. */
const NIGERIA_PATH =
  'M 60.7 439.3 L 63.9 360.3 L 62.5 329.1 L 73.1 298.2 L 90.3 283.1 L 117.5 252.8 L 111.6 239.6 L 122.6 219.9 L 110 190.8 L 112.2 174.5 L 116.1 130.7 L 132.2 111 L 140 82.8 L 154.6 72.2 L 214.8 66.4 L 270.9 84.7 L 291.9 103.2 L 320.5 104 L 347.1 92 L 414.8 117.3 L 443.4 116.1 L 476.4 95.2 L 509.3 96.7 L 525.4 89.8 L 555.6 92.7 L 598.9 107 L 642.7 79.6 L 655.8 81.6 L 693.7 135.2 L 704.2 134.1 L 726.3 153.7 L 720.2 162.5 L 717.3 178.8 L 670.1 216.7 L 655.3 248 L 647.4 273.5 L 635.5 284.4 L 624.2 318.7 L 594.3 338.9 L 585.6 363.7 L 573 383.5 L 567.8 403.9 L 529.3 420.4 L 497.9 400.2 L 476.6 401 L 443.3 429.7 L 427.1 430.2 L 400.4 477.5 L 386 512.2 L 327.9 529.8 L 306.6 527.2 L 285.1 538.2 L 240.3 537.1 L 210.3 506.5 L 191.9 471 L 152.2 438.7 L 110.2 439.3 Z';

/** Niger + Benue rivers (real courses, same projection) meeting at Lokoja. */
const NIGER_RIVER = 'M 134 95 C 160 130, 200 190, 235 232 C 255 270, 270 300, 274 305 C 280 330, 285 350, 288 364 C 280 395, 268 420, 263 428 C 256 450, 250 470, 246 491';
const BENUE_RIVER = 'M 610 339 C 560 335, 500 330, 498 329 C 470 335, 440 345, 414 354 C 385 358, 355 360, 330 359 C 315 360, 300 362, 288 364';
const ABUJA = { x: 329, y: 302 };

const statusColor: Record<Pin['status'], string> = {
  open: 'bg-foreground',
  in_progress: 'bg-accent',
  resolved: 'bg-primary',
};

const statusRing: Record<Pin['status'], string> = {
  open: 'bg-foreground/40',
  in_progress: 'bg-accent/50',
  resolved: 'bg-primary/40',
};

type Props = {
  variant?: 'hero' | 'rail' | 'backdrop';
  onPinClick?: (pin: Pin) => void;
  activeId?: string | null;
  className?: string;
};

export function NigeriaMap({ variant = 'hero', onPinClick, activeId, className }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [autoId, setAutoId] = useState<string>(PINS[0].id);

  useEffect(() => {
    if (variant === 'rail') return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % PINS.length;
      setAutoId(PINS[i].id);
    }, 4000);
    return () => clearInterval(t);
  }, [variant]);

  const activePin =
    PINS.find((p) => p.id === (hoverId ?? activeId ?? (variant === 'rail' ? null : autoId))) ??
    null;

  const isRail = variant === 'rail';
  const isBackdrop = variant === 'backdrop';

  if (isBackdrop) {
    return <BackdropMap activePin={activePin} className={className} />;
  }

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <svg
        viewBox="0 0 800 600"
        className="h-auto w-full"
        role="img"
        aria-label="Map of Nigeria showing recent civic cases"
      >
        <defs>
          <linearGradient id="nmapFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--paper)" />
            <stop offset="100%" stopColor="var(--muted)" />
          </linearGradient>
          <pattern id="nmapGrain" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="var(--hairline)" opacity="0.35" />
          </pattern>
        </defs>

        <path d={NIGERIA_PATH} transform="translate(6 8)" fill="var(--foreground)" opacity="0.06" />
        <path
          d={NIGERIA_PATH}
          fill="url(#nmapFill)"
          stroke="var(--foreground)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d={NIGERIA_PATH} fill="url(#nmapGrain)" opacity="0.5" />

        <g fill="none" strokeLinecap="round">
          <path d={NIGER_RIVER} stroke="#7ba7bc" strokeWidth="1.6" opacity="0.7" />
          <path d={BENUE_RIVER} stroke="#7ba7bc" strokeWidth="1.4" opacity="0.6" />
        </g>
        <g opacity="0.5">
          <circle cx={ABUJA.x} cy={ABUJA.y} r="26" fill="none" stroke="var(--foreground)" strokeWidth="0.7" strokeDasharray="2 5" />
          <circle cx={ABUJA.x} cy={ABUJA.y} r="44" fill="none" stroke="var(--foreground)" strokeWidth="0.6" strokeDasharray="2 7" opacity="0.7" />
        </g>
        <g transform={`translate(${ABUJA.x} ${ABUJA.y})`}>
          <path
            d="M 0 -7 L 2 -2 L 7 -2 L 3 1.5 L 4.5 6.5 L 0 3.5 L -4.5 6.5 L -3 1.5 L -7 -2 L -2 -2 Z"
            fill="var(--primary)"
            stroke="#fff"
            strokeWidth="1"
          />
        </g>
      </svg>

      <div className="absolute inset-0">
        {PINS.map((pin, i) => {
          const isActive = activePin?.id === pin.id;
          const left = (pin.x / 800) * 100;
          const top = (pin.y / 600) * 100;
          return (
            <motion.button
              key={pin.id}
              type="button"
              onMouseEnter={() => setHoverId(pin.id)}
              onMouseLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(pin.id)}
              onBlur={() => setHoverId(null)}
              onClick={() => onPinClick?.(pin)}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              style={{ left: `${left}%`, top: `${top}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              aria-label={`${pin.category} case in ${pin.lga}, ${pin.state}`}
            >
              {isActive && (
                <span
                  className={`absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full ${statusRing[pin.status]} animate-ping`}
                />
              )}
              <span
                className={`relative block rounded-full border-2 border-background shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform group-hover:scale-125 ${statusColor[pin.status]} ${
                  isRail ? 'h-2 w-2' : 'h-3 w-3'
                }`}
              />
            </motion.button>
          );
        })}
      </div>

      {!isRail && (
        <>
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-full border border-hairline/70 bg-card/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70 backdrop-blur">
            <LegendDot color="bg-foreground" label="Open" />
            <LegendDot color="bg-accent" label="In progress" />
            <LegendDot color="bg-primary" label="Resolved" />
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 hidden gap-4 rounded-full border border-hairline/70 bg-card/85 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70 backdrop-blur sm:flex">
            <span>Recent reports across Nigeria</span>
          </div>
        </>
      )}

      {activePin && !isRail && (
        <motion.div
          key={activePin.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none absolute left-3 top-3 w-[min(320px,80%)] rounded-2xl border border-hairline/80 bg-card/95 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <PinCardContent pin={activePin} />
        </motion.div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

/** Low-opacity watermark map for the centered hero: landmass faded so text
 *  stays readable, hotspots kept at full glow. Non-interactive. */
function BackdropMap({ activePin, className }: { activePin: Pin | null; className?: string }) {
  const dotFill: Record<Pin['status'], string> = {
    open: '#132033',
    in_progress: '#d4a540',
    resolved: '#0a6a3b',
  };
  // Escalation arcs: a few far pins routing toward Abuja (Aso Rock).
  const arcs = [PINS[2], PINS[13], PINS[8], PINS[0]].map((p) => {
    const mx = (p.x + ABUJA.x) / 2;
    const my = Math.min(p.y, ABUJA.y) - 60;
    return `M ${p.x} ${p.y} Q ${mx} ${my} ${ABUJA.x} ${ABUJA.y}`;
  });

  return (
    <div aria-hidden="true" className={`pointer-events-none relative h-full w-full ${className ?? ''}`}>
      <svg viewBox="0 0 800 600" className="h-full w-full" focusable="false">
        <defs>
          <linearGradient id="nmapBackFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0a6a3b" stopOpacity="0.30" />
            <stop offset="55%" stopColor="#0a6a3b" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#d4a540" stopOpacity="0.22" />
          </linearGradient>
          <radialGradient id="nmapHot" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#d4a540" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d4a540" stopOpacity="0" />
          </radialGradient>
          <filter id="nmapDepth" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0e2a1d" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* relief stack: extruded shadow layers give the landmass depth */}
        <g opacity="1">
          <path d={NIGERIA_PATH} transform="translate(0 9)" fill="#0e2a1d" opacity="0.14" strokeLinejoin="round" />
          <path d={NIGERIA_PATH} transform="translate(0 4.5)" fill="#0e2a1d" opacity="0.10" strokeLinejoin="round" />
        </g>

        <g opacity="0.55" filter="url(#nmapDepth)">
          <path
            d={NIGERIA_PATH}
            fill="url(#nmapBackFill)"
            stroke="#0b0e0c"
            strokeOpacity="0.8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* top-light bevel: thin paper highlight along the upper edge */}
          <path
            d={NIGERIA_PATH}
            transform="translate(0 -1)"
            fill="none"
            stroke="#fbf7f0"
            strokeOpacity="0.55"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <path d={NIGER_RIVER} stroke="#7ba7bc" strokeWidth="1.6" opacity="0.5" fill="none" strokeLinecap="round" />
          <path d={BENUE_RIVER} stroke="#7ba7bc" strokeWidth="1.4" opacity="0.45" fill="none" strokeLinecap="round" />
        </g>

        {arcs.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#0a6a3b"
            strokeOpacity="0.4"
            strokeWidth="1.2"
            strokeDasharray="3 5"
          />
        ))}

        <g opacity="0.6">
          <circle cx={ABUJA.x} cy={ABUJA.y} r="30" fill="none" stroke="#0a6a3b" strokeWidth="0.8" strokeDasharray="2 5" />
          <circle cx={ABUJA.x} cy={ABUJA.y} r="52" fill="none" stroke="#0a6a3b" strokeWidth="0.6" strokeDasharray="2 7" opacity="0.8" />
        </g>

        {PINS.map((pin) => {
          const isActive = activePin?.id === pin.id;
          return (
            <g key={pin.id} transform={`translate(${pin.x} ${pin.y})`}>
              <circle r={isActive ? 16 : 10} fill="url(#nmapHot)" opacity={isActive ? 0.9 : 0.55} />
              {isActive && (
                <circle r="16" fill="none" stroke={dotFill[pin.status]} strokeOpacity="0.6" strokeWidth="1.2">
                  <animate attributeName="r" values="8;20" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={isActive ? 5 : 3.5} fill={dotFill[pin.status]} stroke="#fbf7f0" strokeWidth="1.5" />
            </g>
          );
        })}

        <g transform={`translate(${ABUJA.x} ${ABUJA.y})`} opacity="0.9">
          <path
            d="M 0 -7 L 2 -2 L 7 -2 L 3 1.5 L 4.5 6.5 L 0 3.5 L -4.5 6.5 L -3 1.5 L -7 -2 L -2 -2 Z"
            fill="#0a6a3b"
            stroke="#fbf7f0"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}

function PinCardContent({ pin }: { pin: Pin }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/60">
          <MapPin className="h-3 w-3" />
          {pin.lga} · {pin.state}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
            pin.status === 'resolved'
              ? 'bg-primary/15 text-primary'
              : pin.status === 'in_progress'
                ? 'bg-accent/30 text-foreground'
                : 'bg-muted text-foreground/70'
          }`}
        >
          {pin.status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        {pin.category}
      </p>
      <p className="mt-1 text-sm leading-snug text-foreground">
        <span className="font-semibold">{pin.citizen}:</span> &quot;{pin.excerpt}&quot;
      </p>
      {pin.reply ? (
        <div className="mt-2.5 rounded-lg border border-primary/25 bg-primary/[0.05] p-2.5">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
            <CheckCircle2 className="h-3 w-3" /> Verified · {pin.official}
          </div>
          <p className="mt-1 text-xs leading-snug text-foreground/85">&quot;{pin.reply}&quot;</p>
        </div>
      ) : (
        <div className="mt-2.5 rounded-lg border border-dashed border-hairline/80 p-2.5 text-[11px] italic text-foreground/60">
          Awaiting an official response.
        </div>
      )}
    </>
  );
}
