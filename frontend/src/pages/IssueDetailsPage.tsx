import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/common';
import type { IssueStatus } from '../components/issues/PostCard';
import StandardLayout from '../layouts/StandardLayout';
import { getLocationString } from '../data/locationData';
import { commentsService, issuesService, usersService } from '../services';
import { convertIssueToPost, daysBetween, formatTime, getDayNFromDate } from '../utils/dataMappers';
import type { Comment as ApiComment, Issue, StatusHistory, User } from '../types';

const statusConfig: Record<IssueStatus, { label: string; icon: string; color: string }> = {
  reported: { label: 'Reported', icon: 'flag', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  under_review: { label: 'Under review', icon: 'visibility', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  in_progress: { label: 'In progress', icon: 'autorenew', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  resolved: { label: 'Resolved', icon: 'check_circle', color: 'bg-green-100 text-green-700 border-green-300' },
  closed: { label: 'Closed', icon: 'cancel', color: 'bg-slate-100 text-slate-600 border-slate-300' },
};

export default function IssueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [issue, setIssue] = useState<Issue | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const commentBoxRef = useRef<HTMLTextAreaElement>(null);

  const isOfficial = currentUser?.role === 'official';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await usersService.getCurrentUser();
        setCurrentUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const eventName = usersService.getUserUpdatedEventName();
    const handleUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<User>;
      if (customEvent.detail) {
        setCurrentUser(customEvent.detail);
      }
    };

    window.addEventListener(eventName, handleUserUpdated as EventListener);
    return () => window.removeEventListener(eventName, handleUserUpdated as EventListener);
  }, []);

  const refetchIssueAndHistory = async () => {
    if (!id) return;
    const [issueData, historyData] = await Promise.all([
      issuesService.getIssue(parseInt(id, 10)),
      issuesService.getStatusHistory(parseInt(id, 10)),
    ]);
    setIssue(issueData);
    setStatusHistory(historyData);
  };

  useEffect(() => {
    const fetchIssueDetails = async () => {
      if (!id) {
        setError("We couldn't find that report.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await refetchIssueAndHistory();
      } catch (err) {
        setError('We could not open this report. Check your connection and try again.');
        console.error('Error fetching issue details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      if (!id) return;
      try {
        setCommentsLoading(true);
        setCommentError(null);
        const items = await commentsService.getIssueComments(parseInt(id, 10));
        setComments(items);
      } catch (err) {
        console.error('Error fetching issue comments:', err);
        setCommentError('We could not load the replies. Try again.');
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchIssueDetails();
    fetchComments();
  }, [id]);

  const issueView = useMemo(() => (issue ? convertIssueToPost(issue) : null), [issue]);
  const dayN = useMemo(() => (issue ? getDayNFromDate(issue.created_at) : null), [issue]);
  const scopeLabel = issue ? (issue.scope === 'local' ? 'LGA' : issue.scope === 'state' ? 'State' : 'National') : null;

  const formatShortDate = (iso: string): string | null => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const resolutionBanner = useMemo(() => {
    if (!issue) return null;
    if (issue.status !== 'resolved' && issue.status !== 'closed') return null;
    if (statusHistory.length < 1) return null;

    const firstDate = statusHistory[0]?.created_at || issue.created_at;
    const lastDate = statusHistory[statusHistory.length - 1]?.created_at || issue.updated_at;
    const days = daysBetween(firstDate, lastDate) ?? daysBetween(issue.created_at, issue.updated_at);

    const reported = formatShortDate(issue.created_at);
    const resolved = formatShortDate(lastDate) || formatShortDate(issue.updated_at);
    if (!reported || !resolved) return null;

    const verifier = statusHistory[statusHistory.length - 1]?.updated_by || issue.assigned_to;
    const verifierName = verifier
      ? `${verifier.first_name || ''} ${verifier.last_name || ''}`.trim() || verifier.username
      : null;

    const fixedPart = days !== null ? `Fixed in ${days} day${days === 1 ? '' : 's'}${verifierName ? ` by ${verifierName}` : ''}. ` : verifierName ? `Verified by ${verifierName}. ` : '';
    return `Reported ${reported} → resolved ${resolved} · ${fixedPart}The record stays.`;
  }, [issue, statusHistory]);

  const handleCommentSubmit = async () => {
    const text = commentText.trim();
    if (!text || !id || postingComment) return;
    try {
      setPostingComment(true);
      setCommentError(null);
      const created = await commentsService.createComment({
        content: text,
        issue_id: parseInt(id, 10),
      });
      setComments((current) => [created, ...current]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      setCommentError('Your reply did not send. Try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleTakeIssue = async () => {
    if (!id || actionLoading) return;
    try {
      setActionLoading('take');
      setActionError(null);
      await issuesService.assignIssueToMe(parseInt(id, 10));
      await refetchIssueAndHistory();
    } catch (err) {
      console.error('Failed to take issue:', err);
      setActionError('Could not assign this report to you. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplyFocus = () => {
    commentBoxRef.current?.focus();
    commentBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleResolveIssue = async () => {
    if (!id || actionLoading) return;
    const note = window.prompt('Add a resolution note (optional):', '');
    if (note === null) return;
    try {
      setActionLoading('resolve');
      setActionError(null);
      await issuesService.updateIssueStatus(parseInt(id, 10), 'resolved', note || undefined);
      await refetchIssueAndHistory();
    } catch (err) {
      console.error('Failed to resolve issue:', err);
      setActionError('Could not mark this report as resolved. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscalateIssue = async () => {
    if (!id || actionLoading) return;
    try {
      setActionLoading('escalate');
      setActionError(null);
      await issuesService.escalateIssue(parseInt(id, 10));
      await refetchIssueAndHistory();
    } catch (err) {
      console.error('Failed to escalate issue:', err);
      setActionError('Could not escalate this report. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const relatedIssuesSidebar = (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5">
        <p className="civic-label">Related</p>
        <h3 className="mt-2 font-display text-xl tracking-[-0.01em] text-[var(--civic-text)]">Similar reports nearby</h3>
        <p className="mt-1 text-[15px] leading-7 text-[var(--civic-muted)]">
          Reports like this one show patterns — the same road, the same transformer, again and again.
        </p>
      </div>

      <div className="rounded-[20px] border border-[var(--civic-border)] bg-white p-4 text-sm text-[var(--civic-muted)]">
        No related reports yet.
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <StandardLayout leftSidebar={<div className="text-sm text-[var(--civic-muted)]">Loading...</div>} showRightSidebar={false}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="rounded-[20px] border border-[var(--civic-border)] bg-white px-8 py-10 text-center">
            <div
              className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--civic-primary)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm font-semibold text-[var(--civic-text)]">Opening this report...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (error || !issue || !issueView) {
    return (
      <StandardLayout leftSidebar={<div className="text-sm text-[var(--civic-muted)]">Error</div>} showRightSidebar={false}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-[20px] border border-[var(--civic-border)] bg-white px-8 py-10 text-center">
            <Icon name="error" className="mb-4 text-6xl text-[var(--civic-danger)]" />
            <h2 className="text-xl font-bold text-[var(--civic-text)]">Could not open this report</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">{error || 'Report not found'}</p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={async () => {
                  if (!id) return;
                  try {
                    setIsLoading(true);
                    setError(null);
                    await refetchIssueAndHistory();
                  } catch (err) {
                    setError('We could not open this report. Check your connection and try again.');
                    console.error('Error retrying issue details:', err);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="rounded-md px-6 py-2.5 text-sm font-semibold text-[var(--civic-text)] transition hover:brightness-[0.98]"
                style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
              >
                Retry
              </button>
              <button
                onClick={() => navigate(-1)}
                className="rounded-md px-6 py-2.5 text-sm font-semibold text-[var(--civic-primary-contrast)] transition hover:brightness-105"
              style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
            >
              Go back
            </button>
          </div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout leftSidebar={relatedIssuesSidebar} showRightSidebar={false}>
      <div className="glass-header sticky top-0 z-20 border-b" style={{ borderColor: 'var(--civic-border)' }}>
        <div className="flex items-center gap-4 px-4 py-4 lg:px-6">
          <button onClick={() => navigate(-1)} className="civic-icon-button size-10 rounded-full">
            <Icon name="arrow_back" className="text-lg" />
          </button>
          <div>
            <p className="civic-label">Report</p>
            <h1 className="mt-1 text-xl font-bold tracking-[-0.01em] text-[var(--civic-text)]">
              Report #{issue.id}
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen px-4 py-5 lg:px-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div className="space-y-5">
            {resolutionBanner && (
              <section aria-label="Resolution record" className="rounded-[20px] border border-amber-200 bg-amber-50 p-6">
                <h2 className="font-display text-2xl tracking-[-0.01em] text-amber-900">Fixed, in public.</h2>
                <p className="mt-2 text-sm leading-7 text-amber-800">{resolutionBanner}</p>
              </section>
            )}
            {isOfficial && (
              <section aria-label="Official actions" className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5">
                <p className="civic-label">Official actions</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTakeIssue}
                    disabled={actionLoading !== null}
                    className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-[var(--civic-primary-contrast)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
                  >
                    {actionLoading === 'take' ? 'Taking...' : 'Take'}
                  </button>
                  <button
                    onClick={handleReplyFocus}
                    disabled={actionLoading !== null}
                    className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-[var(--civic-text)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                  >
                    Reply
                  </button>
                  <button
                    onClick={handleResolveIssue}
                    disabled={actionLoading !== null}
                    className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-[var(--civic-text)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                  >
                    {actionLoading === 'resolve' ? 'Resolving...' : 'Resolve'}
                  </button>
                  <button
                    onClick={handleEscalateIssue}
                    disabled={actionLoading !== null}
                    className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-[var(--civic-text)] transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                  >
                    {actionLoading === 'escalate' ? 'Escalating...' : 'Escalate'}
                  </button>
                </div>
                {actionError && (
                  <p className="mt-3 text-sm font-medium text-[var(--civic-danger)]">{actionError}</p>
                )}
              </section>
            )}
            <section className="overflow-hidden rounded-[20px] border border-[var(--civic-border)] bg-white p-6">
              <div className="mb-5 flex gap-4">
                <img className="size-12 shrink-0 rounded-[12px] object-cover" src={issueView.author.avatar} alt={issueView.author.name} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[var(--civic-text)]">{issueView.author.name}</span>
                    <span className="text-sm text-[var(--civic-muted)]">{issueView.author.username}</span>
                  </div>
                  <p className="text-xs text-[var(--civic-muted)]">{formatTime(new Date(issue.created_at))}</p>
                </div>
              </div>

              <p className="civic-label">What was reported</p>
              <h2 className="mt-2 font-display text-[30px] leading-snug tracking-[-0.02em] text-[var(--civic-text-strong)]">{issue.title || issue.description}</h2>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusConfig[issue.status as IssueStatus].color}`}>
                  <Icon name={statusConfig[issue.status as IssueStatus].icon} className="text-sm" />
                  {statusConfig[issue.status as IssueStatus].label}
                </span>
                {dayN !== null && <span className="civic-chip">Day {dayN}</span>}
                {issue.scope !== 'local' && scopeLabel && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#da5c4e' }}>
                    <Icon name="account_balance" className="text-[15px]" />
                    Escalated to {scopeLabel}
                  </span>
                )}
              </div>

              <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--civic-primary)]">
                <Icon name="location_on" className="text-[16px]" />
                {getLocationString(issueView.location || issue)}
                {issue.category ? ` · ${issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}` : ''}
              </p>

              <p className="mt-4 text-[15px] leading-8 text-[var(--civic-muted)]">{issue.description}</p>

              {issue.image_url && (
                <div className="mt-5 overflow-hidden rounded-[20px]">
                  <img className="w-full object-cover" src={issue.image_url} alt="Issue evidence" />
                </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-[16px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--civic-muted)]">Where</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--civic-text)]">{getLocationString(issueView.location || issue)}</p>
                </div>
                <div className="rounded-[16px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--civic-muted)]">Who should fix it</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--civic-text)]">{issueView.assignedTo?.name || 'No office assigned yet'}</p>
                </div>
                <div className="rounded-[16px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--civic-muted)]">Backing</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--civic-text)]">{issue.upvotes || 0} backing this · {issue.comment_count || 0} comments</p>
                </div>
              </div>
            </section>

            <section className="rounded-[20px] border border-[var(--civic-border)] bg-white p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="civic-label">History</p>
                  <h2 className="mt-2 font-display text-xl tracking-[-0.01em] text-[var(--civic-text)]">What has happened</h2>
                </div>
                <div className="rounded-full bg-[var(--civic-surface-soft)] px-4 py-2 text-xs font-bold text-[var(--civic-muted)]">
                  {statusHistory.length} update{statusHistory.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="space-y-4">
                {statusHistory.length > 0 ? (
                  statusHistory.map((history, index) => (
                    <div key={history.id || index} className="relative pl-8">
                      {index < statusHistory.length - 1 && (
                        <div className="absolute bottom-0 left-[13px] top-8 w-0.5 bg-[var(--civic-border)]" />
                      )}
                      <div className={`absolute left-0 top-1 rounded-full border p-1.5 ${statusConfig[history.status as IssueStatus]?.color || 'bg-slate-100'}`}>
                        <Icon name={statusConfig[history.status as IssueStatus]?.icon || 'info'} className="text-xs" />
                      </div>
                      <div className="rounded-[16px] border border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusConfig[history.status as IssueStatus]?.color || 'bg-slate-100'}`}>
                            {statusConfig[history.status as IssueStatus]?.label || 'Unknown'}
                          </span>
                          <span className="text-xs text-[var(--civic-muted)]">{history.created_at ? formatTime(new Date(history.created_at)) : 'recently'}</span>
                        </div>
                        <p className="mt-3 text-sm text-[var(--civic-muted)]">
                          Updated by <strong>{history.updated_by?.first_name || history.updated_by?.username || 'System'}</strong>
                        </p>
                        {history.note && (
                          <p
                            className="mt-3 rounded-[12px] bg-white p-3 text-sm leading-6 text-[var(--civic-muted)]"
                            style={{ boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
                          >
                            {history.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[16px] bg-[var(--civic-surface-soft)] p-6 text-center text-sm text-[var(--civic-muted)]">Nothing here yet — the report is still waiting for its first update.</div>
                )}
              </div>
            </section>

            <section className="rounded-[20px] border border-[var(--civic-border)] bg-white p-6">
              <div className="mb-5">
                <p className="civic-label">Replies</p>
                <h2 className="mt-2 font-display text-xl tracking-[-0.01em] text-[var(--civic-text)]">Replies and comments</h2>
              </div>

              <div className="mb-6 rounded-[16px] bg-[var(--civic-surface-soft)] p-4">
                <textarea
                  ref={commentBoxRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a reply to this report..."
                  className="min-h-[96px] w-full resize-none rounded-[12px] bg-white p-4 text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none"
                  style={{ boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setCommentText('')}
                    className="rounded-[12px] px-4 py-2.5 text-sm font-semibold text-[var(--civic-text)] transition hover:brightness-[0.98]"
                    style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || postingComment}
                    className="rounded-[12px] px-5 py-2.5 text-sm font-semibold text-[var(--civic-primary-contrast)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
                  >
                    {postingComment ? 'Sending...' : 'Send reply'}
                  </button>
                </div>
              </div>

              {commentError && (
                <p className="text-sm font-medium text-[var(--civic-danger)]">{commentError}</p>
              )}

              {commentsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((skeleton) => (
                    <div key={skeleton} className="h-20 animate-pulse rounded-[16px] bg-[var(--civic-surface-soft)] p-4" />
                  ))}
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const authorName = ((comment.author.first_name || comment.author.username || 'Citizen') as string).trim();
                    const isOfficial = comment.author.role === 'official';
                    const office = comment.author.jurisdiction || comment.author.location || 'Official office';
                    if (isOfficial) {
                      return (
                        <article key={comment.id} className="rounded-[16px] border-l-4 bg-[#eef7f0] p-4" style={{ borderLeftColor: 'var(--civic-primary)' }}>
                          <p className="text-[12px] font-bold text-[var(--civic-primary)]">
                            Verified reply · {authorName}, {office}
                          </p>
                          <p className="mt-1 text-xs text-[var(--civic-muted)]">
                            {formatTime(new Date(comment.created_at))}
                          </p>
                          <p className="mt-2 text-[15px] leading-7 text-[var(--civic-muted)]">{comment.content}</p>
                        </article>
                      );
                    }
                    return (
                      <article key={comment.id} className="rounded-[16px] bg-[var(--civic-surface-soft)] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-[var(--civic-text)]">
                            {authorName}
                          </p>
                          <span className="text-xs text-[var(--civic-muted)]">
                            {formatTime(new Date(comment.created_at))}
                          </span>
                        </div>
                        <p className="mt-2 text-[15px] leading-7 text-[var(--civic-muted)]">{comment.content}</p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[16px] bg-[var(--civic-surface-soft)] p-8 text-center text-sm text-[var(--civic-muted)]">
                  No comments yet. If you know something about this problem, say it here.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[20px] border border-[var(--civic-border)] bg-white p-5">
              <p className="civic-label">What happens next</p>
              <h3 className="mt-2 font-display text-xl tracking-[-0.01em] text-[var(--civic-text)]">How this report moves</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-[16px] bg-[var(--civic-surface-soft)] p-4">
                  <Icon name="policy" className="mt-0.5 text-[var(--civic-primary)]" />
                  <p className="text-[var(--civic-muted)]">The responsible office gets named on this report.</p>
                </div>
                <div className="flex items-start gap-3 rounded-[16px] bg-[var(--civic-surface-soft)] p-4">
                  <Icon name="schedule" className="mt-0.5 text-[var(--civic-primary)]" />
                  <p className="text-[var(--civic-muted)]">Every status change shows here, where everyone can see it.</p>
                </div>
                <div className="flex items-start gap-3 rounded-[16px] bg-[var(--civic-surface-soft)] p-4">
                  <Icon name="photo_camera" className="mt-0.5 text-[var(--civic-primary)]" />
                  <p className="text-[var(--civic-muted)]">Photos from the field get attached as proof of what changed.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </StandardLayout>
  );
}
