import { Icon } from '../common';
import type { IssueCategory, IssueStatus } from '../issues/PostCard';

export type CivicFeedView = 'list' | 'map' | 'split';
export type CivicFeedSort = 'newest' | 'priority' | 'discussed';

export interface CivicFeedFilters {
  search: string;
  scope: 'all' | 'local' | 'state' | 'national';
  contentType: 'all' | 'issue' | 'post' | 'official';
  status: 'all' | IssueStatus;
  category: 'all' | IssueCategory;
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  verifiedOnly: boolean;
}

interface FilterBarProps {
  filters: CivicFeedFilters;
  resultsCount: number;
  onChange: (next: CivicFeedFilters) => void;
  onReset: () => void;
}

const statusOptions: Array<{ value: CivicFeedFilters['status']; label: string; icon: string }> = [
  { value: 'all', label: 'Any status', icon: 'tune' },
  { value: 'reported', label: 'Reported', icon: 'flag' },
  { value: 'under_review', label: 'Under review', icon: 'visibility' },
  { value: 'in_progress', label: 'In progress', icon: 'autorenew' },
  { value: 'resolved', label: 'Resolved', icon: 'check_circle' },
  { value: 'closed', label: 'Closed', icon: 'cancel' },
];

const categoryOptions: Array<{ value: CivicFeedFilters['category']; label: string; icon: string }> = [
  { value: 'all', label: 'All categories', icon: 'apps' },
  { value: 'infrastructure', label: 'Infrastructure', icon: 'construction' },
  { value: 'safety', label: 'Safety', icon: 'security' },
  { value: 'health', label: 'Health', icon: 'health_and_safety' },
  { value: 'environment', label: 'Environment', icon: 'eco' },
  { value: 'education', label: 'Education', icon: 'school' },
  { value: 'transportation', label: 'Transport', icon: 'directions_bus' },
  { value: 'utilities', label: 'Utilities', icon: 'bolt' },
  { value: 'other', label: 'Other', icon: 'more_horiz' },
];

const priorityOptions: Array<{ value: CivicFeedFilters['priority']; label: string }> = [
  { value: 'all', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const scopeOptions: Array<{ value: CivicFeedFilters['scope']; label: string; icon: string }> = [
  { value: 'all', label: 'Everywhere', icon: 'public' },
  { value: 'local', label: 'Local', icon: 'distance' },
  { value: 'state', label: 'State', icon: 'apartment' },
  { value: 'national', label: 'National', icon: 'flag' },
];

const contentTypeOptions: Array<{ value: CivicFeedFilters['contentType']; label: string }> = [
  { value: 'all', label: 'All content' },
  { value: 'issue', label: 'Issues only' },
  { value: 'post', label: 'Updates only' },
  { value: 'official', label: 'Officials only' },
];

function getActiveFilterCount(filters: CivicFeedFilters) {
  return [
    filters.scope !== 'all',
    filters.contentType !== 'all',
    filters.status !== 'all',
    filters.category !== 'all',
    filters.priority !== 'all',
    filters.verifiedOnly,
    filters.search.trim().length > 0,
  ].filter(Boolean).length;
}

export default function FilterBar({ filters, resultsCount, onChange, onReset }: FilterBarProps) {
  const activeCount = getActiveFilterCount(filters);

  const update = <K extends keyof CivicFeedFilters>(key: K, value: CivicFeedFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="civic-panel-soft p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="civic-label">Control room</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#162133]">Refine civic activity</h2>
            <p className="mt-2 text-sm leading-6 text-[#5a6b82]">
              Focus on the issues, updates, and officials that matter to your community.
            </p>
          </div>
          <span className="inline-flex min-w-10 items-center justify-center bg-[#e8f1eb] px-3 py-1 text-sm font-bold text-[#005129]">
            {activeCount}
          </span>
        </div>

        <div className="mt-5 bg-white px-4 py-4">
          <p className="civic-label">Visible right now</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-black tracking-[-0.04em] text-[#162133]">{resultsCount}</p>
              <p className="text-sm text-[#5a6b82]">items matching current filters</p>
            </div>
            <button
              onClick={onReset}
              className="min-h-10 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#005129] ring-1 ring-[#dfe6ef] transition hover:bg-[#f5f8f6]"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      <section className="civic-panel-soft p-5">
        <h3 className="civic-label">Content type</h3>
        <div className="mt-4 grid gap-2">
          {contentTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => update('contentType', option.value)}
              className={`px-4 py-3 text-left text-sm font-bold transition ${
                filters.contentType === option.value
                  ? 'bg-[#e8f1eb] text-[#005129]'
                  : 'bg-white text-[#56667e] hover:bg-[#f4f6f9] hover:text-[#162133]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="civic-panel-soft p-5">
        <h3 className="civic-label">Coverage</h3>
        <div className="mt-4 grid gap-2">
          {scopeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => update('scope', option.value)}
              className={`flex items-center gap-3 px-4 py-3 text-left text-sm font-bold transition ${
                filters.scope === option.value
                  ? 'bg-[#e8f1eb] text-[#005129]'
                  : 'bg-white text-[#56667e] hover:bg-[#f4f6f9] hover:text-[#162133]'
              }`}
            >
              <Icon name={option.icon} className="text-lg" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="civic-panel-soft p-5">
        <h3 className="civic-label">Issue status</h3>
        <div className="mt-4 grid gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => update('status', option.value)}
              className={`flex items-center gap-3 px-4 py-3 text-left text-sm font-bold transition ${
                filters.status === option.value
                  ? 'bg-[#e8f1eb] text-[#005129]'
                  : 'bg-white text-[#56667e] hover:bg-[#f4f6f9] hover:text-[#162133]'
              }`}
            >
              <Icon name={option.icon} className="text-lg" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="civic-panel-soft p-5">
        <h3 className="civic-label">Category & urgency</h3>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => update('category', option.value)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold transition ${
                  filters.category === option.value
                    ? 'bg-[#e8f1eb] text-[#005129]'
                    : 'bg-white text-[#56667e] hover:bg-[#f4f6f9] hover:text-[#162133]'
                }`}
              >
                <Icon name={option.icon} className="text-sm" />
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => update('priority', option.value)}
                className={`px-4 py-3 text-left text-sm font-bold transition ${
                  filters.priority === option.value
                    ? 'bg-[#fff8ea] text-[#8b6a16]'
                    : 'bg-white text-[#56667e] hover:bg-[#f4f6f9] hover:text-[#162133]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <label className="civic-panel-soft flex cursor-pointer items-center justify-between p-5">
        <div>
          <p className="text-sm font-bold text-[#162133]">Verified officials only</p>
          <p className="mt-1 text-sm text-[#5a6b82]">Show updates from verified offices only.</p>
        </div>
        <button
          type="button"
          onClick={() => update('verifiedOnly', !filters.verifiedOnly)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
            filters.verifiedOnly ? 'bg-[#005129]' : 'bg-[#cad3df]'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              filters.verifiedOnly ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>
    </div>
  );
}
