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
    x: 192,
    y: 120,
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
    x: 464,
    y: 132,
    status: 'open',
    category: 'Roads',
    citizen: 'Musa I.',
    excerpt: 'Zoo Road has 4 open manholes. Two accidents this week.',
  },
  {
    id: 'mai-02',
    lga: 'Jere',
    state: 'Borno',
    x: 656,
    y: 140,
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
    x: 416,
    y: 200,
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
    x: 480,
    y: 254,
    status: 'open',
    category: 'Sanitation',
    citizen: 'Nanret D.',
    excerpt: 'Terminus market drainage overflowing again.',
  },
  {
    id: 'fct-01',
    lga: 'AMAC',
    state: 'FCT',
    x: 400,
    y: 300,
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
    x: 232,
    y: 408,
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
    x: 190,
    y: 470,
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
    x: 220,
    y: 512,
    status: 'open',
    category: 'Roads',
    citizen: 'Kelechi O.',
    excerpt: 'Ajah–Sangotedo axis: pothole crater blocking one lane.',
  },
  {
    id: 'bn-02',
    lga: 'Oredo',
    state: 'Edo',
    x: 288,
    y: 448,
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
    x: 368,
    y: 400,
    status: 'open',
    category: 'Health',
    citizen: 'Ngozi M.',
    excerpt: 'Abakpa PHC delivery room without power for 2 weeks.',
  },
  {
    id: 'nnw-01',
    lga: 'Nnewi North',
    state: 'Anambra',
    x: 328,
    y: 444,
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
    x: 348,
    y: 510,
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
    x: 476,
    y: 510,
    status: 'open',
    category: 'Housing',
    citizen: 'Etim B.',
    excerpt: 'Marian flood-prone estate needs surveyed drainage plan.',
  },
];

const NIGERIA_PATH =
  'M 130 200 Q 140 140 220 118 Q 340 96 500 92 Q 640 100 720 150 Q 754 220 742 300 Q 722 400 662 456 Q 580 510 460 520 Q 340 512 240 494 Q 158 462 128 380 Q 98 300 110 240 Z';

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
  variant?: 'hero' | 'rail';
  onPinClick?: (pin: Pin) => void;
  activeId?: string | null;
  className?: string;
};

export function NigeriaMap({ variant = 'hero', onPinClick, activeId, className }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [autoId, setAutoId] = useState<string>(PINS[0].id);

  useEffect(() => {
    if (variant !== 'hero') return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % PINS.length;
      setAutoId(PINS[i].id);
    }, 4000);
    return () => clearInterval(t);
  }, [variant]);

  const activePin =
    PINS.find((p) => p.id === (hoverId ?? activeId ?? (variant === 'hero' ? autoId : null))) ??
    null;

  const isRail = variant === 'rail';

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
        <path d={NIGERIA_PATH} fill="url(#nmapFill)" stroke="var(--foreground)" strokeWidth="1.5" />
        <path d={NIGERIA_PATH} fill="url(#nmapGrain)" opacity="0.5" />

        <g stroke="var(--hairline)" strokeWidth="0.6" opacity="0.55" fill="none">
          <path d="M 180 220 Q 400 280 700 240" />
          <path d="M 150 340 Q 380 360 690 320" />
          <path d="M 220 440 Q 400 460 640 440" />
          <path d="M 380 100 L 380 510" strokeDasharray="2 6" />
          <path d="M 540 110 L 540 500" strokeDasharray="2 6" />
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
            <span>
              <span className="text-foreground font-bold text-sm normal-case tabular-nums">1,284</span>{' '}
              cases today
            </span>
            <span>
              <span className="text-primary font-bold text-sm normal-case tabular-nums">402</span>{' '}
              official replies
            </span>
            <span>
              <span className="text-accent-foreground font-bold text-sm normal-case tabular-nums">37</span>{' '}
              LGAs active
            </span>
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
