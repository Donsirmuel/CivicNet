import { useMemo, useState } from 'react';
import { Button, Icon, Input } from '../components/common';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import StandardLayout from '../layouts/StandardLayout';

interface SettingsState {
  fullName: string;
  voterId: string;
  email: string;
  theme: Theme;
  biometricAuth: boolean;
  anonymousComments: boolean;
  legislativeAlerts: boolean;
  constituencyUpdates: boolean;
  civicMentions: boolean;
  officialResponses: boolean;
  emailDigest: 'off' | 'daily' | 'weekly';
}

const defaultSettings: SettingsState = {
  fullName: 'Amina Yusuf Okonjo',
  voterId: '90F5 ***** 1102',
  email: 'amina.okonjo@civicnet.ng',
  
  theme: 'system',
  biometricAuth: true,
  anonymousComments: false,
  legislativeAlerts: true,
  constituencyUpdates: false,
  civicMentions: true,
  officialResponses: true,
  emailDigest: 'daily',
};

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? 'bg-[var(--civic-primary)]' : 'bg-[var(--civic-border-strong)]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function readSavedSettings() {
  const stored = localStorage.getItem('settings_state');
  if (!stored) return defaultSettings;

  try {
    return { ...defaultSettings, ...JSON.parse(stored) } as SettingsState;
  } catch {
    return defaultSettings;
  }
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [savedState, setSavedState] = useState<SettingsState>(() => ({
    ...readSavedSettings(),
    theme,
  }));
  const [formData, setFormData] = useState<SettingsState>(() => ({
    ...readSavedSettings(),
    theme,
  }));

  const sections = useMemo(
    () => [
      { id: 'identity', label: 'Account', caption: 'Name, ID, and email' },
      { id: 'security', label: 'Privacy', caption: 'Login and comment settings' },
      { id: 'alerts', label: 'Alerts', caption: 'What you want to hear about' },
      { id: 'display', label: 'Display', caption: 'Simple app settings' },
    ],
    [],
  );

  const updateField = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('settings_state', JSON.stringify(formData));
    setTheme(formData.theme);
    setSavedState(formData);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const handleReset = () => {
    setFormData(savedState);
    setTheme(savedState.theme);
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const leftSidebar = (
    <div className="space-y-5">
      <div className="civic-section">
        <p className="civic-label">Settings</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Preferences</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--civic-muted)]">
          Update your account details, alert choices, and privacy settings.
        </p>
      </div>

      <div className="civic-section-soft">
        <p className="civic-label">Sections</p>
        <div className="mt-4 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="w-full rounded-md px-4 py-4 text-left transition hover:brightness-[0.99]"
              style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
            >
              <p className="text-sm font-bold text-[var(--civic-text)]">{section.label}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--civic-muted)]">{section.caption}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <StandardLayout leftSidebar={leftSidebar} showLeftSidebar showRightSidebar={false}>
      <div className="min-h-screen px-4 py-6 lg:px-8" style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}>
        <div className="civic-section">
          <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: 'var(--civic-border)' }}>
            <div>
              <p className="civic-label">Your account</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--civic-text)]">Settings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--civic-muted)]">
                Change your details, choose what you want to receive, and save how the app works for you.
              </p>
            </div>
            {saved && (
              <div className="inline-flex items-center gap-2 rounded-md px-4 py-3 text-sm font-bold text-[var(--civic-primary)]" style={{ background: 'var(--civic-primary-glow)' }}>
                <Icon name="check_circle" className="text-lg" />
                Saved
              </div>
            )}
          </div>

          <div className="border-b py-4 lg:hidden" style={{ borderColor: 'var(--civic-border)' }}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="shrink-0 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]"
                  style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 pt-8">
            <section id="identity" className="space-y-5">
              <div className="border-b pb-4" style={{ borderColor: 'var(--civic-border)' }}>
                <p className="civic-label">Account</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Account details</h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                  <div className="space-y-5">
                    <Input
                      label="Full Name"
                      value={formData.fullName}
                      onChange={(event) => updateField('fullName', event.target.value)}
                    />

                    <div>
                      <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--civic-muted)]">
                        Voter ID
                      </label>
                      <Input
                        label=""
                        value={formData.voterId}
                        onChange={(event) => updateField('voterId', event.target.value)}
                      />
                    </div>

                    <Input
                      label="Email"
                      value={formData.email}
                      onChange={(event) => updateField('email', event.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--civic-muted)]">Profile</p>
                  <div className="mt-5 space-y-4 text-sm leading-6 text-[var(--civic-muted)]">
                    <div className="rounded-md px-4 py-4" style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">
                        Status
                      </p>
                      <p className="mt-2 text-base font-bold text-[var(--civic-text)]">Verified account</p>
                    </div>
                    <p>
                      These details are used when you post, comment, or send a report.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="security" className="space-y-5">
              <div className="border-b pb-4" style={{ borderColor: 'var(--civic-border)' }}>
                <p className="civic-label">Privacy</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Privacy and access</h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-[var(--civic-text)]">Biometric login</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                        Ask for fingerprint or face ID on sensitive actions.
                      </p>
                    </div>
                    <ToggleSwitch checked={formData.biometricAuth} onChange={() => updateField('biometricAuth', !formData.biometricAuth)} />
                  </div>
                </div>

                <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-[var(--civic-text)]">Hide my name in comments</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                        Keep your name hidden in public comments while your account stays verified.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={formData.anonymousComments}
                      onChange={() => updateField('anonymousComments', !formData.anonymousComments)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section id="alerts" className="space-y-5">
              <div className="border-b pb-4" style={{ borderColor: 'var(--civic-border)' }}>
                <p className="civic-label">Alerts</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--civic-text)]">What you want to receive</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
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
                  {
                    key: 'civicMentions' as const,
                    title: 'Mentions',
                    description: 'When someone mentions you in a post or comment.',
                  },
                  {
                    key: 'officialResponses' as const,
                    title: 'Official replies',
                    description: 'Replies and progress updates from verified offices.',
                  },
                ].map((item) => (
                  <div key={item.key} className="rounded-md p-5" style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-[var(--civic-text)]">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">{item.description}</p>
                      </div>
                      <ToggleSwitch
                        checked={formData[item.key]}
                        onChange={() => updateField(item.key, !formData[item.key])}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--civic-muted)]">
                  Email summary
                </label>
                <select
                  value={formData.emailDigest}
                  onChange={(event) => updateField('emailDigest', event.target.value as SettingsState['emailDigest'])}
                  className="min-h-11 w-full rounded-md px-4 text-sm text-[var(--civic-text)] outline-none"
                  style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                >
                  <option value="off">Off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </section>

            <section id="display" className="space-y-5">
              <div className="border-b pb-4" style={{ borderColor: 'var(--civic-border)' }}>
                <p className="civic-label">Display</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--civic-text)]">App appearance</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    id: 'system' as Theme,
                    title: 'Use system',
                    description: 'Follow your device preference automatically.',
                    icon: 'devices',
                  },
                  {
                    id: 'light' as Theme,
                    title: 'Standard light',
                    description: 'A clean bright view for everyday use.',
                    icon: 'light_mode',
                  },
                  {
                    id: 'dark' as Theme,
                    title: 'Sovereign dark',
                    description: 'A deeper high-contrast view with stronger focus.',
                    icon: 'dark_mode',
                  },
                ].map((option) => {
                  const active = formData.theme === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        updateField('theme', option.id);
                        setTheme(option.id);
                      }}
                      className="p-6 text-left transition"
                      style={{
                        background: active ? 'var(--civic-surface-strong)' : 'var(--civic-surface-soft)',
                        boxShadow: active
                          ? 'inset 0 0 0 1px rgba(10,106,59,0.24)'
                          : 'inset 0 0 0 1px var(--civic-border)',
                        color: active ? 'var(--civic-text)' : 'var(--civic-text)',
                      }}
                    >
                      <div
                        className="flex size-11 items-center justify-center rounded-full"
                        style={{
                          background: active ? 'var(--civic-primary-glow)' : 'var(--civic-surface)',
                          color: active ? 'var(--civic-primary)' : 'var(--civic-muted)',
                        }}
                      >
                        <Icon name={option.icon} className="text-xl" />
                      </div>
                      <p className="mt-5 text-sm font-bold">{option.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end" style={{ borderColor: 'var(--civic-border)' }}>
              <Button variant="outline" onClick={handleReset}>
                Reset Changes
              </Button>
              <Button variant="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </section>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
