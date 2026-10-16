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

// Neutral institutional palette — one accent color for actions/status
const ACCENT = '#14323F'; // deep teal-navy
const ACCENT_HOVER = '#0f2730';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const SURFACE = '#FFFFFF';
const PAGE = '#F9FAFB';
const STATUS_GREEN = '#4A7C59';
const STATUS_AMBER = '#B45309';

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

/** Day N accountability counter — parsed from backend days_waiting or relative timestamp. */
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

  // Day N: backend days_waiting is authoritative when present
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
      chipBackground = 'rgba(74,124,89,.10)';
      chipColor = STATUS_GREEN;
    } else if (post.assignedTo || isOfficialAuthor) {
      chipLabel = `In progress${daySuffix}`;
      chipBackground = 'rgba(20,50,63,.08)';
      chipColor = ACCENT;
    } else {
      chipLabel = `No reply${daySuffix}`;
      chipBackground = 'rgba(218,92,78,.10)';
      chipColor = STATUS_AMBER;
    }
  } else {
    chipLabel = 'Update';
    chipBackground = '#F3F4F6';
    chipColor = MUTED;
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
      className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-5 py-5"
    >
      {/* Header row: avatar + name + date */}
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
              className="block truncate text-left text-[13px] font-semibold text-[#111827]"
            >
              {post.author.name}
            </button>
            <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">
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

      {/* Title */}
      {post.title && (
        <h3 className="mt-4 text-[16px] font-semibold leading-snug text-[#111827]">
          {post.title}
        </h3>
      )}

      {/* Body */}
      <p className="mt-2 text-[14px] leading-7 text-[#374151]">{post.content}</p>

      {/* Status micro-trail */}
      {post.type === 'issue' && statusStep >= 0 && (
        <div
          aria-label={`Status: ${STATUS_STEPS[statusStep]}, step ${statusStep + 1} of 5`}
          className="flex items-start mt-3"
          style={{ maxHeight: 30, minHeight: 30, overflow: 'hidden' }}
        >
          {STATUS_STEPS.map((label, i) => {
            const isDone = i < statusStep;
            const isCurrent = i === statusStep;
            const dotStyle: CSSProperties = isDone
              ? { width: 6, height: 6, borderRadius: 9999, background: ACCENT, flexShrink: 0 }
              : isCurrent
                ? {
                      width: 6,
                      height: 6,
                      borderRadius: 9999,
                      background: '#FFF',
                      border: `2px solid ${ACCENT}`,
                      boxSizing: 'border-box',
                      flexShrink: 0,
                    }
                : { width: 6, height: 6, borderRadius: 9999, background: '#E5E7CB', flexShrink: 0 };
            return (
              <div key={label} className={i < STATUS_STEPS.length - 1 ? 'flex min-w-0 flex-1 items-start' : 'flex min-w-0 items-start'} aria-hidden="true">
                <div className="flex shrink-0 flex-col items-center" style={{ width: 52 }}>
                  <span style={dotStyle} />
                  <span
                    style={{
                      marginTop: 3,
                      fontSize: 10,
                      lineHeight: 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      color: isCurrent ? '#14323F' : '#6B7280',
                      fontWeight: isCurrent ? 700 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className="mx-1 min-w-2 flex-1"
                    style={{
                      height: 1,
                      marginTop: 4.5,
                      borderRadius: 2,
                      background: i < statusStep ? '#14323F' : '#E5E7CB',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Location + category */}
      {(locationLabel || categoryLabel) && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#6B7280]">
            {locationLabel}
          </span>
          {categoryLabel && (
            <span className="inline-flex items-center rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-semibold text-[#4B5563]">
              {categoryLabel}
            </span>
          )}
        </div>
      )}

      {/* Escalation note */}
      {showEscalated && (
        <p className="mt-1 text-[11px] font-semibold text-[#6B7280]">
          Escalated to {escalationTarget}
        </p>
      )}

      {post.image && (
        <div className="mt-4 overflow-hidden rounded-xl">
          <img className="aspect-[16/9] w-full object-cover" src={post.image} alt="Post content" />
        </div>
      )}

      {/* Verified reply block */}
      {showVerifiedReply && (
        <div
          className="mt-4 rounded-r-[12px] rounded-l-md px-4 py-3"
          style={{ background: 'rgba(74,124,89,.07)', borderLeft: '3px solid #4A7C59' }}
        >
          <p className="text-[13px] font-bold text-[#4A7C59]">
            Verified reply · {replyName}
            {replyOffice ? `, ${replyOffice}` : ''}
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[#6B7280]">
            {replyBody} · {replyDate}
          </p>
        </div>
      )}

      {/* Action row */}
      <div
        className="mt-4 flex items-center justify-between border-t pt-3"
        style={{ borderColor: '#E5E7EB' }}
      >
        <div className="flex items-center gap-4 text-[13px] text-[#6B7280]">
          <button
            type="button"
            onClick={stopAndRun(onLike)}
            aria-label={post.liked ? 'Remove support' : 'Support this'}
            className={post.liked ? 'font-bold text-[#14323F]' : 'font-medium hover:text-[#14323F]'}
          >
            Support · {post.stats.likes}
          </button>
          <button
            type="button"
            onClick={stopAndRun(onComment)}
            className="font-medium hover:text-[#14323F]"
          >
            Comments · {post.stats.comments}
          </button>
          <button
            type="button"
            onClick={stopAndRun(onShare)}
            className="font-medium hover:text-[#14323F]"
          >
            Share
          </button>
        </div>
        <button
          type="button"
          onClick={stopAndRun(onBookmark)}
          aria-label={post.bookmarked ? 'Remove bookmark' : 'Save post'}
          className={`text-[13px] hover:text-[#14323F] ${post.bookmarked ? 'font-bold text-[#14323F]' : 'font-medium text-[#6B7280]'}`}
        >
          {post.bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ? parts[0][0] : '';
  const second = parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : '';
  return `${first}${second}`.toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  // Neutral institutional avatar colors — slate/gold cycle
  const COLORS = ['#a87b5a', '#0a6a3b', '#31572c'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % 2147483647;
  }
  return COLORS[hash % COLORS.length] ?? COLORS[0] ?? '#0a6a3b';
}
