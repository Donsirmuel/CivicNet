import { Icon } from '../common';
import type { Post } from '../issues/PostCard';

interface FeedRightRailProps {
  posts: Post[];
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`;
}

export default function FeedRightRail({ posts }: FeedRightRailProps) {
  const officialPosts = posts.filter((post) => post.author.role === 'official').slice(0, 2);

  const trendingTopics = Array.from(
    posts.reduce((map, post) => {
      const key = post.issueCategory || post.scope || 'community';
      map.set(key, (map.get(key) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const trustedOfficials = Array.from(
    new Map(
      posts
        .filter((post) => post.author.role === 'official')
        .map((post) => [post.author.id || post.author.username, post.author]),
    ).values(),
  ).slice(0, 3);

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-[var(--civic-border)] bg-[linear-gradient(180deg,var(--civic-surface)_0%,var(--civic-surface-soft)_100%)] p-5" style={{ boxShadow: '0 20px 40px -34px rgba(22, 33, 51, 0.24)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--civic-muted)]">What is moving</p>
            <p className="mt-1 font-display text-lg tracking-[-0.01em] text-[var(--civic-text)]">Trending Topics</p>
          </div>
          <Icon name="local_fire_department" className="text-[18px] text-[var(--civic-primary)]" />
        </div>

        <div className="mt-4 space-y-3">
          {trendingTopics.map(([topic, count]) => (
            <article
              key={topic}
              className="rounded-[18px] px-4 py-4"
              style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">
                {topic === 'national' || topic === 'state' || topic === 'local' ? 'Feed pulse' : 'Topic'}
              </p>
              <p className="mt-2 text-sm font-bold capitalize text-[var(--civic-text)]">
                {topic.replace('_', ' ')}
              </p>
              <p className="mt-1 text-xs text-[var(--civic-muted)]">{count} posts</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--civic-border)] bg-[linear-gradient(180deg,var(--civic-surface)_0%,var(--civic-surface-soft)_100%)] p-5" style={{ boxShadow: '0 20px 40px -34px rgba(22, 33, 51, 0.24)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--civic-muted)]">Official replies</p>
            <p className="mt-1 font-display text-lg tracking-[-0.01em] text-[var(--civic-text)]">Directives</p>
          </div>
          <Icon name="campaign" className="text-[18px] text-[var(--civic-gold)]" />
        </div>

        <div className="mt-4 space-y-3">
          {officialPosts.length ? (
            officialPosts.map((post) => (
              <article
                key={`${post.type}-${post.id}`}
                className="rounded-[18px] px-4 py-4"
                style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-primary)]">
                  {post.author.name}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[var(--civic-text)]">
                  {truncate(post.title || post.content, 88)}
                </p>
              </article>
            ))
          ) : (
            <div
              className="rounded-md px-4 py-4 text-sm text-[var(--civic-muted)]"
              style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
            >
              No new updates right now.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--civic-border)] bg-[linear-gradient(180deg,var(--civic-surface)_0%,var(--civic-surface-soft)_100%)] p-5" style={{ boxShadow: '0 20px 40px -34px rgba(22, 33, 51, 0.24)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--civic-muted)]">Trusted offices</p>
        <p className="mt-1 font-display text-lg tracking-[-0.01em] text-[var(--civic-text)]">Trustworthy Officials</p>
        <div className="mt-4 space-y-3">
          {trustedOfficials.length ? (
            trustedOfficials.map((official) => (
              <div
                key={official.id || official.username}
                className="flex items-center gap-3 rounded-[18px] px-4 py-3"
                style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
              >
                <img
                  src={
                    official.avatar ||
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
                  }
                  alt={official.name}
                  className="size-11 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--civic-text)]">{official.name}</p>
                  <p className="truncate text-[11px] text-[var(--civic-muted)]">@{official.username}</p>
                </div>
                <button className="civic-ghost-button !min-h-0 !px-3 !py-2">Follow</button>
              </div>
            ))
          ) : (
            <div
              className="rounded-[18px] px-4 py-4 text-sm text-[var(--civic-muted)]"
              style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
            >
              No suggested offices right now.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
