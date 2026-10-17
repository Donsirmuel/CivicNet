import { motion } from 'framer-motion';

const LEVELS = [
  {
    name: 'Ward',
    note: 'The closest office. This is where your report starts.',
    fill: 'w-[30%]',
  },
  {
    name: 'LGA',
    note: 'Your local government area picks it up from there.',
    fill: 'w-[55%]',
  },
  {
    name: 'State',
    note: 'The state steps in if the report is still open.',
    fill: 'w-[78%]',
  },
  {
    name: 'Federal',
    note: 'The last stop for issues that affect the whole country.',
    fill: 'w-full',
  },
];

export function EscalationStory() {
  return (
    <section id="escalation" className="relative border-t border-[#132033]/10">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0a6a3b]">
                No answer?
              </p>
              <h2 className="font-display mt-3 text-3xl leading-tight tracking-[-0.01em] text-[#132033] md:text-4xl">
                It climbs.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#132033]/75">
                Ward, then LGA, then state, then federal. Every step is public, so silence has a
                name.
              </p>
            </motion.div>

            <div className="relative mt-8">
              <span
                aria-hidden
                className="absolute bottom-4 left-[19px] top-4 w-px bg-[#132033]/12"
              />
              <ol className="space-y-3">
                {LEVELS.map((level, i) => (
                  <motion.li
                    key={level.name}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="relative pl-12"
                  >
                    <span className="absolute left-[9px] top-3 flex h-5 w-5 items-center justify-center rounded-full border border-[#0a6a3b]/40 bg-[#fbf7f0] text-[10px] font-bold text-[#0a6a3b]">
                      {i + 1}
                    </span>
                    <div className="rounded-2xl border border-[#132033]/12 bg-white/70 px-4 py-3">
                      <p className="font-display text-base uppercase tracking-[0.14em] text-[#132033]">
                        {level.name}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#132033]/70">
                        {level.note}
                      </p>
                      <span
                        aria-hidden
                        className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-[#132033]/10"
                      >
                        <motion.span
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true, margin: '-60px' }}
                          transition={{
                            duration: 0.6,
                            delay: 0.15 + i * 0.1,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className={`block h-full origin-left rounded-full bg-gradient-to-r from-[#0a6a3b] to-[#d4a540] ${level.fill}`}
                        />
                      </span>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-4 pl-12 text-[13px] leading-relaxed text-[#132033]/60"
            >
              The climb is automatic. You do not have to chase anyone.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center md:justify-start"
          >
            <img
              src="/illustrations/walk-forward.svg"
              alt="A report moving up from ward to federal level"
              loading="lazy"
              decoding="async"
              className="h-auto w-44 sm:w-56 md:w-64 lg:w-72"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
