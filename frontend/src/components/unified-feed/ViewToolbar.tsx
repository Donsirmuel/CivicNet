import { type FormEvent } from 'react';
import { Icon } from '../common';
import type { CivicFeedFilters } from '../../types';

interface ViewToolbarProps {
  scope: CivicFeedFilters['scope'];
  contentType: CivicFeedFilters['contentType'];
  searchValue: string;
  onScopeChange: (value: CivicFeedFilters['scope']) => void;
  onContentTypeChange: (value: CivicFeedFilters['contentType']) => void;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: () => void;
  activeTab?: FeedTab;
  onTabChange?: (tab: FeedTab) => void;
}

export type FeedTab = 'for-you' | 'near-me' | 'official';

const scopeOptions: Array<{ value: CivicFeedFilters['scope']; label: string }> = [
  { value: 'all', label: 'Nationwide' },
  { value: 'state', label: 'State' },
  { value: 'local', label: 'LGA' },
];

const contentOptions: Array<{ value: CivicFeedFilters['contentType']; label: string }> = [
  { value: 'all', label: 'All posts' },
  { value: 'official', label: 'Official posts' },
  { value: 'issue', label: 'Reports' },
  { value: 'post', label: 'Updates' },
];

export default function ViewToolbar({
  scope,
  contentType,
  searchValue,
  onScopeChange,
  onContentTypeChange,
  onSearchValueChange,
  onSearchSubmit,
  activeTab,
  onTabChange,
}: ViewToolbarProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearchSubmit();
  };

  const tabs: Array<{ value: FeedTab; label: string }> =
    activeTab !== undefined && onTabChange
      ? [
          { value: 'for-you', label: 'For you' },
          { value: 'near-me', label: 'Near me' },
          { value: 'official', label: 'Official replies' },
        ]
      : [];

  return (
    <div className="px-4 lg:px-8">
      <div className="mx-auto max-w-[760px]">
        {tabs.length > 0 && onTabChange && (
          <nav aria-label="Feed views" className="flex items-center justify-start gap-5 border-b border-[var(--civic-border)]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onTabChange(tab.value)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`-mb-px border-b-2 pb-2 text-[14px] font-semibold transition ${
                    isActive
                      ? 'border-[#0a6a3b] text-[var(--civic-text)]'
                      : 'border-transparent text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
        <form
          onSubmit={handleSubmit}
          className="mt-2.5 grid w-full grid-cols-1 gap-2 sm:grid-cols-[150px_150px_minmax(0,1fr)] sm:gap-2"
        >
          <div className="relative md:min-w-0">
            <select
              value={scope}
              onChange={(event) => onScopeChange(event.target.value as CivicFeedFilters['scope'])}
              className="w-full appearance-none rounded-full border px-11 py-2.5 pr-10 text-sm font-semibold outline-none transition hover:border-[var(--civic-border-strong)] sm:px-12 sm:py-2.5 sm:pr-11"
              style={{
                background: 'var(--civic-surface-soft)',
                borderColor: 'var(--civic-border)',
                color: 'var(--civic-text)',
                boxShadow: '0 6px 16px -12px rgba(22,33,51,0.18)',
              }}
            >
              {scopeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon
              name="location_on"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--civic-primary)] sm:left-4 sm:text-[18px]"
            />
            <Icon
              name="keyboard_arrow_down"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--civic-muted)] sm:right-4 sm:text-[18px]"
            />
          </div>

          <div className="relative md:min-w-0">
            <select
              value={contentType}
              onChange={(event) => onContentTypeChange(event.target.value as CivicFeedFilters['contentType'])}
              className="w-full appearance-none rounded-full border px-11 py-2.5 pr-10 text-sm font-semibold outline-none transition hover:border-[var(--civic-border-strong)] sm:px-12 sm:py-2.5 sm:pr-11"
              style={{
                background: 'var(--civic-surface-soft)',
                borderColor: 'var(--civic-border)',
                color: 'var(--civic-text)',
                boxShadow: '0 6px 16px -12px rgba(22,33,51,0.18)',
              }}
            >
              {contentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon
              name="tune"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--civic-primary)] sm:left-4 sm:text-[18px]"
            />
            <Icon
              name="keyboard_arrow_down"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--civic-muted)] sm:right-4 sm:text-[18px]"
            />
          </div>

          <div
            className="relative col-span-2 flex min-h-[44px] min-w-0 items-center overflow-hidden rounded-full border bg-[var(--civic-surface-soft)] pl-11 pr-1 sm:min-h-[44px] sm:pl-12 xl:col-span-1"
            style={{
              borderColor: 'var(--civic-border)',
              boxShadow: '0 6px 16px -12px rgba(22,33,51,0.18)',
            }}
          >
            <span className="pointer-events-none absolute left-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--civic-border-strong)] bg-[var(--civic-surface-soft)] text-[var(--civic-muted)] sm:h-8 sm:w-8">
              <Icon name="search" className="text-[16px] sm:text-[18px]" />
            </span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder="Search CivicNet"
              className="min-h-11 min-w-0 flex-1 appearance-none border-0 bg-transparent pr-2 text-sm text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none ring-0 focus:outline-none focus:ring-0 sm:min-h-12"
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
            <button
              type="submit"
              className="ml-1 inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.24)] px-3 transition hover:brightness-105"
              style={{
                background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)',
                color: 'var(--civic-primary-contrast)',
                boxShadow: '0 4px 12px rgba(10,106,59,0.14)',
              }}
              aria-label="Search"
            >
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
