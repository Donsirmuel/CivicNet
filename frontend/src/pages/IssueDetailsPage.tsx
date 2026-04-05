import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/common';
import type { IssueCategory, IssueStatus } from '../components/issues/PostCard';
import StandardLayout from '../layouts/StandardLayout';
import { getLocationString } from '../data/locationData';
import { issuesService } from '../services';
import { convertIssueToPost, formatTime } from '../utils/dataMappers';
import type { Issue, StatusHistory } from '../types';

const statusConfig: Record<IssueStatus, { label: string; icon: string; color: string }> = {
  reported: { label: 'Reported', icon: 'flag', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  under_review: { label: 'Under Review', icon: 'visibility', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  in_progress: { label: 'In Progress', icon: 'autorenew', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  resolved: { label: 'Resolved', icon: 'check_circle', color: 'bg-green-100 text-green-700 border-green-300' },
  closed: { label: 'Closed', icon: 'cancel', color: 'bg-slate-100 text-slate-600 border-slate-300' },
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

export default function IssueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [issue, setIssue] = useState<Issue | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);

  useEffect(() => {
    const fetchIssueDetails = async () => {
      if (!id) {
        setError('Issue ID not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [issueData, historyData] = await Promise.all([
          issuesService.getIssue(parseInt(id, 10)),
          issuesService.getStatusHistory(parseInt(id, 10)),
        ]);

        setIssue(issueData);
        setStatusHistory(historyData);
      } catch (err) {
        setError('Failed to load issue details. Please try again.');
        console.error('Error fetching issue details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssueDetails();
  }, [id]);

  const issueView = useMemo(() => (issue ? convertIssueToPost(issue) : null), [issue]);

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    setCommentText('');
  };

  const relatedIssuesSidebar = (
    <div className="space-y-4">
      <div className="civic-panel p-5">
        <p className="civic-label">Case navigator</p>
        <h3 className="mt-2 text-lg font-bold text-slate-900">Related civic reports</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Similar reports help officials compare patterns and identify repeated infrastructure failures.
        </p>
      </div>

      {[
        { id: '2', title: 'Road Damage on Community Access Road', category: 'infrastructure' },
        { id: '3', title: 'Street Light Outage Near Market Square', category: 'utilities' },
        { id: '4', title: 'Waste Overflow Beside Primary School', category: 'environment' },
      ].map((relatedIssue) => (
        <button key={relatedIssue.id} className="civic-panel-soft w-full p-4 text-left transition hover:bg-[#f7f0e6]">
          <p className="text-sm font-semibold text-slate-900">{relatedIssue.title}</p>
          <p className="mt-1 text-xs font-medium text-primary">{relatedIssue.category}</p>
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <StandardLayout leftSidebar={<div className="text-sm text-slate-500">Loading...</div>} showRightSidebar={false}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="civic-panel px-8 py-10 text-center">
            <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-semibold text-slate-700">Loading issue details...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (error || !issue || !issueView) {
    return (
      <StandardLayout leftSidebar={<div className="text-sm text-slate-500">Error</div>} showRightSidebar={false}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="civic-panel max-w-md px-8 py-10 text-center">
            <Icon name="error" className="mb-4 text-6xl text-red-500" />
            <h2 className="text-xl font-bold text-slate-900">Error Loading Issue</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{error || 'Issue not found'}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-5 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Go Back
            </button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout leftSidebar={relatedIssuesSidebar} showRightSidebar={false}>
      <div className="glass-header sticky top-0 z-20 border-b border-[#e6d8c6]">
        <div className="flex items-center gap-4 px-4 py-4 lg:px-6">
          <button onClick={() => navigate(-1)} className="rounded-md bg-white/80 p-2 transition hover:bg-white">
            <Icon name="arrow_back" className="text-slate-700" />
          </button>
          <div>
            <p className="civic-label">Issue record</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-slate-900">Civic Case File</h1>
            <p className="text-xs text-slate-500">Issue #{issue.id}</p>
          </div>
        </div>
      </div>

      <div className="min-h-screen px-4 py-5 lg:px-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div className="space-y-5">
            <section className="civic-panel overflow-hidden border-l-4 border-l-amber-500 p-6">
              <div className="mb-5 flex gap-4">
                <img className="size-12 shrink-0 rounded-md ring-2 ring-[#efe2d2]" src={issueView.author.avatar} alt={issueView.author.name} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{issueView.author.name}</span>
                    <span className="text-sm text-slate-500">{issueView.author.username}</span>
                  </div>
                  <p className="text-xs text-slate-500">{formatTime(new Date(issue.created_at))}</p>
                </div>
              </div>

              <p className="civic-label">Issue summary</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{issue.title || issue.description}</h2>
              <p className="mt-4 text-base leading-8 text-slate-700">{issue.description}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#f7f0e6] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
                  {issue.scope}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-bold ${statusConfig[issue.status as IssueStatus].color}`}>
                  <Icon name={statusConfig[issue.status as IssueStatus].icon} className="text-base" />
                  {statusConfig[issue.status as IssueStatus].label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#fbf7f2] px-3 py-1.5 text-sm font-semibold text-slate-700">
                  <Icon name={categoryIcons[issue.category as IssueCategory]} className="text-base" />
                  {issue.category.charAt(0).toUpperCase() + issue.category.slice(1)}
                </span>
                {issue.priority && issue.priority !== 'low' && (
                  <span className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold ${
                    issue.priority === 'urgent'
                      ? 'bg-red-100 text-red-700'
                      : issue.priority === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    <Icon name="priority_high" className="text-sm" />
                    {issue.priority.toUpperCase()}
                  </span>
                )}
              </div>

              {issue.image_url && (
                <div className="mt-5 overflow-hidden rounded-xl">
                  <img className="w-full object-cover" src={issue.image_url} alt="Issue evidence" />
                </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="civic-panel-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Location context</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{getLocationString(issueView.location || issue)}</p>
                </div>
                <div className="civic-panel-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assigned office</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{issueView.assignedTo?.name || 'Awaiting official assignment'}</p>
                </div>
                <div className="civic-panel-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Engagement</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{issue.upvotes || 0} supports · {issue.comment_count || 0} comments</p>
                </div>
              </div>
            </section>

            <section className="civic-panel p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="civic-label">Audit trail</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Status History</h2>
                </div>
                <div className="rounded-md bg-[#fbf7f2] px-4 py-2 text-xs font-bold text-slate-600">
                  {statusHistory.length} update{statusHistory.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="space-y-4">
                {statusHistory.length > 0 ? (
                  statusHistory.map((history, index) => (
                    <div key={history.id || index} className="relative pl-8">
                      {index < statusHistory.length - 1 && (
                        <div className="absolute bottom-0 left-[13px] top-8 w-0.5 bg-[#e7dbcc]" />
                      )}
                      <div className={`absolute left-0 top-1 rounded-full border p-1.5 ${statusConfig[history.status as IssueStatus]?.color || 'bg-slate-100'}`}>
                        <Icon name={statusConfig[history.status as IssueStatus]?.icon || 'info'} className="text-xs" />
                      </div>
                      <div className="civic-panel-soft p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${statusConfig[history.status as IssueStatus]?.color || 'bg-slate-100'}`}>
                            {statusConfig[history.status as IssueStatus]?.label || 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-500">{history.created_at ? formatTime(new Date(history.created_at)) : 'recently'}</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          Updated by <strong>{history.updated_by?.first_name || history.updated_by?.username || 'System'}</strong>
                        </p>
                        {history.note && <p className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-slate-600">{history.note}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="civic-panel-soft p-6 text-center text-sm text-slate-500">No status history available yet.</div>
                )}
              </div>
            </section>

            <section className="civic-panel p-6">
              <div className="mb-5">
                <p className="civic-label">Public discussion</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Official Responses & Comments</h2>
              </div>

              <div className="civic-panel-soft mb-6 p-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Draft your reply to this report..."
                  className="min-h-[96px] w-full resize-none rounded-md border border-transparent bg-white p-4 text-slate-900 placeholder:text-slate-400 focus:border-primary/20 focus:ring-0"
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setCommentText('')}
                    className="rounded-md bg-[#eef1f5] px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#e3e8ef]"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                    className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send Reply
                  </button>
                </div>
              </div>

              <div className="civic-panel-soft p-8 text-center text-sm text-slate-500">
                No comments yet. Be the first citizen or official to add context here.
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="civic-panel p-5">
              <p className="civic-label">Resolution status</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Operational next steps</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="civic-panel-soft flex items-start gap-3 p-4">
                  <Icon name="policy" className="mt-0.5 text-primary" />
                  <p className="text-slate-700">Assign the relevant local official if the issue is still unowned.</p>
                </div>
                <div className="civic-panel-soft flex items-start gap-3 p-4">
                  <Icon name="schedule" className="mt-0.5 text-primary" />
                  <p className="text-slate-700">Update the status quickly so citizens can trust the process.</p>
                </div>
                <div className="civic-panel-soft flex items-start gap-3 p-4">
                  <Icon name="photo_camera" className="mt-0.5 text-primary" />
                  <p className="text-slate-700">Attach field evidence as the issue moves toward resolution.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </StandardLayout>
  );
}
