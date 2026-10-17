import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { NigeriaMap, PINS } from './NigeriaMap';
import { IllustrationWrap } from '../illustrations';

const rise = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const DOT: Record<string, string> = {
  open: 'bg-[#132033]',
  in_progress: 'bg-[#d4a540]',
  resolved: 'bg-[#0a6a3b]',
};

export function MapHero() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => (v + 1) % PINS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const live = PINS[tick];

  return (
    <section id="top" className="relative overflow-hidden">
      {/* watermark map, middle of hero, low opacity for readability */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-start justify-center">
        <div className="h-[560px] w-[min(1020px,130vw)] sm:h-[640px] lg:h-[720px]">
          <NigeriaMap variant="backdrop" />
        </div>
      </div>
      {/* readability veil: solid paper behind text, fading to reveal map edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_62%_at_50%_40%,rgba(251,247,240,0.95)_0%,rgba(251,247,240,0.82)_45%,rgba(251,247,240,0.30)_70%,transparent_88%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(212,165,64,0.20),transparent_70%)]"
      />

      {/* side illustrations — what CivicNet stands for */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden w-[240px] lg:block xl:w-[300px]">
        <IllustrationWrap className="absolute left-6 top-24 w-32 xl:left-12 xl:w-40" float="a" label="Citizen reporting an issue">
          <img src="/illustrations/citizen-phone.svg" alt="" className="h-auto w-full drop-shadow-[0_16px_24px_rgba(14,42,29,0.20)]" />
        </IllustrationWrap>
        <span className="absolute left-6 top-[19rem] inline-flex items-center gap-1.5 rounded-full border border-[#132033]/15 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#132033]/75 backdrop-blur xl:left-12">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0a6a3b]" /> Citizen report
        </span>
        <IllustrationWrap className="absolute bottom-24 left-10 w-24 xl:left-16 xl:w-28" float="c" label="Escalation ladder">
          <img src="/illustrations/raise-hand.svg" alt="" className="h-auto w-full opacity-90 drop-shadow-[0_12px_20px_rgba(14,42,29,0.16)]" />
        </IllustrationWrap>
        <span className="absolute bottom-[4.2rem] left-10 inline-flex items-center gap-1.5 rounded-full border border-[#132033]/15 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#132033]/75 backdrop-blur xl:left-16">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4a540]" /> Ward → Federal
        </span>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-[240px] lg:block xl:w-[300px]">
        <IllustrationWrap className="absolute right-6 top-20 w-32 xl:right-12 xl:w-40" float="b" label="Verified official reply">
          <img src="/illustrations/official.svg" alt="" className="h-auto w-full drop-shadow-[0_16px_24px_rgba(14,42,29,0.20)]" />
        </IllustrationWrap>
        <span className="absolute right-6 top-[18.2rem] inline-flex items-center gap-1.5 rounded-full border border-[#132033]/15 bg-white/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#132033]/75 backdrop-blur xl:right-12">
          <CheckCircle2 className="h-3 w-3 text-[#0a6a3b]" /> Verified reply
        </span>
        <div className="absolute bottom-28 right-8 w-44 rounded-2xl border border-[#132033]/12 bg-white/90 p-3 shadow-[0_18px_40px_-20px_rgba(14,42,29,0.35)] backdrop-blur xl:right-14">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#0a6a3b]">Example · Day 12 · no reply</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#132033]/10">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#0a6a3b] to-[#d4a540]" />
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-snug text-[#132033]/80">
            Silence is visible too.
          </p>
        </div>
      </div>

      {/* centered copy */}
      <div className="relative z-[3] mx-auto max-w-3xl px-6 pb-14 pt-14 text-center md:pt-20 lg:pb-20">

        <motion.h1
          {...rise}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="font-display mt-6 text-[44px] leading-[1.02] tracking-[-0.02em] text-[#132033] sm:text-[60px] lg:text-[76px]"
        >
          Every voice has a{' '}
          <span className="hand-underline italic text-[#0a6a3b]">constituency</span>
          <span className="text-[#d4a540]">.</span>
        </motion.h1>

        <motion.p
          {...rise}
          transition={{ duration: 0.7, delay: 0.22, ease: 'easeOut' }}
          className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[#132033]/80"
        >
          See a problem? Report it and watch it land on a live map of Nigeria. Your ward, your
          LGA, the state — the office responsible for it is named on the report. Nothing goes silent.
        </motion.p>

        <motion.div
          {...rise}
          transition={{ duration: 0.7, delay: 0.34, ease: 'easeOut' }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/register"
            className="cta-base cta-primary group inline-flex items-center justify-center gap-2 rounded-full bg-[#0a6a3b] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(15,81,50,0.6)]"
          >
            <span className="relative z-[2]">Report an issue</span>
            <ArrowRight className="relative z-[2] h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/register"
            className="cta-base cta-ghost inline-flex items-center justify-center gap-2 rounded-full border border-[#132033]/25 bg-white/70 px-6 py-3.5 text-sm font-semibold text-[#132033] backdrop-blur"
          >
            <CheckCircle2 className="relative z-[2] h-4 w-4" />
            <span className="relative z-[2]">I&apos;m an official</span>
          </Link>
        </motion.div>

        {/* mobile illustrations */}
        <div className="mt-8 flex items-center justify-center gap-8 lg:hidden">
          <img src="/illustrations/citizen-phone.svg" alt="" className="float-a h-20 w-20" />
          <img src="/illustrations/official.svg" alt="" className="float-b h-20 w-20" />
        </div>

        {/* live hotspot ticker */}
        <div className="mx-auto mt-8 flex min-h-[44px] max-w-xl items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={live.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="inline-flex max-w-full items-center gap-2 truncate rounded-full border border-[#132033]/12 bg-white/85 px-4 py-2 text-[13px] text-[#132033]/85 backdrop-blur"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[live.status]}`} />
              <span className="shrink-0 rounded-full bg-[#132033]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#132033]/60">
                Example
              </span>
              <span className="truncate">
                <strong className="font-semibold">{live.lga} · {live.category}</strong>
                <span className="text-[#132033]/65"> — “{live.excerpt}”</span>
              </span>
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div
          {...rise}
          transition={{ duration: 0.7, delay: 0.46, ease: 'easeOut' }}
          className="mx-auto mt-6 flex max-w-md items-center justify-center gap-5 border-t border-[#132033]/15 pt-5"
        >
          <Stat value="37" label="States" />
          <span className="h-8 w-px bg-[#132033]/15" />
          <Stat value="774" label="LGAs" />
          <span className="h-8 w-px bg-[#132033]/15" />
          <Stat value="Free" label="Forever" />
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl leading-none text-[#132033]">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#132033]/55">{label}</p>
    </div>
  );
}
