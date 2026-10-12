import { motion } from 'framer-motion';
import { MessageSquarePlus, Route as RouteIcon, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: MessageSquarePlus,
    tag: 'Post',
    title: 'File the case',
    body: "Say what's wrong. Pin the region. Add a photo or a quick poll.",
  },
  {
    icon: RouteIcon,
    tag: 'Route',
    title: 'It finds the right desk',
    body: 'Your case escalates up the ladder — Ward → LGA → State → Federal — as it gains signal.',
  },
  {
    icon: ShieldCheck,
    tag: 'Answer',
    title: 'A verified official replies',
    body: 'Their name, their office, on the record. Silence is visible too.',
  },
];

export function HowItMoves() {
  return (
    <section id="how" className="relative border-y border-hairline/60 bg-paper/60">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
              How it moves
            </p>
            <h2 className="font-display mt-2 text-3xl leading-tight text-foreground md:text-4xl">
              Three steps. No middlemen.
            </h2>
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
                className="group relative overflow-hidden rounded-2xl border border-hairline/70 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(15,81,50,0.35)]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    Step {i + 1} · {s.tag}
                  </span>
                  <Icon className="h-5 w-5 text-foreground/40 transition-colors group-hover:text-primary" />
                </div>
                <h3 className="font-display mt-4 text-2xl leading-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.body}</p>
                <div className="mt-6 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
