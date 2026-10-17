import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import { usersService } from '../services';

interface SettingsState {
  fullName: string;
  username: string;
  email: string;
  legislativeAlerts: boolean;
  constituencyUpdates: boolean;
  civicMentions: boolean;
  officialResponses: boolean;
  emailDigest: 'off' | 'daily' | 'weekly';
}

const defaultSettings: SettingsState = {
  fullName: '',
  username: '',
  email: '',
  legislativeAlerts: true,
  constituencyUpdates: false,
  civicMentions: true,
  officialResponses: true,
  emailDigest: 'daily',
};

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--civic-primary)] focus-visible:ring-offset-2 ${
        checked ? 'bg-[var(--civic-primary)]' : 'bg-[var(--civic-border-strong)]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const fieldLabelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--civic-muted)]';

const textInputClass =
  'w-full rounded-xl border border-[var(--civic-border)] bg-white px-4 py-3 text-[15px] text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none transition focus:border-[var(--civic-primary)] focus:ring-2 focus:ring-[var(--civic-primary-glow)]';

function readSavedSettings(): SettingsState {
  const stored = localStorage.getItem('settings_state');
  if (!stored) return defaultSettings;

  try {
    return { ...defaultSettings, ...JSON.parse(stored) } as SettingsState;
  } catch {
    return defaultSettings;
  }
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [savedState, setSavedState] = useState<SettingsState>(() => readSavedSettings());
  const [formData, setFormData] = useState<SettingsState>(() => readSavedSettings());
  const [accountLoading, setAccountLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    usersService
      .getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        const fullName =
          [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
          user.full_name ||
          user.name ||
          '';
        const patch = {
          fullName,
          username: user.username || '',
          email: user.email || '',
        };
        setFormData((current) => ({
          ...current,
          fullName: current.fullName || patch.fullName,
          username: current.username || patch.username,
          email: current.email || patch.email,
        }));
        setSavedState((current) => ({
          ...current,
          fullName: current.fullName || patch.fullName,
          username: current.username || patch.username,
          email: current.email || patch.email,
        }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAccountLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('settings_state', JSON.stringify(formData));
    setSavedState({ ...formData });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const handleReset = () => {
    setFormData(savedState);
  };

  const alertRows = [
    {
      key: 'officialResponses' as const,
      title: 'Official replies',
      description: 'Replies and progress updates from verified offices.',
    },
    {
      key: 'civicMentions' as const,
      title: 'Mentions',
      description: 'When someone mentions you in a post or comment.',
    },
    {
      key: 'legislativeAlerts' as const,
      title: 'Policy alerts',
      description: 'Updates on bills and public discussions.',
    },
    {
      key: 'constituencyUpdates' as const,
      title: 'Local updates',
      description: 'News from your local representative.',
    },
  ];

  return (
    <StandardLayout showLeftSidebar={false} showRightSidebar={false}>
      <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1100px]">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-4xl tracking-[-0.02em] text-[var(--civic-text)]">
                Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--civic-muted)]">
                Manage your account, privacy, alerts, and display preferences.
              </p>
            </div>
            {saved && (
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[var(--civic-primary)]"
                style={{ background: 'var(--civic-primary-glow)' }}
              >
                <Icon name="check_circle" className="text-lg" />
                Saved
              </div>
            )}
          </header>

          {/* Account */}
          <section className="grid grid-cols-1 gap-6 border-b border-[var(--civic-border)] py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10">
            <div>
              <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--civic-text)]">
                Account
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                The details shown on your reports and comments.
              </p>
            </div>
            <div className="space-y-5">
              <div>
                <label htmlFor="settings-full-name" className={fieldLabelClass}>
                  Full name
                </label>
                <input
                  id="settings-full-name"
                  type="text"
                  value={accountLoading && !formData.fullName ? 'Loading...' : formData.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  className={textInputClass}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="settings-username" className={fieldLabelClass}>
                  Username
                </label>
                <input
                  id="settings-username"
                  type="text"
                  value={accountLoading && !formData.username ? 'Loading...' : formData.username}
                  onChange={(event) => updateField('username', event.target.value)}
                  className={textInputClass}
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="settings-email" className={fieldLabelClass}>
                  Email
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className={textInputClass}
                  autoComplete="email"
                />
              </div>
            </div>
          </section>

          {/* Reporting */}
          <section className="grid grid-cols-1 gap-6 border-b border-[var(--civic-border)] py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10">
            <div>
              <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--civic-text)]">
                Your name
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                You decide, report by report, whether your name is shown.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--civic-border)] bg-white p-5">
              <p className="text-[15px] font-semibold text-[var(--civic-text)]">
                Hiding your name on a report
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--civic-muted)]">
                Every report and update has a &ldquo;Hide my name&rdquo; switch. When it is on, your name is not
                shown publicly — officials can still reach you about it. This is a choice you make each time, so
                there is nothing to set here.
              </p>
            </div>
          </section>

          {/* Official */}
          <section className="grid grid-cols-1 gap-6 border-b border-[var(--civic-border)] py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10">
            <div>
              <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--civic-text)]">
                Official account
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                If you work for a ward, LGA or state office, you can ask to be verified.
              </p>
            </div>
            <div>
              <Link
                to="/verify-office"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--civic-border-strong)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--civic-text)] transition hover:bg-[var(--civic-surface-soft)]"
              >
                Verify your office
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </section>

          {/* Alerts */}
          <section className="grid grid-cols-1 gap-6 border-b border-[var(--civic-border)] py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10">
            <div>
              <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--civic-text)]">
                Alerts
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                Choose what you want to hear about. These are saved on this device only — email and
                push delivery are not connected yet.
              </p>
            </div>
            <div>
              <div className="divide-y divide-[var(--civic-border)]">
                {alertRows.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-6 py-5 first:pt-0"
                  >
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--civic-text)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--civic-muted)]">
                        {item.description}
                      </p>
                    </div>
                    <ToggleSwitch
                      label={item.title}
                      checked={formData[item.key]}
                      onChange={() => updateField(item.key, !formData[item.key])}
                    />
                  </div>
                ))}
              </div>
              <div className="pt-5">
                <label htmlFor="settings-email-digest" className={fieldLabelClass}>
                  Email summary
                </label>
                <select
                  id="settings-email-digest"
                  value={formData.emailDigest}
                  onChange={(event) =>
                    updateField('emailDigest', event.target.value as SettingsState['emailDigest'])
                  }
                  className={`${textInputClass} w-full max-w-xs cursor-pointer`}
                >
                  <option value="off">Off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          </section>

          {/* Display */}
          <section className="grid grid-cols-1 gap-6 border-b border-[var(--civic-border)] py-8 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10 md:py-10">
            <div>
              <h2 className="font-display text-2xl tracking-[-0.01em] text-[var(--civic-text)]">
                Display
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                How the app looks on your screen.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--civic-border)] bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                  <span
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ background: '#fbf7f0' }}
                  />
                  <span className="h-8 w-8 rounded-full" style={{ background: '#0e2a1d' }} />
                  <span className="h-8 w-8 rounded-full" style={{ background: '#0a6a3b' }} />
                  <span className="h-8 w-8 rounded-full" style={{ background: '#d4a540' }} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[var(--civic-text)]">
                    Sovereign Paper — single palette
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--civic-muted)]">
                    Warm paper for sunlight readability, deep forest bands for focus, gold for
                    action. No mode to manage.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 pt-8 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleReset}>
              Reset changes
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save changes
            </Button>
          </footer>
        </div>
      </div>
    </StandardLayout>
  );
}
