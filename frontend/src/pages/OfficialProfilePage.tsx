import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import { postsService, usersService } from '../services';
import type { OfficialMetrics, User } from '../types';

type ProfileTab = 'posts' | 'announcements' | 'initiatives';

const AVATAR_COLORS = ['#a87b5a', '#0a6a3b', '#31572c', '#d4a540'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ? parts[0][0] : '';
  const second = parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : '';
  return `${first}${second}`.toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % 2147483647;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0] ?? '#0a6a3b';
}

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

function DemoToggle({ showDemo, onToggle }: { showDemo: boolean; onToggle: () => void }) {
  return (
    <div className="border-b px-4 py-3 lg:px-8" style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-surface-soft)' }}>
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
        <p className="text-sm text-[var(--civic-muted)]">
          {showDemo
            ? 'This is an example page, filled with sample content.'
            : 'This page is quiet. See how it looks with example content.'}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={showDemo}
          aria-label="Show example content"
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
            showDemo ? 'bg-[var(--civic-primary)]' : 'bg-[var(--civic-border-strong)]'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
              showDemo ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function OfficialProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedOfficial, setFetchedOfficial] = useState<User | null>(null);
  const [fetchedMetrics, setFetchedMetrics] = useState<OfficialMetrics | null>(null);
  const [officePosts, setOfficePosts] = useState<
    Array<{ id: string; title: string; body: string; meta: string }>
  >([]);
  const [showDemo, setShowDemo] = useState(false);

  const official = showDemo ? (demoOfficial as User) : fetchedOfficial;
  const metrics = showDemo ? demoMetrics : fetchedMetrics;

  useEffect(() => {
    const fetchOfficialData = async () => {
      if (!id) {
        setError("We couldn't find that office.");
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

        setFetchedOfficial(userData);
        setFetchedMetrics(userMetrics);

        const allPosts = await postsService.getPosts({ ordering: '-created_at' }).catch(() => []);
        const own = allPosts
          .filter(
            (post) =>
              post.author?.id === userData.id || post.author?.username === userData.username,
          )
          .slice(0, 5)
          .map((post) => ({
            id: String(post.id),
            title: post.content.slice(0, 80),
            body: post.content,
            meta: post.created_at ? new Date(post.created_at).toLocaleDateString() : '',
          }));
        setOfficePosts(own);
      } catch (err) {
        console.error('Error fetching official data:', err);
        setError('We could not open this profile. Check your connection and try again.');
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

  if ((error && !showDemo) || !official) {
    return (
      <StandardLayout showRightSidebar={false}>
        <DemoToggle showDemo={showDemo} onToggle={() => setShowDemo((v) => !v)} />
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
          <Icon name="error" className="mb-4 text-6xl text-[var(--civic-danger)]" />
          <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Could not open this profile</h2>
          <p className="mb-5 mt-2 text-[var(--civic-muted)]">{error || 'Official not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="min-h-11 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-primary-contrast)] transition hover:brightness-105"
            style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
          >
            Go back
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
  const profileUpdates: Array<{ id: string; title: string; body: string; meta: string; image?: string }> =
    showDemo ? demoUpdates : officePosts;

  const tabItems = [
    { id: 'posts' as const, label: 'Posts' },
    { id: 'announcements' as const, label: 'Replies' },
    { id: 'initiatives' as const, label: 'Media' },
  ];

  return (
    <StandardLayout showRightSidebar={false}>
      <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}>
        <DemoToggle showDemo={showDemo} onToggle={() => setShowDemo((v) => !v)} />
        <div className="relative h-56 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0e2a1d, #1d5c38)' }}>
          {official.banner_image ? (
            <img
              src={official.banner_image}
              alt="Official banner"
              className="h-full w-full object-cover opacity-55"
            />
          ) : (
            <div aria-hidden="true" className="h-full w-full" style={{ background: 'linear-gradient(135deg, #0e2a1d, #1d5c38)' }} />
          )}
        </div>

        <div className="px-4 pb-10 lg:px-8">
          <div className="relative -mt-20 civic-panel p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0 flex flex-col gap-5 sm:flex-row sm:items-end">
                {official.avatar || official.profile_picture ? (
                  <img
                    src={official.avatar || official.profile_picture}
                    alt={officeName}
                    className="size-36 rounded-md object-cover"
                    style={{ boxShadow: '0 18px 36px rgba(22,33,51,0.16), 0 0 0 4px var(--civic-surface)' }}
                  />
                ) : (
                  <span
                    className="flex size-36 shrink-0 items-center justify-center rounded-md text-5xl font-bold text-white"
                    style={{
                      background: getAvatarColor(officeName),
                      boxShadow: '0 18px 36px rgba(22,33,51,0.16), 0 0 0 4px var(--civic-surface)',
                    }}
                    aria-hidden="true"
                  >
                    {getInitials(officeName)}
                  </span>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="break-words text-4xl font-black tracking-[-0.04em] text-[var(--civic-text)] lg:text-5xl">
                      {officeName}
                    </h1>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ background: 'rgba(212,165,64,0.12)', color: 'var(--civic-gold)', boxShadow: 'inset 0 0 0 1px rgba(212,165,64,0.2)' }}
                    >
                      <Icon name="workspace_premium" className="text-base" />
                      Verified official
                    </span>
                    {showDemo && (
                      <span className="inline-flex items-center rounded-full bg-[rgba(218,92,78,0.12)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-danger)]">
                        Example
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-lg font-bold text-[var(--civic-primary)]">
                    {official.role || 'Official account'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--civic-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="location_on" className="text-base text-[var(--civic-primary)]" />
                      {official.jurisdiction || 'Nigeria'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="calendar_month" className="text-base text-[var(--civic-primary)]" />
                      Joined {official.date_joined ? new Date(official.date_joined).getFullYear() : 'recently'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" icon="mail">
                  Contact office
                </Button>
                <Button variant="primary" size="sm" icon="add">
                  Follow office
                </Button>
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--civic-border)] pt-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="folder_open" className="text-sm text-[var(--civic-primary)]" />
                  Open cases <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{issueMetrics.totalAssigned}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="task_alt" className="text-sm text-[var(--civic-primary)]" />
                  Resolved <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{issueMetrics.resolved}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="query_stats" className="text-sm text-[var(--civic-primary)]" />
                  Response rate <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{issueMetrics.resolutionRate.toFixed(0)}%</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="timer" className="text-sm text-[var(--civic-primary)]" />
                  Average reply <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{issueMetrics.avgResponseTime || 'No replies yet'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
            <div className="min-w-0 civic-panel">
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
                    {profileUpdates.length ? (
                      profileUpdates.map((item) => (
                        <article
                          key={item.id}
                          className="overflow-hidden rounded-md"
                          style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                        >
                          {item.image && (
                            <img src={item.image} alt={item.title} className="aspect-[16/8] w-full object-cover" />
                          )}
                          <div className="p-6">
                            {item.meta && <p className="civic-label">{item.meta}</p>}
                            <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-[var(--civic-text)]">
                              {item.title}
                            </h3>
                            <p className="mt-3 text-[15px] leading-7 text-[var(--civic-muted)]">
                              {item.body}
                            </p>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-md p-8 text-center" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                        <p className="text-lg font-bold text-[var(--civic-text)]">No updates from this office yet</p>
                        <p className="mt-2 text-sm text-[var(--civic-muted)]">
                          When this office posts, it shows here.
                        </p>
                      </div>
                    )}
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

            <aside className="min-w-0 space-y-4 xl:sticky xl:top-[96px] xl:self-start">
              <section className="civic-panel-soft p-5">
                <p className="civic-label">Office focus</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-md p-4" style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Jurisdiction</p>
                    <p className="mt-2 text-sm font-bold text-[var(--civic-text)]">{official.jurisdiction || 'Not listed'}</p>
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
                      <p className="mt-1 break-all text-[var(--civic-muted)]">{official.email || 'Not listed'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="call" className="mt-0.5 text-[var(--civic-primary)]" />
                    <div>
                      <p className="font-bold text-[var(--civic-text)]">Official line</p>
                      <p className="mt-1 text-[var(--civic-muted)]">{official.phone_number || 'Not listed'}</p>
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
