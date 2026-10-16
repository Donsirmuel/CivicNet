import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import { commentsService, postsService } from '../services';
import type { Comment as BackendComment } from '../types';
import type { Post } from '../components/issues/PostCard';
import { convertBackendPostToPost } from '../utils/dataMappers';

interface CommentView {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
    office?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
  replies?: CommentView[];
}

function formatRelativeTime(isoDate: string) {
  const created = new Date(isoDate);
  const diff = Date.now() - created.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function mapComment(comment: BackendComment): CommentView {
  return {
    id: String(comment.id),
    author: {
      name:
        `${comment.author.first_name || ''} ${comment.author.last_name || ''}`.trim() ||
        comment.author.username ||
        'Citizen',
      username: `@${comment.author.username || 'citizen'}`,
      avatar:
        comment.author.avatar ||
        comment.author.profile_picture ||
        '',
      verified: comment.author.role === 'official',
      office: comment.author.jurisdiction || comment.author.location || 'Official office',
    },
    content: comment.content,
    timestamp: formatRelativeTime(comment.created_at),
    likes: comment.likes || 0,
    liked: false,
    replies: (comment.replies || []).map(mapComment),
  };
}

function updateNestedComments(
  comments: CommentView[],
  targetId: string,
  updater: (comment: CommentView) => CommentView,
): CommentView[] {
  return comments.map((comment) => {
    if (comment.id === targetId) return updater(comment);
    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateNestedComments(comment.replies, targetId, updater),
      };
    }
    return comment;
  });
}

const AVATAR_COLORS = ['#6b4f3a', '#0a6a3b', '#b8912f'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1 && parts[0][0] && parts[1][0]) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || 'CI';
}

function isFallbackAvatar(url?: string): boolean {
  if (!url) return true;
  return url.includes('unsplash');
}

function AvatarCircle({ name, seed, size = 'size-11' }: { name: string; seed?: string; size?: string }) {
  return (
    <div
      aria-hidden
      className={`${size} flex shrink-0 items-center justify-center rounded-full text-sm font-bold text-white`}
      style={{ backgroundColor: avatarColor(seed || name) }}
    >
      {initialsFor(name)}
    </div>
  );
}

export default function PostDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [commentText, setCommentText] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const [postData, commentsData] = await Promise.all([
          postsService.getPost(Number(id)),
          commentsService.getPostComments(Number(id)).catch(() => []),
        ]);

        setPost(convertBackendPostToPost(postData));
        setComments(commentsData.map(mapComment));
      } catch (err) {
        console.error('Failed to load post details:', err);
        setComments([]);
        setError('We could not load the full post right now.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const totalComments = useMemo(() => {
    const countComments = (items: CommentView[]): number =>
      items.reduce((total, item) => total + 1 + countComments(item.replies || []), 0);
    return countComments(comments);
  }, [comments]);

  const handleLike = async () => {
    if (!post) return;
    const wasLiked = post.liked;
    const previousLikes = post.stats.likes;

    setPost((current) => {
      if (!current) return current;
      return {
        ...current,
        liked: !current.liked,
        stats: {
          ...current.stats,
          likes: current.liked ? current.stats.likes - 1 : current.stats.likes + 1,
        },
      };
    });

    try {
      if (wasLiked) {
        await postsService.unlikePost(Number(post.id));
      } else {
        await postsService.likePost(Number(post.id));
      }
    } catch (err) {
      console.error('Failed to like post:', err);
      setPost((current) => {
        if (!current) return current;
        return {
          ...current,
          liked: wasLiked,
          stats: { ...current.stats, likes: previousLikes },
        };
      });
    }
  };

  const handleBookmark = () => {
    setPost((current) => {
      if (!current) return current;
      return { ...current, bookmarked: !current.bookmarked };
    });
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `${window.location.origin}/post/${post.id}`;
    setPost((current) => {
      if (!current) return current;
      return {
        ...current,
        stats: { ...current.stats, shares: current.stats.shares + 1 },
      };
    });

    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Unable to copy post link:', err);
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCommentLike = (commentId: string) => {
    setComments((current) =>
      updateNestedComments(current, commentId, (comment) => ({
        ...comment,
        liked: !comment.liked,
        likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
      })),
    );
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !id) return;

    const newComment: CommentView = {
      id: `${Date.now()}`,
      author: {
        name: 'You',
        username: '@you',
        avatar: '',
      },
      content: commentText.trim(),
      timestamp: 'now',
      likes: 0,
      liked: false,
    };

    setComments((current) => [newComment, ...current]);
    setCommentText('');

    try {
      await commentsService.createComment({
        content: newComment.content,
        post_id: Number(id),
      });
    } catch (err) {
      console.error('Failed to save comment:', err);
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentView; depth?: number }) => {
    if (comment.author.verified) {
      return (
        <div className={depth > 0 ? 'ml-5 border-l pl-4 sm:ml-8 sm:pl-5' : ''} style={depth > 0 ? { borderColor: 'var(--civic-border)' } : undefined}>
          <article className="rounded-[16px] border-l-4 bg-[#eef7f0] px-5 py-5" style={{ borderLeftColor: 'var(--civic-primary)' }}>
            <p className="text-[12px] font-bold text-[var(--civic-primary)]">
              Verified reply · {comment.author.name}, {comment.author.office || 'Official office'}
            </p>
            <p className="mt-1 text-xs text-[var(--civic-muted)]">
              {comment.author.username} - {comment.timestamp}
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[var(--civic-muted)]">{comment.content}</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-[var(--civic-muted)]">
              <button
                onClick={() => handleCommentLike(comment.id)}
                className={`inline-flex items-center gap-2 transition ${
                  comment.liked ? 'text-[var(--civic-primary)]' : 'hover:text-[var(--civic-text)]'
                }`}
              >
                <Icon name="thumb_up" filled={comment.liked} className="text-[18px]" />
                <span>Like</span>
                <span className="font-semibold text-[var(--civic-text)]">{comment.likes}</span>
              </button>
            </div>
          </article>

          {comment.replies?.length ? (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return (
    <div className={depth > 0 ? 'ml-5 border-l pl-4 sm:ml-8 sm:pl-5' : ''} style={depth > 0 ? { borderColor: 'var(--civic-border)' } : undefined}>
      <article className="rounded-[16px] border border-[var(--civic-border)] bg-white px-5 py-5">
        <div className="flex items-start gap-3">
          {isFallbackAvatar(comment.author.avatar) ? (
            <AvatarCircle name={comment.author.name} seed={comment.author.username} />
          ) : (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="size-11 rounded-[12px] object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-[var(--civic-text)]">{comment.author.name}</p>
            </div>
            <p className="mt-1 text-xs text-[var(--civic-muted)]">
              {comment.author.username} - {comment.timestamp}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[15px] leading-7 text-[var(--civic-muted)]">{comment.content}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-[var(--civic-muted)]">
          <button
            onClick={() => handleCommentLike(comment.id)}
            className={`inline-flex items-center gap-2 transition ${
              comment.liked ? 'text-[var(--civic-primary)]' : 'hover:text-[var(--civic-text)]'
            }`}
          >
            <Icon name="thumb_up" filled={comment.liked} className="text-[18px]" />
            <span>Like</span>
            <span className="font-semibold text-[var(--civic-text)]">{comment.likes}</span>
          </button>
        </div>
      </article>

      {comment.replies?.length ? (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
    );
  };

  return (
    <StandardLayout showRightSidebar={false}>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}>
        <header className="glass-header sticky top-0 z-20 border-b" style={{ borderColor: 'var(--civic-border)' }}>
          <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="civic-icon-button size-10 rounded-full"
              >
                <Icon name="arrow_back" className="text-lg" />
              </button>
              <div>
                <p className="text-sm font-bold text-[var(--civic-text)]">Post</p>
                <p className="mt-1 text-xs text-[var(--civic-muted)]">Replies and context</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {linkCopied && (
                <span role="status" className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--civic-primary)]" style={{ background: 'var(--civic-primary-glow)' }}>
                  Link copied
                </span>
              )}
              <button
                onClick={handleShare}
                className="civic-icon-button size-10 rounded-full"
                aria-label="Share post"
              >
                <Icon name="share" className="text-base" />
              </button>
              <button
                onClick={handleBookmark}
                className="civic-icon-button size-10 rounded-full"
                aria-label="Save post"
              >
                <Icon name="bookmark" filled={post?.bookmarked} className="text-base" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-6">
            {error && (
              <div className="rounded-md px-5 py-4 text-sm font-medium text-[var(--civic-danger)]" style={{ background: 'rgba(218,92,78,0.12)', boxShadow: 'inset 0 0 0 1px rgba(218,92,78,0.22)' }}>
                {error}
              </div>
            )}

            <article className="overflow-hidden rounded-[20px] border border-[var(--civic-border)] bg-white">
              {isLoading || !post ? (
                <div className="h-80 animate-pulse bg-[var(--civic-surface-strong)]" />
              ) : (
                <>
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title || 'Post image'}
                      className="aspect-[16/8] w-full object-cover"
                    />
                  )}

                  <div className="space-y-5 px-5 py-6 sm:px-6">
                    <div className="flex items-start gap-3">
                      {isFallbackAvatar(post.author.avatar) ? (
                        <AvatarCircle name={post.author.name} seed={post.author.username} size="size-12" />
                      ) : (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="size-12 rounded-[12px] object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-[var(--civic-text)]">{post.author.name}</p>
                          {post.author.verified && (
                            <span className="civic-chip-active">
                              Official
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[var(--civic-muted)]">
                          {post.author.username} - {post.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {post.title && (
                        <h1 className="font-display text-[1.8rem] leading-snug tracking-[-0.02em] text-[var(--civic-text-strong)] sm:text-[2rem]">
                          {post.title}
                        </h1>
                      )}
                      {post.location && (
                        <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--civic-primary)]">
                          <Icon name="location_on" className="text-[16px]" />
                          {post.location.lga}, {post.location.state}
                        </p>
                      )}
                      <p className="text-[15px] leading-8 text-[var(--civic-muted)]">{post.content}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="civic-chip">
                        {post.scope}
                      </span>
                      <span className="civic-chip">
                        {post.type === 'issue' ? 'Report' : 'Update'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t pt-5" style={{ borderColor: 'var(--civic-border)' }}>
                      <div className="rounded-[16px] bg-[var(--civic-surface-strong)] px-3 py-4 sm:px-4">
                        <p className="font-display text-xl tracking-[-0.01em] text-[var(--civic-text)] sm:text-2xl">{post.stats.likes}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">
                          Support
                        </p>
                      </div>
                      <div className="rounded-[16px] bg-[var(--civic-surface-strong)] px-3 py-4 sm:px-4">
                        <p className="font-display text-xl tracking-[-0.01em] text-[var(--civic-text)] sm:text-2xl">{totalComments}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">
                          Comments
                        </p>
                      </div>
                      <div className="rounded-[16px] bg-[var(--civic-surface-strong)] px-3 py-4 sm:px-4">
                        <p className="font-display text-xl tracking-[-0.01em] text-[var(--civic-text)] sm:text-2xl">{post.stats.shares}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">
                          Shares
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 border-t pt-4 text-[12px] text-[var(--civic-muted)]" style={{ borderColor: 'var(--civic-border)' }}>
                      <button
                        onClick={handleLike}
                        className={`inline-flex items-center gap-2 transition ${
                          post.liked ? 'text-[var(--civic-primary)]' : 'hover:text-[var(--civic-text)]'
                        }`}
                      >
                        <Icon name="thumb_up" filled={post.liked} className="text-[18px]" />
                        <span>Support</span>
                      </button>

                      <button
                        onClick={() =>
                          document.getElementById('post-comments')?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="inline-flex items-center gap-2 transition hover:text-[var(--civic-primary)]"
                      >
                        <Icon name="chat_bubble" className="text-[18px]" />
                        <span>Comment</span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-2 transition hover:text-[var(--civic-text)]"
                      >
                        <Icon name="share" className="text-[18px]" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </article>

            <section id="post-comments" className="space-y-4">
              <div className="rounded-[20px] border border-[var(--civic-border)] bg-white px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="civic-label">Replies</p>
                    <p className="mt-2 font-display text-xl tracking-[-0.01em] text-[var(--civic-text)]">Replies and comments</p>
                    <p className="mt-2 text-sm text-[var(--civic-muted)]">Reply or leave a quick follow-up.</p>
                  </div>
                  <span className="civic-chip">{totalComments} total</span>
                </div>

                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="mt-4 w-full resize-none rounded-[12px] bg-[var(--civic-surface-strong)] px-4 py-4 text-[15px] leading-7 text-[var(--civic-text)] outline-none transition"
                  style={{ boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[var(--civic-muted)]">
                    <button className="civic-icon-button size-9" aria-label="Add image">
                      <Icon name="image" className="text-[18px]" />
                    </button>
                    <button className="civic-icon-button size-9" aria-label="Attach file">
                      <Icon name="attach_file" className="text-[18px]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!commentText.trim()) return;
                        if (window.confirm('Clear this reply? Your draft will be removed.')) {
                          setCommentText('');
                        }
                      }}
                      className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-[var(--civic-text)] transition hover:brightness-[0.98]"
                      style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                    >
                      Clear
                    </button>
                    <Button variant="primary" onClick={handleCommentSubmit}>
                      Send reply
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {!comments.length && (
                  <div className="rounded-[20px] border border-[var(--civic-border)] bg-white px-5 py-8 text-center">
                    <p className="text-sm font-bold text-[var(--civic-text)]">No comments yet</p>
                    <p className="mt-1 text-sm text-[var(--civic-muted)]">If you know something about this, say it above.</p>
                  </div>
                )}
                {comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-[96px] xl:self-start">
              {post && (
              <>
              <section className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5">
                <p className="civic-label">About this post</p>
                <div className="mt-4 space-y-3 text-sm text-[var(--civic-muted)]">
                  <div className="flex items-start justify-between gap-3">
                    <span>Type</span>
                    <span className="font-semibold text-[var(--civic-text)]">{post.type === 'issue' ? 'Report' : 'Update'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Area</span>
                    <span className="font-semibold text-[var(--civic-text)]">{post.scope}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>Posted</span>
                    <span className="font-semibold text-[var(--civic-text)]">{post.timestamp}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5">
                <p className="civic-label">Location</p>
                <div className="mt-4 rounded-[16px] bg-[var(--civic-surface-strong)] px-4 py-4">
                  <div className="flex items-center gap-2 text-[var(--civic-primary)]">
                    <Icon name="location_on" className="text-[18px]" />
                    <span className="text-sm font-semibold text-[var(--civic-text)]">
                      {post.location ? `${post.location.lga}, ${post.location.state}` : 'Location not added'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5">
                <p className="civic-label">Activity</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[16px] bg-[var(--civic-surface-strong)] px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Support</p>
                    <p className="mt-2 font-display text-2xl tracking-[-0.02em] text-[var(--civic-text)]">{post.stats.likes}</p>
                  </div>
                  <div className="rounded-[16px] bg-[var(--civic-surface-strong)] px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">Replies</p>
                    <p className="mt-2 font-display text-2xl tracking-[-0.02em] text-[var(--civic-text)]">{totalComments}</p>
                  </div>
                </div>
              </section>
              </>
              )}
            </aside>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}

