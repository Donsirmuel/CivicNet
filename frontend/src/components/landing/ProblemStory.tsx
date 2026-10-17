import { motion } from 'framer-motion';
import { PotholeRoad } from './PotholeRoad';

const TOPICS = ['School roof', 'Dark streets', 'Uncleared waste', 'Clinic queue'];

export function ProblemStory() {
  return (
    <section id="problem" className="relative">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0a6a3b]">
              Day 31
            </p>
            <h2 className="font-display mt-3 text-3xl leading-tight tracking-[-0.01em] text-[#132033] md:text-4xl">
              Same pothole. Third rainy season.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#132033]/75">
              You step around it every morning. So does everyone else. Nobody knows who is
              supposed to fix it.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <li
                  key={topic}
                  className="inline-flex items-center gap-2 rounded-full border border-[#132033]/15 bg-white px-3 py-1.5 text-[12px] font-medium text-[#132033]/80"
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#d4a540]" />
                  {topic}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center md:justify-end"
          >
            <div className="relative">
              <PotholeRoad className="pointer-events-none absolute -bottom-5 -left-8 w-32 sm:-left-16 sm:w-44 md:-left-24 md:w-56" />
              <img
                src="/illustrations/inspect.svg"
                alt="A resident crouching to point at a pothole in the road"
                loading="lazy"
                decoding="async"
                className="relative h-auto w-44 sm:w-56 md:w-64 lg:w-72"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
