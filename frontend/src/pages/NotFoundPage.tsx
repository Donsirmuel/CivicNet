import { useNavigate } from 'react-router-dom';
import { Button, Logo } from '../components/common';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}
    >
      <div className="civic-auth-hero w-full max-w-3xl overflow-hidden rounded-md px-8 py-12 text-center shadow-[var(--civic-shadow)]">
        <div className="civic-auth-grid" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <Logo size="sm" linkTo="/" subtitle="Community First" />
          <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--civic-muted)]">
            Error 404
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] text-[var(--civic-text-strong)] sm:text-6xl">
            This page could not be found.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--civic-muted)]">
            The link may be broken, or the page may have moved. You can head back to the main feed
            or return to the sign-in page.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="primary" size="lg" onClick={() => navigate('/feed')}>
              Go to feed
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/')}>
              Back to start
            </Button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 text-sm font-semibold text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

