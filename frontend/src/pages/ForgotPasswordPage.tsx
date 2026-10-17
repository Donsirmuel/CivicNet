import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Logo } from '../components/common';
import { verificationService } from '../services/verification';

const textInputClass =
  'w-full rounded-xl border border-[var(--civic-border)] bg-white px-4 py-3 text-[15px] text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none transition focus:border-[var(--civic-primary)] focus:ring-2 focus:ring-[var(--civic-primary-glow)]';

const fieldLabelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--civic-muted)]';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showingConfirm = uid.trim() !== '' && token.trim() !== '';

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verificationService.requestPasswordReset(email.trim());
      setRequestSent(true);
    } catch {
      setError('We could not send the reset link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await verificationService.confirmPasswordReset({
        uid: uid.trim(),
        token: token.trim(),
        new_password: newPassword,
      });
      setResetDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
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
        className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1400px] items-center justify-center rounded-md px-4 py-10"
        style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow)' }}
      >
        <div className="w-full max-w-[480px]">
          <div className="flex justify-center">
            <Logo size="md" linkTo={null} subtitle="Community First" />
          </div>
          <div
            className="mt-6 rounded-md px-6 py-8"
            style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--civic-muted)]">
              Account recovery
            </p>
            <h1 className="font-display mt-3 text-3xl tracking-[-0.02em] text-[var(--civic-text)]">
              {resetDone ? 'Password updated' : showingConfirm ? 'Choose a new password' : 'Reset your password'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--civic-muted)]">
              {resetDone
                ? 'Your password has been changed. Sign in with your new password.'
                : showingConfirm
                  ? 'Enter a new password for your account.'
                  : 'Enter the email address for your account. If it exists, we will send a reset link.'}
            </p>

            {error && (
              <div className="mt-5 rounded-md bg-[rgba(218,92,78,0.1)] px-4 py-3 text-sm text-[var(--civic-danger)]">
                {error}
              </div>
            )}

            {resetDone ? (
              <div className="mt-6">
                <Button size="lg" fullWidth onClick={() => navigate('/login')} icon="arrow_forward">
                  Back to log in
                </Button>
              </div>
            ) : showingConfirm ? (
              <form onSubmit={handleConfirm} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="forgot-new-password" className={fieldLabelClass}>
                    New password
                  </label>
                  <input
                    id="forgot-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={textInputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="forgot-confirm-password" className={fieldLabelClass}>
                    Confirm new password
                  </label>
                  <input
                    id="forgot-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    className={textInputClass}
                    required
                  />
                </div>
                <Button type="submit" size="lg" fullWidth loading={loading} icon="lock_reset">
                  Set new password
                </Button>
              </form>
            ) : requestSent ? (
              <div className="mt-6 rounded-xl border border-[var(--civic-border)] bg-white px-4 py-4 text-sm leading-6 text-[var(--civic-muted)]">
                If an account exists for that email, a reset link is on its way. Check your inbox
                and follow the link to choose a new password.
              </div>
            ) : (
              <form onSubmit={handleRequest} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="forgot-email" className={fieldLabelClass}>
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={textInputClass}
                    required
                  />
                </div>
                <Button type="submit" size="lg" fullWidth loading={loading} icon="mail">
                  Send reset link
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm font-semibold text-[var(--civic-primary)] hover:underline"
              >
                Back to log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
