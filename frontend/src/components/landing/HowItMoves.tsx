import { motion } from 'framer-motion';
import { MessageSquarePlus, Route as RouteIcon, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: MessageSquarePlus,
    tag: 'Report',
    title: 'Say what is wrong',
    body: 'Describe the problem and mark where it is. Add a photo if you have one.',
    figure: '/illustrations/point-ground.svg',
  },
  {
    icon: RouteIcon,
    tag: 'Route',
    title: 'It moves to the right office',
    body: 'Your report climbs from your ward to your LGA — your local government area — then the state, then federal level if it is still not fixed. Every step shows on the report.',
    figure: '/illustrations/stride.svg',
  },
  {
    icon: ShieldCheck,
    tag: 'Answer',
    title: 'An official answers on the record',
    body: 'Someone from the responsible office replies with their name and office attached. If nobody replies, you can see that too.',
    figure: '/illustrations/official.svg',
  },
];

export function HowItMoves() {
  return (
    <section id="how" className="landing-deep relative border-y border-black/20">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d4a540]">
              How it moves
            </p>
            <h2 className="font-display mt-2 text-3xl leading-tight text-[#f7faf8] md:text-4xl">
              Three steps. No middlemen.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#f7faf8]/75">
              From citizen report to verified answer — every step stays visible.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.tag}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#d4a540]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d4a540]">
                    Step {i + 1} · {s.tag}
                  </span>
                  <img src={s.figure} alt="" className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-[#f7faf8]/50 transition-colors group-hover:text-[#d4a540]" />
                  <h3 className="font-display text-2xl leading-tight text-[#f7faf8]">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#f7faf8]/75">{s.body}</p>
                <div className="mt-6 h-px w-full origin-left scale-x-0 bg-[#d4a540] transition-transform duration-500 group-hover:scale-x-100" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
