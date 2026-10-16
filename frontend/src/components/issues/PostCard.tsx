import type { CSSProperties, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocationString } from '../../data/locationData';

export type IssueStatus = 'reported' | 'under_review' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory =
  | 'infrastructure'
  | 'safety'
  | 'health'
  | 'environment'
  | 'education'
  | 'transportation'
  | 'utilities'
  | 'other';

export interface Post {
  title?: string;
  id: string;
  type: 'post' | 'issue';
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
    role?: 'citizen' | 'official';
    id?: string;
  };
  content: string;
  image?: string;
  scope: 'local' | 'state' | 'national';
  timestamp: string;
  daysWaiting?: number;
  escalationLevel?: 'ward' | 'lga' | 'state' | 'federal';
  escalatedAt?: string;
  stats: {
    comments: number;
    shares: number;
    likes: number;
  };
  liked?: boolean;
  bookmarked?: boolean;
  issueStatus?: IssueStatus;
  issueCategory?: IssueCategory;
  location?: {
    ward: string;
    lga: string;
    state: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  };
  officialReply?: {
    name: string;
    office?: string;
    text: string;
    date?: string;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;
  escalationLevel?: string;
}

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

function formatCategory(category: IssueCategory) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getScopeLabel(scope: Post['scope']) {
  if (scope === 'local') return 'LGA';
  if (scope === 'state') return 'State';
  return 'National';
}

const ESCALATION_LABELS: Record<NonNullable<Post['escalationLevel']>, string> = {
  ward: 'Ward',
  lga: 'LGA',
  state: 'State',
  federal: 'Federal',
};

const STATUS_STEPS = ['Reported', 'Seen', 'Assigned', 'In progress', 'Resolved'] as const;

export function getIssueStepIndex(issueStatus?: IssueStatus, assignedTo?: Post['assignedTo']): number {
  let base: number;
  switch (issueStatus) {
    case 'under_review':
      base = 1;
      break;
    case 'in_progress':
      base = 3;
      break;
    case 'resolved':
    case 'closed':
      base = 4;
      break;
    case 'reported':
    default:
      base = 0;
      break;
  }
  if (assignedTo && issueStatus !== 'reported') {
    base = Math.max(base, 2);
  }
  return base;
}

/**
 * Parse a relative timestamp ("Just now", "2h ago", "12 days ago", ...)
 * into a Day N accountability counter. Day 1 = reported today,
 * Day N = full days elapsed + 1. Returns null when unparseable so the
 * caller can hide the counter.
 */
export function parseRelativeTimestampToDay(timestamp: string): number | null {
  const text = timestamp.toLowerCase().trim();
  if (!text) return null;
  if (text.includes('just now') || text === 'now' || text.includes('a moment ago')) return 1;
  if (text.includes('yesterday')) return 2;

  const numMatch = text.match(/(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|[smhd])/);
  if (!numMatch) return null;
  const value = parseInt(numMatch[1], 10);
  const unit = numMatch[2];
  if (Number.isNaN(value)) return null;

  if (/^(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)$/.test(unit)) {
    return 1;
  }
  let elapsedDays: number;
  if (unit.startsWith('day') || unit === 'd') elapsedDays = value;
  else if (unit.startsWith('week') || unit === 'w') elapsedDays = value * 7;
  else if (unit.startsWith('month')) elapsedDays = value * 30;
  else if (unit.startsWith('year')) elapsedDays = value * 365;
  else return null;
  return Math.max(1, elapsedDays + 1);
}

export function getDayNFromDate(createdAt: string | Date): number | null {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const time = created.getTime();
  if (Number.isNaN(time)) return null;
  const elapsedDays = Math.floor((Date.now() - time) / 86400000);
  return Math.max(1, elapsedDays + 1);
}

export default function PostCard({ post, onLike, onComment, onShare, onBookmark, escalationLevel }: PostCardProps) {
  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(post.type === 'issue' ? `/issue/${post.id}` : `/post/${post.id}`);
  };

  const handleProfileClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (post.author.role === 'official') {
      navigate(`/profile/official/${post.author.id || post.id}`);
      return;
    }
    navigate('/profile');
  };

  const stopAndRun =
    (callback?: (id: string) => void) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      callback?.(post.id);
    };

  const locationLabel = post.location ? getLocationString(post.location) : null;
  const categoryLabel = post.issueCategory ? formatCategory(post.issueCategory) : null;
  const dayN =
    post.type === 'issue'
      ? (typeof post.daysWaiting === 'number' && Number.isFinite(post.daysWaiting)
          ? Math.max(1, Math.floor(post.daysWaiting))
          : parseRelativeTimestampToDay(post.timestamp))
      : null;
  const daySuffix = dayN !== null ? ` · Day ${dayN}` : '';
  const statusStep = post.type === 'issue' ? getIssueStepIndex(post.issueStatus, post.assignedTo) : -1;

  const isResolved = post.issueStatus === 'resolved' || post.issueStatus === 'closed';
  const isOfficialAuthor = post.author.role === 'official';
  const replyText = post.officialReply?.text?.trim() ? post.officialReply.text.trim() : null;

  let chipLabel: string;
  let chipBackground: string;
  let chipColor: string;
  if (post.type === 'issue') {
    if (isResolved) {
      chipLabel = 'Resolved';
      chipBackground = 'rgba(10,106,59,.12)';
      chipColor = '#0a6a3b';
    } else if (post.assignedTo || isOfficialAuthor) {
      chipLabel = `In progress${daySuffix}`;
      chipBackground = '#f4ead2';
      chipColor = '#132033';
    } else {
      chipLabel = `No reply${daySuffix}`;
      chipBackground = 'rgba(218,92,78,.12)';
      chipColor = '#da5c4e';
    }
  } else {
    chipLabel = 'Update';
    chipBackground = 'var(--civic-surface-inset)';
    chipColor = 'var(--civic-muted)';
  }

  const showVerifiedReply = replyText !== null || isOfficialAuthor;
  const replyName = post.officialReply?.name ?? post.author.name;
  const replyOffice = post.officialReply?.office ?? post.assignedTo?.role ?? (isOfficialAuthor ? 'Official' : '');
  const replyBody = replyText ?? post.content;
  const replyDate = post.officialReply?.date ?? post.timestamp;

  const escalationLabel = post.escalationLevel ? (ESCALATION_LABELS[post.escalationLevel] ?? null) : null;
  const escalationTarget = escalationLevel ?? escalationLabel ?? post.assignedTo?.name ?? (post.scope !== 'local' ? getScopeLabel(post.scope) : null);
  const showEscalated = !showVerifiedReply && post.assignedTo && escalationTarget;

  return (
    <article
      onClick={handleOpen}
      className="rounded-[20px] border border-[var(--civic-border)] bg-white px-5 py-5"
      style={{ boxShadow: '0 12px 28px rgba(22, 33, 51, 0.06)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={handleProfileClick} className="shrink-0" aria-label={`View ${post.author.name}`}>
            <span
              className="flex size-11 items-center justify-center rounded-full text-[15px] font-bold text-white"
              style={{ background: getAvatarColor(post.author.name) }}
              aria-hidden="true"
            >
              {getInitials(post.author.name)}
            </span>
          </button>
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleProfileClick}
              className="block truncate text-left text-[15px] font-bold text-[var(--civic-text)]"
            >
              {post.author.name}
            </button>
            <p className="mt-0.5 truncate text-[13px] text-[var(--civic-muted)]">
              {post.author.username} · {post.timestamp}
            </p>
          </div>
        </div>

        <span
          className="inline-flex min-h-7 shrink-0 items-center rounded-full px-3 text-[11px] font-semibold"
          style={{ background: chipBackground, color: chipColor }}
        >
          {chipLabel}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {post.title && (
          <h3 className="font-display text-[20px] font-bold leading-snug text-[var(--civic-text-strong)]">
            {post.title}
          </h3>
        )}
        <p className="text-[15px] leading-7 text-[var(--civic-muted)]">{post.content}</p>
        {post.type === 'issue' && statusStep >= 0 && (
          <div
            aria-label={`Status: ${STATUS_STEPS[statusStep]}, step ${statusStep + 1} of 5`}
            className="flex items-start"
            style={{ maxHeight: 34, minHeight: 34, overflow: 'hidden' }}
          >
            {STATUS_STEPS.map((label, i) => {
              const isDone = i < statusStep;
              const isCurrent = i === statusStep;
              const dotStyle: CSSProperties = isDone
                ? { width: 10, height: 10, borderRadius: 9999, background: '#0a6a3b', flexShrink: 0 }
                : isCurrent
                  ? {
                      width: 10,
                      height: 10,
                      borderRadius: 9999,
                      background: '#fff',
                      border: '2px solid #d4a540',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                    }
                  : { width: 10, height: 10, borderRadius: 9999, background: '#e5ddcb', flexShrink: 0 };
              return (
                <div key={label} className={i < STATUS_STEPS.length - 1 ? 'flex min-w-0 flex-1 items-start' : 'flex min-w-0 items-start'} aria-hidden="true">
                  <div className="flex shrink-0 flex-col items-center" style={{ width: 56 }}>
                    <span style={dotStyle} />
                    <span
                      style={{
                        marginTop: 4,
                        fontSize: 9,
                        lineHeight: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        color: isCurrent ? '#132033' : 'var(--civic-muted)',
                        fontWeight: isCurrent ? 700 : 500,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className="mx-1 min-w-2 flex-1"
                      style={{
                        height: 2,
                        marginTop: 4,
                        borderRadius: 2,
                        background: i < statusStep ? '#0a6a3b' : '#e5ddcb',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {(locationLabel || categoryLabel) && (
          <p className="text-[13px] font-semibold text-[#0a6a3b]">
            {locationLabel}
            {locationLabel && categoryLabel ? ' · ' : ''}
            {categoryLabel}
          </p>
        )}
        {showEscalated && (
          <p className="text-[13px] font-semibold" style={{ color: '#da5c4e' }}>
            Escalated to {escalationTarget}
          </p>
        )}
      </div>

      {post.image && (
        <div className="mt-4 overflow-hidden rounded-[20px]">
          <img className="aspect-[16/9] w-full object-cover" src={post.image} alt="Post content" />
        </div>
      )}

      {showVerifiedReply && (
        <div
          className="mt-4 rounded-r-[12px] rounded-l-md px-4 py-3"
          style={{ background: 'rgba(10,106,59,.07)', borderLeft: '3px solid #0a6a3b' }}
        >
          <p className="text-[13px] font-bold text-[#0a6a3b]">
            Verified reply · {replyName}
            {replyOffice ? `, ${replyOffice}` : ''}
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--civic-muted)]">
            {replyBody} · {replyDate}
          </p>
        </div>
      )}

      <div
        className="mt-4 flex items-center justify-between border-t pt-3"
        style={{ borderColor: 'var(--civic-border)' }}
      >
        <div className="flex items-center gap-4 text-[13px] text-[var(--civic-muted)]">
          <button
            type="button"
            onClick={stopAndRun(onLike)}
            aria-label={post.liked ? 'Remove support' : 'Support this'}
            className={post.liked ? 'font-bold text-[#0a6a3b]' : 'font-medium hover:text-[var(--civic-text)]'}
          >
            Support · {post.stats.likes}
          </button>
          <button
            type="button"
            onClick={stopAndRun(onComment)}
            className="font-medium hover:text-[var(--civic-text)]"
          >
            Comments · {post.stats.comments}
          </button>
          <button
            type="button"
            onClick={stopAndRun(onShare)}
            className="font-medium hover:text-[var(--civic-text)]"
          >
            Share
          </button>
        </div>
        <button
          type="button"
          onClick={stopAndRun(onBookmark)}
          aria-label={post.bookmarked ? 'Remove bookmark' : 'Save post'}
          className={`text-[13px] hover:text-[var(--civic-text)] ${post.bookmarked ? 'font-bold text-[#0a6a3b]' : 'font-medium text-[var(--civic-muted)]'}`}
        >
          {post.bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  );
}
