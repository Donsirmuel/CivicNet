import { Icon } from '../../components/common';

interface PostDetailsLeftSidebarProps {
  authorId: string;
  onNavigateToAuthor: (authorId: string) => void;
  relatedPostsCount?: number;
}

export default function PostDetailsLeftSidebar({
  authorId,
  onNavigateToAuthor,
  relatedPostsCount = 0,
}: PostDetailsLeftSidebarProps) {
  const shareOptions = [
    { id: 'copy', label: 'Copy Link', icon: 'link', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { id: 'twitter', label: 'Share on Twitter', icon: 'share', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' },
    { id: 'facebook', label: 'Share on Facebook', icon: 'share', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { id: 'message', label: 'Send Message', icon: 'mail', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  ];

  const relatedIssues = [
    { id: '1', title: 'Water Quality Concerns', category: 'Environment' },
    { id: '2', title: 'Road Infrastructure Needs', category: 'Infrastructure' },
    { id: '3', title: 'Community Safety Update', category: 'Safety' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Post Details</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Share & explore</p>
      </div>

      {/* Share Options */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Share This Post</h3>
        {shareOptions.map((option) => (
          <button
            key={option.id}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
          >
            <div className={`${option.color} p-2 rounded-md flex items-center justify-center flex-shrink-0`}>
              <Icon name={option.icon} className="text-base" />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {/* Author Info */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-navy-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-1">Author</h3>
        <button
          onClick={() => onNavigateToAuthor(authorId)}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all border border-slate-200 dark:border-navy-700"
        >
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
            alt="Author"
            className="size-12 rounded-full"
          />
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Adejimi Lekan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">@adejimlekan</p>
          </div>
          <Icon name="chevron_right" className="text-slate-400 flex-shrink-0" />
        </button>
      </div>

      {/* Related Issues */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-navy-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white px-1">
          Related Issues ({relatedPostsCount})
        </h3>
        {relatedIssues.map((issue) => (
          <button
            key={issue.id}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {issue.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{issue.category}</p>
          </button>
        ))}
        {relatedPostsCount > 3 && (
          <button className="w-full text-sm text-primary hover:underline font-semibold py-2">
            View all related issues
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-navy-700">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all text-slate-700 dark:text-slate-300">
          <Icon name="arrow_back" className="text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium">Back to Feed</span>
        </button>
      </div>
    </div>
  );
}
