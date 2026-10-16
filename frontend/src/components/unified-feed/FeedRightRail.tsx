import { getLocationString } from '../../data/locationData';
import type { Post } from '../issues/PostCard';

interface FeedRightRailProps {
  posts: Post[];
}

const FALLBACK_TOPICS = ['Education', 'Infrastructure', 'Health', 'Environment'];

function formatTopic(topic: string) {
  return topic
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function FeedRightRail({ posts }: FeedRightRailProps) {
  const openIssues = posts.filter(
    (post) => post.type === 'issue' && post.issueStatus !== 'resolved' && post.issueStatus !== 'closed',
  ).length;
  const answeredThisMonth = posts.filter((post) => post.author.role === 'official').length;
  const isWardEmpty = openIssues === 0 && answeredThisMonth === 0;

  const firstLocatedPost = posts.find((post) => post.location);
  const wardName = firstLocatedPost?.location ? getLocationString(firstLocatedPost.location) : 'Your ward';

  const topics = Array.from(
    posts.reduce((map, post) => {
      if (!post.issueCategory) return map;
      map.set(post.issueCategory, (map.get(post.issueCategory) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topic]) => formatTopic(topic));

  const topicChips = topics.length > 0 ? topics : FALLBACK_TOPICS;

  return (
    <div className="space-y-5">
      <section
        className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5"
        style={{ boxShadow: '0 12px 28px rgba(22, 33, 51, 0.06)' }}
      >
        <h2 className="font-display text-[18px] font-bold text-[var(--civic-text)]">Your ward</h2>
        {isWardEmpty ? (
          <p className="mt-3 text-sm text-[var(--civic-muted)]">Be the first in your ward</p>
        ) : (
          <div className="mt-3 space-y-1.5">
            <p className="text-sm font-semibold text-[var(--civic-text)]">{wardName}</p>
            <p className="text-sm text-[var(--civic-muted)]">{openIssues} open issues</p>
            <p className="text-sm text-[var(--civic-muted)]">{answeredThisMonth} answered in this feed</p>
          </div>
        )}
      </section>

      <section
        className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5"
        style={{ boxShadow: '0 12px 28px rgba(22, 33, 51, 0.06)' }}
      >
        <h2 className="font-display text-[18px] font-bold text-[var(--civic-text)]">Topics</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {topicChips.map((topic) => (
            <span
              key={topic}
              className="inline-flex min-h-8 items-center rounded-full bg-[#f4ead2] px-3.5 text-[13px] font-semibold text-[#132033]"
            >
              {topic}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
