import Icon from '../common/Icon';

export default function CivicFeedCard() {
  return (
    <div className="group relative w-full max-w-md">
      <div
        className="absolute -left-6 -top-6 z-20 md:-left-10"
        style={{ animationDelay: '0.9s' }}
      >
        <div className="float-a origin-center rounded-2xl border border-[var(--civic-border)] bg-[var(--civic-surface)] px-4 py-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.2)] transition-transform duration-300 hover:scale-105 hover:rotate-[-8deg]">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--civic-primary)] text-[var(--civic-primary-contrast)]">
              <Icon name="arrow_upward" className="animate-tick text-[16px]" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none text-[var(--civic-text)]">+128</p>
              <p className="text-[9px] uppercase tracking-wider text-[var(--civic-muted)]">this hour</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -right-4 top-16 z-20 md:-right-8"
        style={{ animationDelay: '1.05s' }}
      >
        <div className="float-b flex items-center gap-1.5 rounded-full bg-[var(--civic-gold)] px-3 py-1.5 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-110 hover:rotate-[12deg]">
          <Icon name="check_circle" className="text-[14px] text-[var(--civic-text)]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--civic-text)]">
            Gov. Verified
          </span>
        </div>
      </div>

      <div
        className="absolute -bottom-4 -right-6 z-20 md:-right-10"
        style={{ animationDelay: '1.2s' }}
      >
        <div className="float-c rounded-xl border border-[var(--civic-border)] bg-[var(--civic-surface)] px-3 py-2 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.2)] transition-transform duration-300 hover:scale-105 hover:rotate-[2deg]">
          <div className="flex items-center gap-1.5">
            <Icon name="trending_up" className="text-[14px] text-[var(--civic-primary)]" />
            <span className="text-[11px] font-semibold text-[var(--civic-text)]">#WaterForUmudim</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute -bottom-6 left-6 right-6 h-24 rotate-2 rounded-2xl border border-[var(--civic-border)] bg-[color-mix(in_srgb,var(--civic-surface)_70%,transparent)] shadow-sm transition-transform duration-500 group-hover:rotate-3 group-hover:translate-y-1"
          aria-hidden
        />

        <div className="feed-card relative rounded-2xl border border-[var(--civic-border)] bg-[var(--civic-surface)] shadow-[0_30px_60px_-30px_rgba(15,81,50,0.35),0_10px_30px_-15px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between border-b border-[var(--civic-border)] px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-live absolute inline-flex size-full rounded-full bg-[var(--civic-gold)] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--civic-gold)]" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--civic-muted)]">
                Live - Nnewi North LGA
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--civic-muted)]">Ward 4</span>
          </div>

          <div className="px-5 pb-4 pt-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--civic-primary-glow)] text-xs font-semibold text-[var(--civic-primary)]">
                CN
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-[var(--civic-muted)]">
                  <span className="font-medium text-[var(--civic-text)]">Chinelo N.</span>
                  <span>- 2h - Citizen</span>
                </div>
                <p className="mt-1.5 text-[15px] leading-snug text-[var(--civic-text)]">
                  The borehole in <span className="font-medium">Umudim</span> has been dry for 3 weeks.
                  Kids walk 40 minutes for water. Please help.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-[var(--civic-muted)]">
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--civic-primary)]">
                    <Icon name="arrow_upward" className="text-[14px]" /> 412
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="chat_bubble" className="text-[14px]" /> 38
                  </span>
                  <span className="ml-auto rounded-full bg-[rgba(212,165,64,0.25)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--civic-text)]">
                    Sent to LGA Chair
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[rgba(10,106,59,0.18)] bg-[rgba(10,106,59,0.06)] p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-primary)]">
                <Icon name="check_circle" className="text-[14px]" />
                Verified Official
              </div>
              <p className="mt-1.5 text-sm font-medium text-[var(--civic-text)]">
                Hon. A. Okeke <span className="font-normal text-[var(--civic-muted)]">- LGA Chairman</span>
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-[var(--civic-text)]">
                Repair team is on site today. I&apos;ll post a photo update on Friday.
              </p>
            </div>
          </div>

          <div className="border-t border-[var(--civic-border)] px-5 py-4 opacity-70">
            <div className="flex items-center gap-2 text-xs text-[var(--civic-muted)]">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--civic-primary-glow)] text-xs font-semibold text-[var(--civic-primary)]">
                IO
              </div>
              <span className="font-medium text-[var(--civic-text)]">Ifeanyi O.</span>
              <span>- Streetlights on Market Road...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
