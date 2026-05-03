import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CivicGoogleButton from '../components/auth/CivicGoogleButton';
import { Button, Input, Logo, Icon } from '../components/common';
import { authService } from '../services';

const accessHighlights = [
  'Join local conversations',
  'Post updates and reports',
  'Follow official replies',
];

const registerHeroImage =
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1600&h=900&fit=crop';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: firstName,
        last_name: lastName,
      });

      navigate('/feed');
    } catch (err) {
      console.error('Registration error:', err);
      const message =
        err instanceof Error ? err.message : 'We could not create your account. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    try {
      setLoading(true);
      setError('');
      await authService.googleAuth(credential);
      navigate('/feed');
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-5 py-5 text-[var(--civic-text)] sm:px-8 lg:px-10">
      <div
        className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1400px] overflow-hidden rounded-md"
        style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow)' }}
      >
        <div className="hidden lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <section
            className="civic-auth-hero relative flex flex-col justify-between overflow-hidden px-12 py-10"
            style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-surface-muted) 100%)' }}
          >
            <img
              src={registerHeroImage}
              alt="Community background"
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-25 blur-[2px]"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(10,106,59,0.18) 0%, rgba(22,33,51,0.08) 55%, rgba(22,33,51,0.14) 100%)' }}
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
                <span className="civic-chip-active">Create your account</span>
                <h1 className="mt-6 text-6xl font-black leading-[0.95] tracking-[-0.06em] text-[var(--civic-text-strong)]">
                  Speak up, share updates, and follow what matters in your area.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--civic-muted)]">
                  Create your CivicNet account to post, report issues, and stay close to the conversations shaping your community.
                </p>
              </div>
            </div>

            <div className="relative z-10 grid gap-3">
              {accessHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md px-4 py-4"
                  style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-[var(--civic-primary-glow)] text-[var(--civic-primary)]">
                    <Icon name="check" className="text-[16px]" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--civic-text)]">{item}</p>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-8 max-w-[420px] self-end">
              <div className="civic-auth-float-card">
                <p className="civic-label">What you can do</p>
                <p className="mt-3 text-base font-bold text-[var(--civic-text)]">
                  Share updates, send reports, and keep track of replies without losing the bigger picture.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[var(--civic-primary)]">
                  <span className="size-2 rounded-full bg-[var(--civic-primary)]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Ready to join</span>
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
                  <div className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--civic-primary)_0%,var(--civic-primary-deep)_100%)] text-sm font-semibold text-[var(--civic-primary-contrast)]">
                    Create Account
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex min-h-11 items-center justify-center rounded-full text-sm font-semibold text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
                  >
                    Login
                  </Link>
                </div>

                <div className="mt-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--civic-muted)]">
                    Join CivicNet
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--civic-text)]">
                    Create your account
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <Input
                    label="Full Name"
                    type="text"
                    name="fullName"
                    placeholder="Amina Yusuf Okonjo"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Username"
                    type="text"
                    name="username"
                    placeholder="@yourname"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />

                  {error && (
                    <div className="rounded-md bg-[rgba(218,92,78,0.1)] px-4 py-3 text-sm text-[var(--civic-danger)]">
                      {error}
                    </div>
                  )}

                  <Button type="submit" size="lg" fullWidth loading={loading} icon="arrow_forward">
                    Create Account
                  </Button>

                  <button
                    type="button"
                    className="civic-ghost-button w-full justify-center gap-2 !min-h-12 !rounded-md"
                  >
                    <Icon name="verified_user" className="text-[16px]" />
                    Verify as official
                  </button>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1" style={{ background: 'var(--civic-border)' }} />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--civic-muted)]">
                        Continue with
                      </span>
                      <div className="h-px flex-1" style={{ background: 'var(--civic-border)' }} />
                    </div>

                    <div className="flex justify-center">
                      <CivicGoogleButton
                        onCredential={handleGoogleCredential}
                        onError={setError}
                        label="Sign up with Google"
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
                  src={registerHeroImage}
                  alt="Community conversations"
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(90deg, rgba(10,106,59,0.48) 0%, rgba(22,33,51,0.2) 66%, rgba(22,33,51,0.08) 100%)' }}
                />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90">
                  <span>Join CivicNet</span>
                  <span>Get started</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <span className="civic-chip-active">Create your account</span>
              <h1 className="text-3xl font-black leading-tight tracking-[-0.04em] text-[var(--civic-text)]">
                Report issues, share updates, and follow progress in your area.
              </h1>
              <p className="text-sm leading-6 text-[var(--civic-muted)]">
                Join CivicNet to participate in local conversations and keep up with official responses.
              </p>

              <div className="space-y-2">
                {accessHighlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-md px-3 py-3"
                    style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                  >
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--civic-primary-glow)] text-[var(--civic-primary)]">
                      <Icon name="check" className="text-[14px]" />
                    </span>
                    <p className="text-sm font-semibold text-[var(--civic-text)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-md p-5" style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow-soft)' }}>
              <div className="grid grid-cols-2 gap-2 rounded-full p-1" style={{ background: 'var(--civic-surface-inset)' }}>
                <div className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--civic-primary)_0%,var(--civic-primary-deep)_100%)] text-sm font-semibold text-[var(--civic-primary-contrast)]">
                  Create Account
                </div>
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center justify-center rounded-full text-sm font-semibold text-[var(--civic-muted)]"
                >
                  Login
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <Input
                  label="Full Name"
                  type="text"
                  name="fullName"
                  placeholder="Amina Yusuf Okonjo"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Username"
                  type="text"
                  name="username"
                  placeholder="@yourname"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                {error && (
                  <div className="rounded-md bg-[rgba(218,92,78,0.1)] px-4 py-3 text-sm text-[var(--civic-danger)]">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" fullWidth loading={loading} icon="arrow_forward">
                  Create Account
                </Button>

                <div className="flex justify-center">
                  <CivicGoogleButton
                    onCredential={handleGoogleCredential}
                    onError={setError}
                    label="Sign up with Google"
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
