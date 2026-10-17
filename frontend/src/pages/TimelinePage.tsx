import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostComposer from '../components/issues/PostComposer';
import { type IssueCategory, type Post } from '../components/issues/PostCard';
import FeedList from '../components/unified-feed/FeedList';
import FeedRightRail from '../components/unified-feed/FeedRightRail';
import { type CivicFeedFilters } from '../types';
import ViewToolbar, { type FeedTab } from '../components/unified-feed/ViewToolbar';
import StandardLayout from '../layouts/StandardLayout';
import { issuesService, postsService, profilesService } from '../services';
import { convertBackendPostToPost, convertIssueToPost } from '../utils/dataMappers';

const defaultFilters: CivicFeedFilters = {
  search: '',
  scope: 'all',
  contentType: 'all',
  status: 'all',
  category: 'all',
  priority: 'all',
  verifiedOnly: false,
};

const priorityWeight = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function timeToMs(timeStr: string) {
  if (timeStr === 'Just now' || timeStr === 'now') return Date.now();
  const num = parseInt(timeStr, 10);
  if (Number.isNaN(num)) return Date.now();
  if (timeStr.includes('mo')) return Date.now() - num * 2592000000;
  if (timeStr.includes('y')) return Date.now() - num * 31536000000;
  if (timeStr.includes('m')) return Date.now() - num * 60000;
  if (timeStr.includes('h')) return Date.now() - num * 3600000;
  if (timeStr.includes('d')) return Date.now() - num * 86400000;
  if (timeStr.includes('w')) return Date.now() - num * 604800000;
  return Date.now();
}

export default function TimelinePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CivicFeedFilters>(defaultFilters);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');
  const [composerOpen, setComposerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // The area we compare against for the "Near me" tab (from the user's profile).
  const [myArea, setMyArea] = useState<{ state?: string; lga?: string } | null>(null);

  useEffect(() => {
    const open = () => setComposerOpen(true);
    window.addEventListener('civic:open-composer', open as EventListener);
    return () => window.removeEventListener('civic:open-composer', open as EventListener);
  }, []);

  useEffect(() => {
    if (!composerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setComposerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [composerOpen]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    if (tab === 'for-you') {
      setFilters((current) => ({ ...current, scope: 'all', contentType: 'all' }));
    } else if (tab === 'near-me') {
      setFilters((current) => ({ ...current, scope: 'all', contentType: 'all' }));
    } else {
      setFilters((current) => ({ ...current, contentType: 'official' }));
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [issues, fetchedPosts] = await Promise.all([
        issuesService.getIssues({ ordering: '-created_at' }).catch(() => []),
        postsService.getPosts({ ordering: '-created_at' }).catch(() => []),
      ]);

      // The user's own area, used by the "Near me" tab. Best-effort.
      profilesService
        .getCurrentProfile()
        .then((profile) => setMyArea({ state: profile.state, lga: profile.lga }))
        .catch(() => {});

      const merged = [...issues.map(convertIssueToPost), ...fetchedPosts.map(convertBackendPostToPost)].sort(
        (a, b) => timeToMs(b.timestamp) - timeToMs(a.timestamp),
      );

      setPosts(merged);
    } catch (err) {
      setError('We could not load the feed right now. Please refresh and try again.');
      console.error('Error fetching feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    const nearState = myArea?.state?.trim().toLowerCase();
    const nearLga = myArea?.lga?.trim().toLowerCase();
    const next = posts.filter((post) => {
      if (filters.scope !== 'all' && post.scope !== filters.scope) return false;
      if (filters.contentType === 'issue' && post.type !== 'issue') return false;
      if (filters.contentType === 'post' && post.type !== 'post') return false;
      // "Official replies" shows reports that actually received a reply from an
      // official — not posts written by officials.
      if (filters.contentType === 'official' && !post.hasOfficialReply) return false;
      // "Near me" keeps reports in the user's own state, and their LGA when we
      // know it. Reports nothing about their area are left out.
      if (activeTab === 'near-me' && nearState) {
        if (post.location?.state?.trim().toLowerCase() !== nearState) return false;
        if (nearLga && post.location?.lga && post.location.lga.trim().toLowerCase() !== nearLga) {
          return false;
        }
      }
      return true;
    });

    return next.sort((a, b) => {
      const aScore = a.type === 'issue' ? priorityWeight[a.priority ?? 'low'] : 0;
      const bScore = b.type === 'issue' ? priorityWeight[b.priority ?? 'low'] : 0;

      if (aScore !== bScore) return bScore - aScore;
      return timeToMs(b.timestamp) - timeToMs(a.timestamp);
    });
  }, [activeTab, filters.contentType, filters.scope, myArea, posts]);

  const handleLike = async (postId: string) => {
    const target = posts.find((post) => post.id === postId);
    if (!target) return;

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              stats: {
                ...post.stats,
                likes: post.liked ? post.stats.likes - 1 : post.stats.likes + 1,
              },
            }
          : post,
      ),
    );

    try {
      if (target.type === 'issue') {
        if (target.liked) {
          await issuesService.unlikeIssue(parseInt(postId, 10));
        } else {
          await issuesService.likeIssue(parseInt(postId, 10));
        }
      } else {
        if (target.liked) {
          await postsService.unlikePost(parseInt(postId, 10));
        } else {
          await postsService.likePost(parseInt(postId, 10));
        }
      }
    } catch (err) {
      console.error('Failed to update like state:', err);
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: target.liked,
                stats: { ...post.stats, likes: target.stats.likes },
              }
            : post,
        ),
      );
    }
  };

  const handleComment = (postId: string) => {
    const post = posts.find((entry) => entry.id === postId);
    if (!post) return;
    navigate(post.type === 'issue' ? `/issue/${postId}` : `/post/${postId}`);
  };

  const handleShare = async (postId: string) => {
    const post = posts.find((entry) => entry.id === postId);
    if (!post) return;

    setPosts((current) =>
      current.map((entry) =>
        entry.id === postId
          ? { ...entry, stats: { ...entry.stats, shares: entry.stats.shares + 1 } }
          : entry,
      ),
    );

    const url = `${window.location.origin}/${post.type === 'issue' ? 'issue' : 'post'}/${postId}`;
    const text = `${post.title ? `${post.title} — ` : ''}${url}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard can be blocked; WhatsApp still carries the link.
    }
    // WhatsApp is what people here actually use to pass things on, so make it
    // the primary share channel (a copy of the link is kept on the clipboard).
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setCopiedId(postId);
    setTimeout(() => setCopiedId((current) => (current === postId ? null : current)), 2000);
  };

  const handleBookmark = (postId: string) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)),
    );
  };

  const handlePostSubmit = async (
    content: string,
    scope: 'local' | 'state' | 'national',
    image?: string,
    isAnonymous?: boolean,
  ) => {
    try {
      const created = await postsService.createPost({
        content,
        scope,
        image_url: image,
        is_anonymous: isAnonymous,
      });
      const newPost = convertBackendPostToPost(created);
      setPosts((current) => [newPost, ...current]);
      setComposerOpen(false);
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('We could not publish that update yet. Please try again.');
    }
  };

  const handleIssueSubmit = async (data: {
    content: string;
    category: IssueCategory;
    location: { ward: string; lga: string; state: string };
    scope: 'local' | 'state' | 'national';
    image?: string;
    responsibleOffice?: string;
    isAnonymous?: boolean;
  }) => {
    try {
      const description = data.responsibleOffice
        ? `${data.content}\n\nResponsible office: ${data.responsibleOffice}`
        : data.content;
      const created = await issuesService.createIssue({
        title: data.content.slice(0, 70),
        description,
        category: data.category,
        state: data.location.state,
        lga: data.location.lga,
        ward: data.location.ward,
        scope: data.scope,
        priority: 'medium',
        image_url: data.image,
        is_anonymous: data.isAnonymous,
      });

      const newIssue = convertIssueToPost(created);
      setPosts((current) => [newIssue, ...current]);
      setComposerOpen(false);
    } catch (err) {
      console.error('Failed to create issue:', err);
      setError('We could not submit that report yet. Please try again.');
    }
  };

  const handleSearchSubmit = () => {
    const query = searchText.trim();
    const params = new URLSearchParams();

    if (query) params.set('q', query);
    if (filters.scope !== 'all') params.set('scope', filters.scope);
    if (filters.contentType !== 'all') params.set('type', filters.contentType);

    navigate(`/explore${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <StandardLayout
      rightSidebar={<FeedRightRail posts={filteredPosts} />}
      showRightSidebar
      stickyRightSidebar
      showRightSidebarControls={false}
    >
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}>
        <h1 className="sr-only">Home</h1>

        <div className="pt-4">
          <ViewToolbar
          scope={filters.scope}
          contentType={filters.contentType}
          searchValue={searchText}
          onScopeChange={(value) => setFilters((current) => ({ ...current, scope: value }))}
          onContentTypeChange={(value) => setFilters((current) => ({ ...current, contentType: value }))}
          onSearchValueChange={setSearchText}
          onSearchSubmit={handleSearchSubmit}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        </div>

        {activeTab === 'near-me' && !myArea?.state && (
          <div className="px-4 pt-3 lg:px-8">
            <div className="mx-auto max-w-[760px]">
              <p className="rounded-[16px] border border-[var(--civic-border)] bg-[var(--civic-surface)] px-4 py-3 text-[13px] text-[var(--civic-muted)]">
                Add your location in your profile to see reports near you. For now we cannot tell which
                reports are close.
              </p>
            </div>
          </div>
        )}

        <div className="px-4 pt-3 lg:px-8">
          <div className="mx-auto max-w-[760px]">
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="flex w-full items-center gap-3 rounded-[20px] border border-[var(--civic-border)] bg-[var(--civic-surface)] px-5 py-3.5 text-left transition hover:-translate-y-0.5"
              style={{ boxShadow: '0 20px 40px -34px rgba(22, 33, 51, 0.24)' }}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--civic-primary-glow)] text-[var(--civic-primary)]">
                <span className="material-symbols-outlined text-[20px]">edit_square</span>
              </span>
              <span className="flex-1 truncate text-[15px] text-[var(--civic-muted)]">
                What is wrong on your street?
              </span>
              <span className="shrink-0 rounded-full bg-[linear-gradient(135deg,var(--civic-primary)_0%,var(--civic-primary-deep)_100%)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--civic-primary-contrast)]">
                Report
              </span>
            </button>
          </div>
        </div>

        {composerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(19,32,51,0.45)] p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={() => setComposerOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Report an issue"
          >
            <div
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[24px] sm:rounded-[24px]"
              onClick={(event) => event.stopPropagation()}
            >
              <PostComposer onPostSubmit={handlePostSubmit} onIssueSubmit={handleIssueSubmit} />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          aria-label="Report an issue"
          title="Report an issue"
          className="fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full text-[var(--civic-primary-contrast)] shadow-[0_22px_40px_rgba(10,106,59,0.35)] transition hover:brightness-110 lg:bottom-8 lg:right-8"
          style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>

        <div className="px-4 pb-12 lg:px-8">
          <div className="mx-auto max-w-[760px] space-y-4">
            {error && (
              <div className="rounded-md px-5 py-4 text-sm font-medium text-[var(--civic-danger)]" style={{ background: 'rgba(218,92,78,0.12)', boxShadow: 'inset 0 0 0 1px rgba(218,92,78,0.22)' }}>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={fetchData}
                  className="mt-3 inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--civic-primary-contrast)]"
                  style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
                >
                  Try again
                </button>
              </div>
            )}
            {copiedId && (
              <div role="status" className="rounded-md px-5 py-3 text-sm font-semibold text-[var(--civic-primary)]" style={{ background: 'var(--civic-primary-glow)' }}>
                Link copied
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((card) => (
                  <div key={card} className="h-64 animate-pulse rounded-[20px]" style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow-soft)' }} />
                ))}
              </div>
            ) : (
              <FeedList
                posts={filteredPosts}
                emptyTitle="Nothing here yet"
                emptyDescription="Try a different filter — or report the first problem in this view."
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onBookmark={handleBookmark}
              />
            )}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
