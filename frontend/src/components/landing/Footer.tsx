import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="landing-deep border-t border-black/20">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/15 pb-6">
          <p className="font-display flex items-center gap-3 text-2xl text-[#f7faf8]">
            <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a540]/20">
              <img src="/illustrations/stride.svg" alt="" className="h-8 w-8" />
            </span>
            Civic<span className="-ml-3 italic text-[#d4a540]">Net</span>
            <span className="text-[#d4a540]">.</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#f7faf8]/60">
            A civic network — nothing goes silent
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f7faf8]/55">
              Product
            </p>
            <ul className="mt-3 space-y-2 text-[#f7faf8]/85">
              <li><a href="#how" className="hover:text-[#d4a540]">How it works</a></li>
              <li><Link to="/register" className="hover:text-[#d4a540]">Sign up</Link></li>
              <li><Link to="/login" className="hover:text-[#d4a540]">Log in</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f7faf8]/55">
              About
            </p>
            <ul className="mt-3 space-y-2 text-[#f7faf8]/85">
              <li>
                <a
                  href="https://github.com/Donsirmuel/CivicNet"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#d4a540]"
                >
                  GitHub
                </a>
              </li>
              <li><a href="#" className="hover:text-[#d4a540]">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f7faf8]/55">
              Legal
            </p>
            <ul className="mt-3 space-y-2 text-[#f7faf8]/85">
              <li><a href="#" className="hover:text-[#d4a540]">Privacy</a></li>
              <li><a href="#" className="hover:text-[#d4a540]">Terms</a></li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/15 pt-6 text-xs text-[#f7faf8]/55">
          © 2026 CivicNet. Nothing goes silent.
        </p>
      </div>
    </footer>
  );
}
