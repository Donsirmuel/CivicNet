import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLocationString } from '../../data/locationData';
import { Icon } from '../common';

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
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;
}

const statusConfig: Record<IssueStatus, { label: string; className: string }> = {
  reported: { label: 'Reported', className: 'bg-[rgba(212,165,64,0.14)] text-[var(--civic-gold)]' },
  under_review: { label: 'In Review', className: 'bg-[var(--civic-primary-glow)] text-[var(--civic-primary)]' },
  in_progress: { label: 'In Progress', className: 'bg-[var(--civic-primary-glow)] text-[var(--civic-primary)]' },
  resolved: { label: 'Resolved', className: 'bg-[var(--civic-primary-glow)] text-[var(--civic-primary)]' },
  closed: { label: 'Closed', className: 'bg-[rgba(255,255,255,0.08)] text-[var(--civic-muted)]' },
};

const categoryIcons: Record<IssueCategory, string> = {
  infrastructure: 'construction',
  safety: 'security',
  health: 'health_and_safety',
  environment: 'eco',
  education: 'school',
  transportation: 'directions_bus',
  utilities: 'bolt',
  other: 'more_horiz',
};

function getAccent(post: Post) {
  if (post.type !== 'issue') return 'var(--civic-primary)';
  if (post.priority === 'urgent') return 'var(--civic-danger)';
  if (post.priority === 'high') return '#d88d40';
  if (post.priority === 'medium') return 'var(--civic-gold)';
  if (post.issueStatus === 'resolved' || post.issueStatus === 'closed') return 'var(--civic-primary)';
  return 'var(--civic-primary)';
}

function getScopeLabel(scope: Post['scope']) {
  if (scope === 'local') return 'LGA';
  if (scope === 'state') return 'State';
  return 'National';
}

function formatCategory(category: IssueCategory) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatPriority(priority?: Post['priority']) {
  if (!priority) return null;
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export default function PostCard({ post, onLike, onComment, onShare, onBookmark }: PostCardProps) {
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
  const accentColor = getAccent(post);

  return (
    <article
      onClick={handleOpen}
      className="group overflow-hidden rounded-[28px] border border-[var(--civic-border)] transition duration-300 hover:-translate-y-0.5"
      style={{ background: 'linear-gradient(180deg, var(--civic-surface) 0%, var(--civic-surface-soft) 100%)', boxShadow: '0 20px 40px -34px rgba(22, 33, 51, 0.24)' }}
    >
      <div className="h-[1px] w-full" style={{ background: accentColor, opacity: 0.7 }} />

      <div className="space-y-5 px-5 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3.5">
            <button type="button" onClick={handleProfileClick} className="shrink-0">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="size-11 rounded-[14px] object-cover"
              />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="truncate text-left text-[15px] font-black tracking-[-0.02em] text-[var(--civic-text)]"
                >
                  {post.author.name}
                </button>
                {post.author.role === 'official' && (
                  <span className="civic-chip-active">
                    <Icon name="workspace_premium" className="text-[14px]" />
                    Official
                  </span>
                )}
                <span className="civic-chip">{getScopeLabel(post.scope)}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--civic-muted)]">
                <span>{post.author.username}</span>
                <span>·</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={stopAndRun(onBookmark)}
            className="civic-icon-button size-9"
            aria-label={post.bookmarked ? 'Remove bookmark' : 'Save post'}
          >
            <Icon name="bookmark" filled={post.bookmarked} className="text-[18px]" />
          </button>
        </div>

        {post.type === 'issue' && (
          <div className="flex flex-wrap gap-2">
            {post.issueStatus && (
              <span
                className={`inline-flex min-h-7 items-center rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusConfig[post.issueStatus].className}`}
              >
                {statusConfig[post.issueStatus].label}
              </span>
            )}
            {post.issueCategory && (
              <span className="civic-chip">
                <Icon name={categoryIcons[post.issueCategory]} className="text-[14px]" />
                {formatCategory(post.issueCategory)}
              </span>
            )}
            {formatPriority(post.priority) && (
              <span className="civic-chip">
                <Icon name="priority_high" className="text-[14px]" />
                {formatPriority(post.priority)}
              </span>
            )}
          </div>
        )}

        <div className="space-y-3">
          {post.title && (
            <h3 className="max-w-3xl text-[1.15rem] font-black leading-tight tracking-[-0.03em] text-[var(--civic-text-strong)] sm:text-[1.3rem]">
              {post.title}
            </h3>
          )}
          <p className="max-w-3xl text-[15px] leading-7 text-[var(--civic-muted)]">{post.content}</p>
        </div>

        {(locationLabel || post.assignedTo) && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-[var(--civic-muted)]">
            {locationLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="location_on" className="text-[16px] text-[var(--civic-primary)]" />
                {locationLabel}
              </span>
            )}

            {post.assignedTo && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="account_balance" className="text-[16px] text-[var(--civic-primary)]" />
                {post.assignedTo.name}
              </span>
            )}
          </div>
        )}

        {post.image && (
          <div className="overflow-hidden rounded-[20px]" style={{ background: 'var(--civic-surface-strong)' }}>
            <img
              className="aspect-[16/9] w-full object-cover transition duration-300 group-hover:scale-[1.01]"
              src={post.image}
              alt="Post content"
            />
          </div>
        )}

        <div
          className="flex flex-wrap items-center gap-4 border-t pt-4 text-[12px]"
          style={{ borderColor: 'var(--civic-border)' }}
        >
          <button
            type="button"
            onClick={stopAndRun(onLike)}
            className={`inline-flex items-center gap-2 transition ${
              post.liked ? 'text-[var(--civic-primary)]' : 'text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
            }`}
          >
            <Icon name="favorite" filled={post.liked} className="text-[18px]" />
            <span className="font-semibold">{post.stats.likes}</span>
          </button>

          <button
            type="button"
            onClick={stopAndRun(onComment)}
            className="inline-flex items-center gap-2 text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
          >
            <Icon name="chat_bubble" className="text-[18px]" />
            <span className="font-semibold">{post.stats.comments}</span>
          </button>

          <button
            type="button"
            onClick={stopAndRun(onShare)}
            className="inline-flex items-center gap-2 text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
          >
            <Icon name="share" className="text-[18px]" />
            <span className="font-semibold">{post.stats.shares}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
