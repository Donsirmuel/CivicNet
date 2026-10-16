import type{ Issue, Post as BackendPost } from '../types';
import type{ Post } from '../components/issues/PostCard';

/**
 * Convert backend Issue to frontend Post format
 */
export const convertIssueToPost = (issue: Issue): Post => {
  const createdByRole = issue.created_by.role === 'official' ? 'official' : 'citizen';
  return {
    id: String(issue.id),
    title: issue.title,
    type: 'issue',
    author: {
      id: String(issue.created_by.id),
      name: `${issue.created_by.first_name} ${issue.created_by.last_name}`.trim() || issue.created_by.username,
      username: `@${issue.created_by.username}`,
      avatar: '', // Empty: PostCard renders initials avatar
      verified: createdByRole === 'official',
      role: createdByRole,
    },
    content: issue.description,
    image: issue.image_url,
    scope: issue.scope,
    timestamp: formatTime(new Date(issue.created_at)),
    daysWaiting: issue.days_waiting,
    escalationLevel: issue.escalation_level,
    escalatedAt: issue.escalated_at,
    officialReply: deriveOfficialReply(issue),
    stats: {
      comments: issue.comment_count || 0,
      shares: 0,
      likes: issue.upvotes || 0,
    },
    liked: false,
    bookmarked: false,
    issueStatus: issue.status,
    issueCategory: issue.category,
    location: {
      state: issue.state,
      lga: issue.lga,
      ward: issue.ward,
    },
    priority: issue.priority,
    assignedTo: issue.assigned_to ? {
      id: String(issue.assigned_to.id),
      name: `${issue.assigned_to.first_name} ${issue.assigned_to.last_name}`.trim() || issue.assigned_to.username,
      role: 'official',
    } : undefined,
  };
};

/**
 * Convert backend Post to frontend Post format
 */
export const convertBackendPostToPost = (backendPost: BackendPost): Post => {
  const authorRole = backendPost.author.role === 'official' ? 'official' : 'citizen';
  return {
    id: String(backendPost.id),
    type: 'post',
    author: {
      id: String(backendPost.author.id),
      name: `${backendPost.author.first_name} ${backendPost.author.last_name}`.trim() || backendPost.author.username,
      username: `@${backendPost.author.username}`,
      avatar: '', // Empty: PostCard renders initials avatar
      verified: authorRole === 'official',
      role: authorRole,
    },
    content: backendPost.content,
    image: backendPost.image_url,
    scope: 'local', // Default scope for posts
    timestamp: formatTime(new Date(backendPost.created_at)),
    stats: {
      comments: backendPost.comments || 0,
      shares: backendPost.shares || 0,
      likes: backendPost.likes || 0,
    },
    liked: false,
    bookmarked: false,
  };
};

/**
 * Format timestamp to relative time (e.g., "2h", "3d")
 */
export const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${Math.floor(diffMonths / 12)}y`;
};

/**
 * Display name for a backend user: "First Last", falling back to username.
 */
const displayNameOf = (user: { first_name?: string; last_name?: string; username: string }): string =>
  `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username;

/**
 * Derive the latest official reply for an issue from its status_history and
 * comments_list (including nested replies). Only entries written by a user
 * with role 'official' and non-empty text qualify; system notes with no
 * author are ignored. Returns undefined when there is no official reply, so
 * PostCard keeps its current rendering.
 */
export const deriveOfficialReply = (issue: Issue): Post['officialReply'] | undefined => {
  const candidates: Array<{ time: number; name: string; office?: string; text: string; date: string }> = [];

  for (const entry of issue.status_history ?? []) {
    const updater = entry.updated_by;
    if (!updater || updater.role !== 'official') continue;
    const text = entry.note?.trim();
    if (!text) continue;
    const time = new Date(entry.created_at).getTime();
    if (Number.isNaN(time)) continue;
    candidates.push({
      time,
      name: displayNameOf(updater),
      office: updater.jurisdiction?.trim() ? updater.jurisdiction : 'Official',
      text,
      date: formatTime(new Date(entry.created_at)),
    });
  }

  const visitComments = (list?: Issue['comments_list']): void => {
    for (const comment of list ?? []) {
      const author = comment.author;
      const text = comment.content?.trim();
      if (author?.role === 'official' && text) {
        const time = new Date(comment.created_at).getTime();
        if (!Number.isNaN(time)) {
          candidates.push({
            time,
            name: displayNameOf(author),
            office: author.jurisdiction?.trim() ? author.jurisdiction : 'Official',
            text,
            date: formatTime(new Date(comment.created_at)),
          });
        }
      }
      if (comment.replies?.length) visitComments(comment.replies);
    }
  };
  visitComments(issue.comments_list);

  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => b.time - a.time);
  const latest = candidates[0];
  if (!latest) return undefined;
  return { name: latest.name, office: latest.office, text: latest.text, date: latest.date };
};

/**
 * Whole days between two ISO timestamps. Floored, minimum 1, null on invalid.
 */
export const daysBetween = (fromIso: string, toIso?: string): number | null => {
  const from = new Date(fromIso);
  const to = toIso ? new Date(toIso) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  const diffDays = Math.floor((to.getTime() - from.getTime()) / 86400000);
  return Math.max(1, diffDays);
};
