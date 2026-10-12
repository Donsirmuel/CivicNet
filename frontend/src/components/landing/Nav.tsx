import { Link } from 'react-router-dom';
import { authService } from '../../services/auth';

export function Nav() {
  const isAuthed = authService.isAuthenticated();

  return (
    <header className="relative z-10 border-b border-hairline/60">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 md:px-10">
        <a href="#top" className="font-display text-2xl leading-none tracking-tight md:text-[28px]">
          Civic<span className="italic text-primary">Net</span>
          <span className="text-accent">.</span>
        </a>
        <nav className="flex items-center gap-2 md:gap-6">
          <a
            href="#how"
            className="hidden text-sm text-foreground/70 transition-colors hover:text-foreground md:inline"
          >
            How it works
          </a>

          {isAuthed ? (
            <Link
              to="/feed"
              className="cta-pill inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Go to feed
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm text-foreground/70 transition-colors hover:text-foreground md:inline"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="cta-pill inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
