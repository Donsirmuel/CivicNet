import { Link } from 'react-router-dom';

export function ClosingBand() {
  return (
    <section id="join" className="landing-gold relative">
      <div className="mx-auto max-w-[1400px] px-6 py-20 text-center md:px-10 md:py-28">
        <div aria-hidden className="float-b mx-auto flex w-fit items-end justify-center gap-2 sm:gap-3">
          <img src="/illustrations/market-basket.svg" alt="" className="h-auto w-20 sm:w-28" />
          <img src="/illustrations/walk-forward.svg" alt="" className="h-auto w-20 sm:w-28" />
          <img src="/illustrations/citizen-phone.svg" alt="" className="h-auto w-20 sm:w-28" />
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.32em] text-[#132033]/70">
          Join CivicNet
        </p>
        <h2 className="font-display mt-5 text-5xl leading-[0.95] tracking-[-0.02em] text-[#132033] sm:text-6xl md:text-8xl">
          The square is open.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#132033]/85">
          Bring your issue. Bring your idea. The people who represent you are here too.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="cta-base cta-primary inline-flex items-center justify-center rounded-full bg-[#0a6a3b] px-7 py-4 text-sm font-semibold text-white shadow-[0_15px_40px_-12px_rgba(14,42,29,0.5)]"
          >
            <span className="relative z-[2]">Sign up free</span>
          </Link>
          <Link
            to="/login"
            className="cta-base cta-ghost inline-flex items-center justify-center rounded-full border border-[#132033]/30 px-7 py-4 text-sm font-semibold text-[#132033]"
          >
            <span className="relative z-[2]">Log in</span>
          </Link>
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#132033]/70">
          Free <span className="mx-2">·</span> Public <span className="mx-2">·</span> Yours
        </p>
      </div>
    </section>
  );
}
