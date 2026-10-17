import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function ResolutionStory() {
  return (
    <section id="resolution" className="relative border-t border-[#132033]/10 bg-[#f7faf8]">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 flex justify-center md:order-1 md:justify-start"
          >
            <img
              src="/illustrations/greet.svg"
              alt="A resident whose reported issue was resolved"
              loading="lazy"
              decoding="async"
              className="h-auto w-44 sm:w-56 md:w-64 lg:w-72"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="order-1 md:order-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0a6a3b]">
              Someone answered, by name
            </p>
            <h2 className="font-display mt-3 text-3xl leading-tight tracking-[-0.01em] text-[#132033] md:text-4xl">
              Fixed, in public.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#132033]/75">
              The pothole from Day 31 was fixed in 12 days. The road is smooth. The record
              stays.
            </p>

            <div className="mt-6 w-full max-w-xs rounded-2xl border border-[#132033]/12 bg-white p-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#132033]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#132033]/60">
                Example
              </span>
              <p className="font-display mt-3 text-4xl leading-none text-[#0a6a3b]">12 days</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#132033]/55">
                Report to fixed
              </p>
              <span
                aria-hidden
                className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-[#132033]/10"
              >
                <span className="block h-full w-full rounded-full bg-gradient-to-r from-[#0a6a3b] to-[#d4a540]" />
              </span>
              <p className="mt-3 text-[12px] leading-relaxed text-[#132033]/60">
                An example of what a resolved report looks like. Not a real record.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="cta-base cta-primary group inline-flex items-center justify-center gap-2 rounded-full bg-[#0a6a3b] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(15,81,50,0.6)]"
              >
                <span className="relative z-[2]">Report an issue</span>
                <ArrowRight className="relative z-[2] h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-[13px] font-semibold text-[#132033]/70">Your street is next.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
