import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import { usersService } from '../services';
import type { OfficialMetrics, User } from '../types';

type ProfileTab = 'posts' | 'announcements' | 'initiatives';

const demoOfficial: Partial<User> = {
  id: 9999,
  first_name: 'Adebayo',
  last_name: 'Olusegun',
  full_name: 'Adebayo Olusegun',
  username: 'adebayo.office',
  role: 'Commissioner of Works & Infrastructure',
  bio: 'Focused on road maintenance, drainage upgrades, and clearer public updates across Lagos.',
  email: 'commissioner.works@lagosstate.gov.ng',
  jurisdiction: 'Lagos State, Nigeria',
  phone_number: '+234 814 555 0188',
  avatar:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  banner_image:
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&h=600&fit=crop',
  date_joined: '2023-05-14T00:00:00.000Z',
};

const demoMetrics: OfficialMetrics = {
  totalAssigned: 42,
  resolved: 31,
  inProgress: 7,
  underReview: 4,
  closed: 0,
  reported: 88,
  avgResponseTime: '2.1 days',
  resolutionRate: 84,
  categoryBreakdown: {},
};

const demoUpdates = [
  {
    id: '1',
    title: 'Third Mainland Bridge inspection update',
    body: 'Night inspections have been completed and the next repair phase begins on Monday. Traffic diversions will be shared before work starts.',
    image:
      'https://images.unsplash.com/photo-1465447142348-e9952c393450?w=1200&h=700&fit=crop',
    meta: 'Pinned update',
  },
  {
    id: '2',
    title: 'Drainage clearing around Surulere',
    body: 'Crews have cleared blocked drainage channels in five streets this week. Residents can keep reporting blocked points here for follow-up.',
    meta: '2h ago',
  },
];

export default function OfficialProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [official, setOfficial] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<OfficialMetrics | null>(null);

  useEffect(() => {
    const fetchOfficialData = async () => {
      if (!id) {
        setError('Official ID not found');
        setIsLoading(false);
        return;
      }

      if (id === 'demo') {
        setOfficial(demoOfficial as User);
        setMetrics(demoMetrics);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [userData, userMetrics] = await Promise.all([
          usersService.getUser(parseInt(id, 10)),
          usersService.getUserMetrics(parseInt(id, 10)),
        ]);

        setOfficial(userData);
        setMetrics(userMetrics);
      } catch (err) {
        console.error('Error fetching official data:', err);
        setError('Failed to load official profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfficialData();
  }, [id]);

  if (isLoading) {
    return (
      <StandardLayout showRightSidebar={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
          <div className="flex items-center gap-2 text-[var(--civic-primary)]">
            <div className="size-5 animate-spin rounded-full border-2 border-[var(--civic-primary)] border-t-transparent" />
            <span className="text-sm font-semibold">Loading profile...</span>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (error || !official) {
    return (
      <StandardLayout showRightSidebar={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
          <Icon name="error" className="mb-4 text-6xl text-[var(--civic-danger)]" />
          <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Error Loading Profile</h2>
          <p className="mb-5 mt-2 text-[var(--civic-muted)]">{error || 'Official not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="min-h-11 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-primary-contrast)] transition hover:brightness-105"
            style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
          >
            Go Back
          </button>
        </div>
      </StandardLayout>
    );
  }

  const issueMetrics = metrics || {
    totalAssigned: 0,
    resolved: 0,
    inProgress: 0,
    underReview: 0,
    closed: 0,
    reported: 0,
    avgResponseTime: 'N/A',
    resolutionRate: 0,
    categoryBreakdown: {},
  };

  const officeName = official.first_name && official.last_name
    ? `${official.first_name} ${official.last_name}`
    : official.full_name || official.name || 'Official';
  const profileUpdates =
    id === 'demo'
      ? demoUpdates
      : [
          {
            id: 'live-1',
            title: 'Public works update',
            body: 'Updates from this office will appear here as they are published.',
            meta: 'Latest post',
          },
        ];

  const tabItems = [
    { id: 'posts' as const, label: 'Posts' },
    { id: 'announcements' as const, label: 'Replies' },
    { id: 'initiatives' as const, label: 'Media' },
  ];

  return (
    <StandardLayout showRightSidebar={false}>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}>
        <div className="relative h-56 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--civic-surface-muted) 0%, var(--civic-surface-inset) 100%)' }}>
          <img
            src={
              official.banner_image ||
              'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&h=500&fit=crop'
            }
            alt="Official banner"
            className="h-full w-full object-cover opacity-55"
          />
        </div>

        <div className="px-4 pb-10 lg:px-8">
          <div className="relative -mt-20 civic-panel p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <img
                  src={
                    official.avatar ||
                    official.profile_picture ||
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
                  }
                  alt={officeName}
                  className="size-36 rounded-md object-cover"
                  style={{ boxShadow: '0 18px 36px rgba(22,33,51,0.16), 0 0 0 4px var(--civic-surface)' }}
                />

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-black tracking-[-0.04em] text-[var(--civic-text)] lg:text-5xl">
                      {officeName}
                    </h1>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ background: 'rgba(212,165,64,0.12)', color: 'var(--civic-gold)', boxShadow: 'inset 0 0 0 1px rgba(212,165,64,0.2)' }}
                    >
                      <Icon name="workspace_premium" className="text-base" />
                      Verified Official
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-bold text-[var(--civic-primary)]">
                    {official.role || 'Official account'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--civic-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="location_on" className="text-base text-[var(--civic-primary)]" />
                      {official.jurisdiction || 'Lagos State, Nigeria'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="calendar_month" className="text-base text-[var(--civic-primary)]" />
                      Joined {official.date_joined ? new Date(official.date_joined).getFullYear() : '2023'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" icon="mail">
                  Contact Office
                </Button>
                <Button variant="primary" size="sm" icon="add">
                  Follow Office
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--civic-text)]">{issueMetrics.totalAssigned}</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Open cases</p>
              </div>
              <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-muted)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--civic-text)]">{issueMetrics.resolved}</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Resolved cases</p>
              </div>
              <div className="rounded-md p-5" style={{ background: 'rgba(212,165,64,0.08)', boxShadow: 'inset 0 0 0 1px rgba(212,165,64,0.18)' }}>
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--civic-text)]">{issueMetrics.resolutionRate.toFixed(0)}%</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Response rate</p>
              </div>
              <div className="rounded-md p-5" style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                <p className="text-3xl font-black tracking-[-0.04em] text-[var(--civic-text)]">{issueMetrics.avgResponseTime || 'N/A'}</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Avg. response</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
            <div className="civic-panel">
              <div className="flex gap-8 overflow-x-auto px-6">
                {tabItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-1 py-4 text-sm font-bold transition ${
                      activeTab === tab.id ? 'text-[var(--civic-text)]' : 'text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--civic-primary)]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'posts' && (
                  <div className="space-y-5">
                    {profileUpdates.map((item) => (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-md"
                        style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                      >
                        {item.image && (
                          <img src={item.image} alt={item.title} className="aspect-[16/8] w-full object-cover" />
                        )}
                        <div className="p-6">
                          <p className="civic-label">{item.meta}</p>
                          <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-[var(--civic-text)]">
                            {item.title}
                          </h3>
                          <p className="mt-3 text-[15px] leading-7 text-[var(--civic-muted)]">
                            {item.body}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {activeTab === 'announcements' && (
                  <div className="rounded-md p-8 text-center" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                    <Icon name="campaign" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
                    <p className="text-lg font-bold text-[var(--civic-text)]">No replies yet</p>
                    <p className="mt-2 text-sm text-[var(--civic-muted)]">
                      Replies and follow-ups will show here when they are posted.
                    </p>
                  </div>
                )}

                {activeTab === 'initiatives' && (
                  <div className="rounded-md p-8 text-center" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                    <Icon name="photo_library" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
                    <p className="text-lg font-bold text-[var(--civic-text)]">No media yet</p>
                    <p className="mt-2 text-sm text-[var(--civic-muted)]">
                      Photos and videos shared by this office will show here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-[96px] xl:self-start">
              <section className="civic-panel-soft p-5">
                <p className="civic-label">Office focus</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-md p-4" style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Jurisdiction</p>
                    <p className="mt-2 text-sm font-bold text-[var(--civic-text)]">{official.jurisdiction || 'Lagos State, Nigeria'}</p>
                  </div>
                  <div className="rounded-md p-4" style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Response rate</p>
                    <p className="mt-2 text-sm font-bold text-[var(--civic-text)]">{issueMetrics.resolutionRate.toFixed(0)}%</p>
                  </div>
                </div>
              </section>

              <section className="civic-panel-soft p-5">
                <p className="civic-label">Contact</p>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Icon name="mail" className="mt-0.5 text-[var(--civic-primary)]" />
                    <div>
                      <p className="font-bold text-[var(--civic-text)]">Official address</p>
                      <p className="mt-1 text-[var(--civic-muted)]">{official.email || 'office@civicpulse.gov.ng'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="call" className="mt-0.5 text-[var(--civic-primary)]" />
                    <div>
                      <p className="font-bold text-[var(--civic-text)]">Official line</p>
                      <p className="mt-1 text-[var(--civic-muted)]">{official.phone_number || '+234 000 000 0000'}</p>
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
