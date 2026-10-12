import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/common';
import type { IssueCategory, IssueStatus, Post } from '../components/issues/PostCard';
import StandardLayout from '../layouts/StandardLayout';
import { issuesService } from '../services';
import { convertIssueToPost } from '../utils/dataMappers';

type StatusFilter = 'all' | IssueStatus;
type CategoryFilter = 'all' | IssueCategory;

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

export default function OfficialDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [issues, setIssues] = useState<Post[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const dashboardIssues = await issuesService.getDashboardIssues();
        setIssues(dashboardIssues.map(convertIssueToPost));
      } catch (err) {
        setError('Failed to load dashboard. Please refresh.');
        console.error('Error fetching dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = useMemo(
    () => ({
      total: issues.length,
      reported: issues.filter((i) => i.issueStatus === 'reported').length,
      underReview: issues.filter((i) => i.issueStatus === 'under_review').length,
      inProgress: issues.filter((i) => i.issueStatus === 'in_progress').length,
      resolved: issues.filter((i) => i.issueStatus === 'resolved').length,
      closed: issues.filter((i) => i.issueStatus === 'closed').length,
    }),
    [issues],
  );

  const filteredIssues = useMemo(
    () =>
      issues.filter((issue) => {
        const statusMatch = statusFilter === 'all' || issue.issueStatus === statusFilter;
        const categoryMatch = categoryFilter === 'all' || issue.issueCategory === categoryFilter;
        return statusMatch && categoryMatch;
      }),
    [issues, statusFilter, categoryFilter],
  );

  const statCards = [
    { label: 'Total Assigned', value: stats.total, icon: 'task', color: 'text-primary' },
    { label: 'Reported', value: stats.reported, icon: 'flag', color: 'text-amber-600' },
    { label: 'Under Review', value: stats.underReview, icon: 'visibility', color: 'text-blue-600' },
    { label: 'In Progress', value: stats.inProgress, icon: 'autorenew', color: 'text-indigo-600' },
    { label: 'Resolved', value: stats.resolved, icon: 'check_circle', color: 'text-green-600' },
    { label: 'Closed', value: stats.closed, icon: 'cancel', color: 'text-slate-600' },
  ];

  const categoryOptions: CategoryFilter[] = ['all', 'infrastructure', 'safety', 'health', 'environment', 'education', 'transportation', 'utilities', 'other'];
  const statusOptions: StatusFilter[] = ['all', 'reported', 'under_review', 'in_progress', 'resolved', 'closed'];

  const dashboardSidebar = (
    <div className="space-y-4">
      <div className="civic-panel p-5">
        <p className="civic-label">Operations desk</p>
        <h3 className="mt-2 text-lg font-bold text-slate-900">Dashboard controls</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Narrow your case list by status or category and focus on the assignments that need movement now.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="mb-2 text-xs font-semibold text-slate-600">Status</h4>
          <div className="space-y-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`w-full rounded-xl border px-3 py-3 text-left text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-[#e9dccd] bg-white text-slate-600 hover:bg-[#f7f0e6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name={status === 'all' ? 'tune' : statusConfig[status as IssueStatus].icon} className="text-sm" />
                  <span>{status === 'all' ? 'All Status' : statusConfig[status as IssueStatus].label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#e7daca] pt-3">
          <h4 className="mb-2 text-xs font-semibold text-slate-600">Category</h4>
          <div className="space-y-1">
            {categoryOptions.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`w-full rounded-xl border px-3 py-3 text-left text-xs font-medium transition-all ${
                  categoryFilter === category
                    ? 'border-primary/20 bg-primary/10 text-primary'
                    : 'border-[#e9dccd] bg-white text-slate-600 hover:bg-[#f7f0e6]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {category === 'all' ? (
                    <Icon name="apps" className="text-sm" />
                  ) : (
                    <Icon name={categoryIcons[category]} className="text-sm" />
                  )}
                  <span>{category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="civic-panel p-5">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">Quick Stats</h4>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Total Issues</span>
            <span className="font-bold text-slate-900">{stats.total}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Resolved</span>
            <span className="font-bold text-green-600">{stats.resolved}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">In Progress</span>
            <span className="font-bold text-indigo-600">{stats.inProgress}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <StandardLayout leftSidebar={dashboardSidebar} showRightSidebar={false}>
      <div className="min-h-screen space-y-8 px-6 py-6">
        <div>
          <p className="civic-label">Administrative interface</p>
          <h1 className="mt-2 font-display text-4xl tracking-[-0.02em] text-slate-900">Official Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Manage assigned issues, monitor progress, and maintain public trust through timely response.
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="civic-panel px-8 py-10 text-center">
              <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm font-semibold text-slate-700">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {statCards.map((card) => (
                <div key={card.label} className="civic-panel p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">{card.value}</span>
                    <Icon name={card.icon} className={`text-2xl ${card.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                {filteredIssues.length} Issue{filteredIssues.length !== 1 ? 's' : ''}
              </h2>

              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <div
                    key={`${issue.type}-${issue.id}`}
                    onClick={() => navigate(`/issue/${issue.id}`)}
                    className="civic-panel cursor-pointer border-l-4 border-l-primary p-6 transition-all hover:-translate-y-0.5"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-2 text-xl font-bold text-slate-900">{issue.title || `${issue.content.substring(0, 60)}...`}</h3>
                        <div className="flex flex-wrap gap-2">
                          {issue.issueStatus && (
                            <span className={`flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-semibold ${statusConfig[issue.issueStatus].color}`}>
                              <Icon name={statusConfig[issue.issueStatus].icon} className="text-sm" />
                              {statusConfig[issue.issueStatus].label}
                            </span>
                          )}
                          {issue.issueCategory && (
                            <span className="flex items-center gap-1 rounded-md bg-[#fbf7f2] px-3 py-1 text-xs font-semibold text-slate-700">
                              <Icon name={categoryIcons[issue.issueCategory]} className="text-sm" />
                              {issue.issueCategory.charAt(0).toUpperCase() + issue.issueCategory.slice(1)}
                            </span>
                          )}
                          {issue.priority && (
                            <span
                              className={`rounded-md px-3 py-1 text-xs font-semibold ${
                                issue.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : issue.priority === 'high'
                                    ? 'bg-orange-100 text-orange-700'
                                    : issue.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
                            </span>
                          )}
                        </div>
                      </div>
                      <Icon name="arrow_forward" className="mt-2 text-slate-400" />
                    </div>

                    <p className="mb-4 text-sm leading-7 text-slate-600">{issue.content}</p>

                    {issue.location && (
                      <div className="mb-3 flex items-center gap-1 text-xs text-slate-500">
                        <Icon name="location_on" className="text-sm" />
                        {issue.location.ward && `${issue.location.ward}, `}
                        {issue.location.lga && `${issue.location.lga}, `}
                        {issue.location.state}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#eee1d1] pt-4">
                      <div className="flex gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Icon name="comment" className="text-base" />
                          {issue.stats.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="favorite" className="text-base" />
                          {issue.stats.likes}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{issue.timestamp}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="civic-panel flex flex-col items-center justify-center py-16 text-center">
                  <Icon name="inbox" className="mb-4 text-6xl text-slate-300" />
                  <h3 className="mb-2 text-lg font-bold text-slate-900">No issues found</h3>
                  <p className="text-slate-600">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </StandardLayout>
  );
}
