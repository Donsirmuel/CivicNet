import { Icon } from '../../components/common';

interface IssueDetailsLeftSidebarProps {
  issueStatus: 'open' | 'in-progress' | 'resolved' | 'closed';
  onStatusChange: (status: string) => void;
  onShare: (platform: string) => void;
}

export default function IssueDetailsLeftSidebar({
  issueStatus,
  onStatusChange,
  onShare,
}: IssueDetailsLeftSidebarProps) {
  const statuses = [
    { id: 'open', label: 'Open', icon: 'radio_button_unchecked', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { id: 'in-progress', label: 'In Progress', icon: 'schedule', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
    { id: 'resolved', label: 'Resolved', icon: 'check_circle', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { id: 'closed', label: 'Closed', icon: 'close', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  ];

  const solutions = [
    { id: '1', title: 'Proposed Infrastructure Upgrade', votes: 234 },
    { id: '2', title: 'Community Clean-up Initiative', votes: 189 },
    { id: '3', title: 'Policy Advocacy Campaign', votes: 156 },
  ];

  const recentUpdates = [
    { timestamp: '2 hours ago', description: 'Status updated to In Progress', author: 'City Council' },
    { timestamp: '1 day ago', description: 'New solution proposed', author: 'Community Member' },
    { timestamp: '3 days ago', description: 'Issue reported', author: 'Kelechi Okonkwo' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Issue Details</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage & track</p>
      </div>

      {/* Status */}
      <div className="space-y-3 pt-0">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Status</h3>
        <div className="space-y-2">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() => onStatusChange(status.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                issueStatus === status.id
                  ? 'bg-primary/15 border border-primary/50'
                  : 'hover:bg-slate-100 dark:hover:bg-navy-800 border border-transparent'
              }`}
            >
              <div className={`${status.color} p-2 rounded-md flex items-center justify-center flex-shrink-0`}>
                <Icon name={status.icon} className="text-base" />
              </div>
              <span className={`text-sm font-medium ${
                issueStatus === status.id
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {status.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Share */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-navy-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Share</h3>
        <button
          onClick={() => onShare('copy')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all text-slate-700 dark:text-slate-300"
        >
          <Icon name="link" className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">Copy Link</span>
        </button>
        <button
          onClick={() => onShare('email')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all text-slate-700 dark:text-slate-300"
        >
          <Icon name="mail" className="text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium">Email</span>
        </button>
      </div>

      {/* Top Solutions */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-navy-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Top Solutions</h3>
        {solutions.map((solution) => (
          <button
            key={solution.id}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {solution.title}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Icon name="favorite" className="text-red-600 dark:text-red-400 text-xs" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{solution.votes} votes</p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent Updates */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-navy-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Updates</h3>
        {recentUpdates.map((update, idx) => (
          <div key={idx} className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-navy-900/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">{update.timestamp}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{update.description}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">by {update.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
