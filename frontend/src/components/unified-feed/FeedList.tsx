import PostCard, { type Post } from '../issues/PostCard';

interface FeedListProps {
  posts: Post[];
  emptyTitle: string;
  emptyDescription: string;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onBookmark: (id: string) => void;
}

export default function FeedList({
  posts,
  emptyTitle,
  emptyDescription,
  onLike,
  onComment,
  onShare,
  onBookmark,
}: FeedListProps) {
  if (posts.length === 0) {
    return (
      <div className="px-4 py-10 lg:px-6">
        <div className="rounded-[28px] border border-[var(--civic-border)] bg-[linear-gradient(180deg,var(--civic-surface)_0%,var(--civic-surface-soft)_100%)] px-6 py-12 text-center" style={{ boxShadow: '0 20px 40px -34px rgba(22, 33, 51, 0.24)' }}>
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[var(--civic-surface-inset)]">
            <span className="material-symbols-outlined text-4xl text-[var(--civic-muted)]">travel_explore</span>
          </div>
          <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-[var(--civic-text)]">{emptyTitle}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--civic-muted)]">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <div key={`${post.type}-${post.id}`}>
          <PostCard
            post={post}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onBookmark={onBookmark}
          />
        </div>
      ))}
    </div>
  );
}
