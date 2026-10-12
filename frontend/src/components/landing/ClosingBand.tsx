import { Link } from 'react-router-dom';

export function ClosingBand() {
  return (
    <section id="join" className="relative bg-accent">
      <div className="mx-auto max-w-[1400px] px-6 py-24 text-center md:px-10 md:py-32">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-foreground/70">
          Join CivicNet
        </p>
        <h2 className="font-display mt-6 text-5xl leading-[0.95] tracking-[-0.02em] text-foreground sm:text-6xl md:text-8xl">
          The square is open.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base text-foreground/75">
          Bring your issue. Bring your idea. The people who represent you are here too.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="cta-base cta-primary inline-flex items-center justify-center rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-[0_15px_40px_-12px_rgba(15,81,50,0.5)]"
          >
            <span className="relative z-[2]">Sign Up</span>
          </Link>
          <Link
            to="/login"
            className="cta-base cta-ghost inline-flex items-center justify-center rounded-full border border-foreground/25 px-7 py-4 text-sm font-semibold text-foreground"
          >
            <span className="relative z-[2]">Log in</span>
          </Link>
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-foreground/60">
          Free <span className="mx-2">·</span> Public <span className="mx-2">·</span> Yours
        </p>
      </div>
    </section>
  );
}
