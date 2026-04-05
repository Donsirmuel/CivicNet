import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Post } from '../components/issues/PostCard';
import FeedList from '../components/unified-feed/FeedList';
import { type CivicFeedFilters } from '../components/unified-feed/FilterBar';
import ViewToolbar from '../components/unified-feed/ViewToolbar';
import StandardLayout from '../layouts/StandardLayout';
import { issuesService, postsService } from '../services';
import { convertBackendPostToPost, convertIssueToPost } from '../utils/dataMappers';

type SearchTab = 'top' | 'posts' | 'people';

const defaultFilters: CivicFeedFilters = {
  search: '',
  scope: 'all',
  contentType: 'all',
  status: 'all',
  category: 'all',
  priority: 'all',
  verifiedOnly: false,
};

function timeToMs(timeStr: string) {
  if (timeStr === 'Just now' || timeStr === 'now') return Date.now();
  const num = parseInt(timeStr, 10);
  if (Number.isNaN(num)) return Date.now();
  if (timeStr.includes('m')) return Date.now() - num * 60000;
  if (timeStr.includes('h')) return Date.now() - num * 3600000;
  if (timeStr.includes('d')) return Date.now() - num * 86400000;
  if (timeStr.includes('w')) return Date.now() - num * 604800000;
  if (timeStr.includes('mo')) return Date.now() - num * 2592000000;
  if (timeStr.includes('y')) return Date.now() - num * 31536000000;
  return Date.now();
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<SearchTab>('top');

  const filters: CivicFeedFilters = {
    ...defaultFilters,
    search: searchParams.get('q') || '',
    scope: (searchParams.get('scope') as CivicFeedFilters['scope']) || 'all',
    contentType: (searchParams.get('type') as CivicFeedFilters['contentType']) || 'all',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [issues, fetchedPosts] = await Promise.all([
          issuesService.getIssues({ ordering: '-created_at' }).catch(() => []),
          postsService.getPosts({ ordering: '-created_at' }).catch(() => []),
        ]);

        const merged = [...issues.map(convertIssueToPost), ...fetchedPosts.map(convertBackendPostToPost)].sort(
          (a, b) => timeToMs(b.timestamp) - timeToMs(a.timestamp),
        );

        setPosts(merged);
      } catch (err) {
        setError('We could not load search results right now. Please refresh and try again.');
        console.error('Error fetching search results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return posts.filter((post) => {
      if (filters.scope !== 'all' && post.scope !== filters.scope) return false;
      if (filters.contentType === 'issue' && post.type !== 'issue') return false;
      if (filters.contentType === 'post' && post.type !== 'post') return false;
      if (filters.contentType === 'official' && post.author.role !== 'official') return false;

      if (!query) return true;

      const haystack = [
        post.title || '',
        post.content,
        post.author.name,
        post.author.username,
        post.location?.state || '',
        post.location?.lga || '',
        post.location?.ward || '',
        post.issueCategory || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [filters.contentType, filters.scope, filters.search, posts]);

  const peopleResults = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const entries = Array.from(
      new Map(
        posts
          .map((post) => [post.author.id || `${post.author.username}-${post.author.name}`, post.author])
      ).values(),
    );

    return entries.filter((author) => {
      if (!query) return true;
      return `${author.name} ${author.username}`.toLowerCase().includes(query);
    });
  }, [filters.search, posts]);

  const topResults = useMemo(() => filteredPosts.slice(0, 6), [filteredPosts]);

  const updateSearch = (query: string, scope = filters.scope, type = filters.contentType) => {
    const next = new URLSearchParams();
    if (query.trim()) next.set('q', query.trim());
    if (scope !== 'all') next.set('scope', scope);
    if (type !== 'all') next.set('type', type);
    setSearchParams(next, { replace: true });
  };

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
        await issuesService.likeIssue(parseInt(postId, 10));
      } else {
        await postsService.likePost(parseInt(postId, 10));
      }
    } catch (err) {
      console.error('Failed to like result:', err);
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
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Unable to copy share link:', err);
    }
  };

  const handleBookmark = (postId: string) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)),
    );
  };
  const handleComment = (postId: string) => {
    const post = filteredPosts.find((entry) => entry.id === postId);
    if (!post) return;
    navigate(post.type === 'issue' ? `/issue/${postId}` : `/post/${postId}`);
  };

  return (
    <StandardLayout showRightSidebar={false}>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}>
        <ViewToolbar
          scope={filters.scope}
          contentType={filters.contentType}
          searchValue={filters.search}
          onScopeChange={(value) => updateSearch(filters.search, value, filters.contentType)}
          onContentTypeChange={(value) => updateSearch(filters.search, filters.scope, value)}
          onSearchValueChange={(value) => updateSearch(value, filters.scope, filters.contentType)}
          onSearchSubmit={() => updateSearch(filters.search, filters.scope, filters.contentType)}
        />

        <div className="px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-[820px]">
            <div className="border-b pb-3" style={{ borderColor: 'var(--civic-border)' }}>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'top', label: 'Top' },
                  { id: 'posts', label: 'Posts' },
                  { id: 'people', label: 'People' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SearchTab)}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                      activeTab === tab.id
                        ? 'text-[var(--civic-text)]'
                        : 'text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
                    }`}
                    style={activeTab === tab.id ? { background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' } : { background: 'transparent' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md px-5 py-4 text-sm font-medium text-[var(--civic-danger)]" style={{ background: 'rgba(218,92,78,0.12)', boxShadow: 'inset 0 0 0 1px rgba(218,92,78,0.22)' }}>
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="mt-4 space-y-4">
                {[1, 2, 3].map((card) => (
                  <div key={card} className="h-56 animate-pulse rounded-md" style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow-soft)' }} />
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {activeTab === 'people' && (
                  <div className="space-y-3">
                    {peopleResults.length ? (
                      peopleResults.map((person) => (
                        <button
                          key={person.id || person.username}
                          onClick={() =>
                            navigate(
                              person.role === 'official'
                                ? `/profile/official/${person.id || ''}`
                                : '/profile',
                            )
                          }
                          className="flex w-full items-center gap-4 rounded-md px-5 py-4 text-left transition hover:-translate-y-0.5"
                          style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow-soft)' }}
                        >
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="size-12 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[var(--civic-text)]">{person.name}</p>
                            <p className="mt-1 truncate text-xs text-[var(--civic-muted)]">{person.username}</p>
                          </div>
                          {person.role === 'official' && (
                            <span className="civic-chip">
                              Official
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-md px-6 py-10 text-center" style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow-soft)' }}>
                        <p className="text-lg font-bold text-[var(--civic-text)]">No people found</p>
                        <p className="mt-2 text-sm text-[var(--civic-muted)]">Try another name or keyword.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'top' && (
                  <FeedList
                    posts={topResults}
                    emptyTitle={filters.search ? `No results for "${filters.search}"` : 'Start a search'}
                    emptyDescription={
                      filters.search ? 'Try another keyword, location, or post type.' : 'Search for posts, people, or topics.'
                    }
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                  />
                )}

                {activeTab === 'posts' && (
                  <FeedList
                    posts={filteredPosts}
                    emptyTitle={filters.search ? `No posts for "${filters.search}"` : 'Start a search'}
                    emptyDescription={
                      filters.search ? 'Try another keyword, location, or post type.' : 'Search for posts, people, or topics.'
                    }
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
