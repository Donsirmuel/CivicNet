import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { NigeriaMap } from './NigeriaMap';

const rise = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function MapHero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_75%_35%,color-mix(in_oklab,var(--accent)_25%,transparent),transparent_70%)]"
      />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-6 py-14 md:px-10 md:py-20 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-14 lg:py-24">
        <div className="relative">
          <motion.p
            {...rise}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary"
          >
            <span className="mr-2 text-accent">✦</span>
            Live civic map
          </motion.p>

          <motion.h1
            {...rise}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="font-display mt-5 text-[44px] leading-[1.02] tracking-[-0.02em] text-foreground sm:text-[56px] lg:text-[64px]"
          >
            Every voice has a{' '}
            <span className="hand-underline italic text-primary">constituency</span>
            <span className="text-accent">.</span>
          </motion.h1>

          <motion.p
            {...rise}
            transition={{ duration: 0.7, delay: 0.22, ease: 'easeOut' }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-foreground/75"
          >
            CivicNet plots grievances and official replies onto a live map of Nigeria — from your
            ward to Aso Rock. Nothing goes silent.
          </motion.p>

          <motion.div
            {...rise}
            transition={{ duration: 0.7, delay: 0.34, ease: 'easeOut' }}
            className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <Link
              to="/register"
              className="cta-base cta-primary inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_rgba(15,81,50,0.6)]"
            >
              <span className="relative z-[2]">Sign up as a citizen</span>
            </Link>
            <Link
              to="/register"
              className="cta-base cta-ghost inline-flex items-center justify-center gap-2 rounded-full border border-foreground/25 bg-transparent px-5 py-3 text-sm font-semibold text-foreground"
            >
              <CheckCircle2 className="relative z-[2] h-4 w-4" />
              <span className="relative z-[2]">I&apos;m an official</span>
            </Link>
          </motion.div>

          <motion.div
            {...rise}
            transition={{ duration: 0.7, delay: 0.46, ease: 'easeOut' }}
            className="mt-8 flex items-center gap-4 border-t border-hairline/60 pt-5"
          >
            <Stat value="774" label="LGAs mapped" />
            <span className="h-8 w-px bg-hairline/70" />
            <Stat value="36+1" label="States + FCT" />
            <span className="h-8 w-px bg-hairline/70" />
            <Stat value="Free" label="Forever" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="group relative"
        >
          <div className="feed-card relative overflow-hidden rounded-3xl border border-hairline/70 bg-card/60 p-3 shadow-[0_40px_90px_-40px_rgba(15,81,50,0.35)] sm:p-5">
            <NigeriaMap variant="hero" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl leading-none text-foreground">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-foreground/55">{label}</p>
    </div>
  );
}
