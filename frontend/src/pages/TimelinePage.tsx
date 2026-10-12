import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostComposer from '../components/issues/PostComposer';
import { type IssueCategory, type Post } from '../components/issues/PostCard';
import FeedList from '../components/unified-feed/FeedList';
import FeedRightRail from '../components/unified-feed/FeedRightRail';
import { type CivicFeedFilters } from '../components/unified-feed/FilterBar';
import ViewToolbar from '../components/unified-feed/ViewToolbar';
import StandardLayout from '../layouts/StandardLayout';
import { issuesService, postsService } from '../services';
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
  if (timeStr.includes('m')) return Date.now() - num * 60000;
  if (timeStr.includes('h')) return Date.now() - num * 3600000;
  if (timeStr.includes('d')) return Date.now() - num * 86400000;
  if (timeStr.includes('w')) return Date.now() - num * 604800000;
  if (timeStr.includes('mo')) return Date.now() - num * 2592000000;
  if (timeStr.includes('y')) return Date.now() - num * 31536000000;
  return Date.now();
}

export default function TimelinePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CivicFeedFilters>(defaultFilters);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

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
        setError('We could not load the feed right now. Please refresh and try again.');
        console.error('Error fetching feed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    const next = posts.filter((post) => {
      if (filters.scope !== 'all' && post.scope !== filters.scope) return false;
      if (filters.contentType === 'issue' && post.type !== 'issue') return false;
      if (filters.contentType === 'post' && post.type !== 'post') return false;
      if (filters.contentType === 'official' && post.author.role !== 'official') return false;
      return true;
    });

    return next.sort((a, b) => {
      const aScore = a.type === 'issue' ? priorityWeight[a.priority ?? 'low'] : 0;
      const bScore = b.type === 'issue' ? priorityWeight[b.priority ?? 'low'] : 0;

      if (aScore !== bScore) return bScore - aScore;
      return timeToMs(b.timestamp) - timeToMs(a.timestamp);
    });
  }, [filters.contentType, filters.scope, posts]);

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

  const handlePostSubmit = async (content: string, scope: 'local' | 'state' | 'national', image?: string) => {
    try {
      const created = await postsService.createPost({
        content,
        scope,
        image_url: image,
      });
      const newPost = convertBackendPostToPost(created);
      setPosts((current) => [newPost, ...current]);
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('We could not publish that post yet. Please try again.');
    }
  };

  const handleIssueSubmit = async (data: {
    content: string;
    category: IssueCategory;
    location: { ward: string; lga: string; state: string };
    scope: 'local' | 'state' | 'national';
    image?: string;
  }) => {
    try {
      const created = await issuesService.createIssue({
        title: data.content.slice(0, 70),
        description: data.content,
        category: data.category,
        state: data.location.state,
        lga: data.location.lga,
        ward: data.location.ward,
        scope: data.scope,
        priority: 'medium',
        image_url: data.image,
      });

      const newIssue = convertIssueToPost(created);
      setPosts((current) => [newIssue, ...current]);
    } catch (err) {
      console.error('Failed to create issue:', err);
      alert('We could not submit that report yet. Please try again.');
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
        <div className="px-4 pt-6 lg:px-8 lg:pt-8">
          <div className="mx-auto flex max-w-[760px] items-end justify-between gap-6 border-b border-[var(--civic-border)] pb-5">
            <div>
              <p className="font-display text-4xl tracking-[-0.04em] text-[var(--civic-text)] sm:text-5xl">Home</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-[var(--civic-muted)]">
                The civic feed
              </p>
            </div>

            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--civic-muted)]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--civic-gold)] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--civic-gold)]" />
              </span>
              Live
            </span>
          </div>
        </div>

        <ViewToolbar
          scope={filters.scope}
          contentType={filters.contentType}
          searchValue={searchText}
          onScopeChange={(value) => setFilters((current) => ({ ...current, scope: value }))}
          onContentTypeChange={(value) => setFilters((current) => ({ ...current, contentType: value }))}
          onSearchValueChange={setSearchText}
          onSearchSubmit={handleSearchSubmit}
        />

        <div className="px-4 py-5 lg:px-8">
          <div className="mx-auto max-w-[760px]">
            <PostComposer onPostSubmit={handlePostSubmit} onIssueSubmit={handleIssueSubmit} />
          </div>
        </div>

        <div className="px-4 pb-12 lg:px-8">
          <div className="mx-auto max-w-[760px] space-y-4">
            {error && (
              <div className="rounded-md px-5 py-4 text-sm font-medium text-[var(--civic-danger)]" style={{ background: 'rgba(218,92,78,0.12)', boxShadow: 'inset 0 0 0 1px rgba(218,92,78,0.22)' }}>
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((card) => (
                  <div key={card} className="h-64 animate-pulse rounded-md" style={{ background: 'var(--civic-surface)', boxShadow: 'var(--civic-shadow-soft)' }} />
                ))}
              </div>
            ) : (
              <FeedList
                posts={filteredPosts}
                emptyTitle="Nothing to show yet"
                emptyDescription="Try another coverage or post type."
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
