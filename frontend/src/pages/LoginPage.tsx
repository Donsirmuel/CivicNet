import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CivicGoogleButton from '../components/auth/CivicGoogleButton';
import { Button, Input, Logo, Icon } from '../components/common';
import { authService } from '../services';

const authStats = [
  { value: '774', label: 'LGAs covered' },
  { value: '36+1', label: 'States + FCT' },
  { value: 'Free', label: 'To use' },
];

const loginHeroImage =
  '/login-hero.webp';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/feed';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login({ username, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('We could not sign you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setError('');

    try {
      await authService.googleAuth(credential);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-5 py-5 text-[var(--civic-text)] sm:px-8 lg:px-10">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
      >
        ← Back to home
      </button>
      <div
        className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1400px] overflow-hidden rounded-md"
        style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow)' }}
      >
        <div className="hidden lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          <section
            className="civic-auth-hero relative flex flex-col justify-between overflow-hidden px-12 py-10"
            style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-surface-muted) 100%)' }}
          >
            <img
              src={loginHeroImage}
              alt="Civic city background"
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-25 blur-[2px]"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(10,106,59,0.16) 0%, rgba(22,33,51,0.08) 55%, rgba(22,33,51,0.14) 100%)' }}
            />
            <div className="absolute inset-0 bg-pattern opacity-30" />
            <div className="civic-auth-grid" />
            <div className="civic-auth-rings" />
            <div className="civic-auth-beam" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <Logo size="sm" linkTo={null} subtitle="Community First" />
                <div className="flex items-center gap-2 text-[var(--civic-muted)]">
                  <Icon name="location_on" className="text-[18px]" />
                  <Icon name="notifications" className="text-[18px]" />
                  <Icon name="account_circle" className="text-[18px]" />
                </div>
              </div>

              <div className="mt-24 max-w-2xl">
                <h1 className="font-display mt-6 text-6xl leading-[0.95] tracking-[-0.02em] text-[var(--civic-text-strong)]">
                  Pick up where your reports left off.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--civic-muted)]">
                  Sign in to follow your reports, see if an official has replied, and catch up on problems near you.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-16 grid grid-cols-3 gap-4">
              {authStats.map((item) => (
                <div key={item.label} className="rounded-md px-4 py-5" style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                  <p className="font-display text-4xl tracking-[-0.02em] text-[var(--civic-text)]">{item.value}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--civic-muted)]">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-8 max-w-[420px] self-end">
              <div className="civic-auth-float-card">
                <p className="civic-label">How it works</p>
                <p className="mt-3 text-base font-bold text-[var(--civic-text)]">
                  Your reports stay on your profile, and you get told when an official replies.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[var(--civic-primary)]">
                  <span className="size-2 rounded-full bg-[var(--civic-primary)]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Nothing goes silent</span>
                </div>
              </div>
            </div>
          </section>

          <section
            className="flex items-center justify-center px-10 py-10"
            style={{ background: 'var(--civic-surface-soft)' }}
          >
            <div className="w-full max-w-[430px]">
              <div
                className="rounded-md px-6 py-6"
                style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
              >
                <div className="grid grid-cols-2 gap-2 rounded-full p-1" style={{ background: 'var(--civic-surface-inset)' }}>
                  <Link
                    to="/register"
                    className="inline-flex min-h-11 items-center justify-center rounded-full text-sm font-semibold text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
                  >
                    Sign up
                  </Link>
                  <div className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--civic-primary)_0%,var(--civic-primary-deep)_100%)] text-sm font-semibold text-[var(--civic-primary-contrast)]">
                    Log in
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--civic-muted)]">
                    Log in to your account
                  </p>
                  <h2 className="font-display mt-3 text-3xl tracking-[-0.02em] text-[var(--civic-text)]">
                    Welcome back
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <Input
                    label="Username"
                    name="username"
                    icon="alternate_email"
                    placeholder="@yourname"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    icon="lock"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />

                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-[var(--civic-primary)] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {error && (
                    <div className="rounded-md bg-[rgba(218,92,78,0.1)] px-4 py-3 text-sm text-[var(--civic-danger)]">
                      {error}
                    </div>
                  )}

                  <Button type="submit" size="lg" fullWidth loading={loading} icon="arrow_forward">
                    Sign in
                  </Button>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1" style={{ background: 'var(--civic-border)' }} />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--civic-muted)]">
                        Or continue with
                      </span>
                      <div className="h-px flex-1" style={{ background: 'var(--civic-border)' }} />
                    </div>

                    <div className="flex justify-center">
                      <CivicGoogleButton
                        onCredential={handleGoogleCredential}
                        onError={setError}
                        label="Continue with Google"
                        variant="surface"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:hidden">
          <div className="px-5 py-8" style={{ background: 'var(--civic-surface-soft)' }}>
            <div className="flex justify-center">
              <Logo size="md" linkTo={null} subtitle="Community First" />
            </div>

            <div className="mt-5 overflow-hidden rounded-md" style={{ boxShadow: 'var(--civic-shadow-soft)' }}>
              <div className="relative h-24">
                <img
                  src={loginHeroImage}
                  alt="City update feed"
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, rgba(10,106,59,0.45) 0%, rgba(22,33,51,0.14) 65%, rgba(22,33,51,0.08) 100%)' }}
                />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90">
                  <span>Local updates</span>
                  <span>Live feed</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h1 className="font-display text-3xl leading-tight tracking-[-0.02em] text-[var(--civic-text)]">
                Pick up where your reports left off.
              </h1>
              <p className="text-sm leading-6 text-[var(--civic-muted)]">
                Sign in to follow your reports, see if an official has replied, and catch up on problems near you.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {authStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md px-3 py-3"
                    style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                  >
                    <p className="font-display text-xl tracking-[-0.02em] text-[var(--civic-text)]">{item.value}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--civic-muted)]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-md p-5" style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow-soft)' }}>
              <div className="grid grid-cols-2 gap-2 rounded-full p-1" style={{ background: 'var(--civic-surface-inset)' }}>
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center justify-center rounded-full text-sm font-semibold text-[var(--civic-muted)]"
                >
                  Sign up
                </Link>
                <div className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--civic-primary)_0%,var(--civic-primary-deep)_100%)] text-sm font-semibold text-[var(--civic-primary-contrast)]">
                  Log in
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <Input
                  label="Username"
                  name="username"
                  icon="alternate_email"
                  placeholder="@yourname"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  icon="lock"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />

                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-[var(--civic-primary)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div className="rounded-md bg-[rgba(218,92,78,0.1)] px-4 py-3 text-sm text-[var(--civic-danger)]">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" fullWidth loading={loading} icon="arrow_forward">
                  Sign In
                </Button>

                <div className="flex justify-center">
                  <CivicGoogleButton
                    onCredential={handleGoogleCredential}
                    onError={setError}
                    label="Continue with Google"
                    variant="elevated"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
