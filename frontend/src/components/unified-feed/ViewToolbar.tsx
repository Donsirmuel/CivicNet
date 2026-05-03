import { type FormEvent } from 'react';
import { Icon } from '../common';
import type { CivicFeedFilters } from './FilterBar';

interface ViewToolbarProps {
  scope: CivicFeedFilters['scope'];
  contentType: CivicFeedFilters['contentType'];
  searchValue: string;
  onScopeChange: (value: CivicFeedFilters['scope']) => void;
  onContentTypeChange: (value: CivicFeedFilters['contentType']) => void;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: () => void;
}

const scopeOptions: Array<{ value: CivicFeedFilters['scope']; label: string }> = [
  { value: 'all', label: 'Nationwide' },
  { value: 'state', label: 'State' },
  { value: 'local', label: 'LGA' },
];

const contentOptions: Array<{ value: CivicFeedFilters['contentType']; label: string }> = [
  { value: 'all', label: 'All Posts' },
  { value: 'official', label: 'Official Posts' },
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
}: ViewToolbarProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSearchSubmit();
  };

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-glass)' }}
    >
      <div className="px-3 py-3 lg:px-8 lg:py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto grid max-w-[760px] grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-[210px_210px_minmax(0,1fr)]"
        >
          <div className="relative md:min-w-0">
            <select
              value={scope}
              onChange={(event) => onScopeChange(event.target.value as CivicFeedFilters['scope'])}
              className="w-full appearance-none rounded-[20px] border px-11 py-3 pr-10 text-sm font-semibold outline-none transition hover:border-[var(--civic-border-strong)] sm:px-12 sm:py-3.5 sm:pr-11"
              style={{
                background: 'var(--civic-surface)',
                borderColor: 'var(--civic-border)',
                color: 'var(--civic-text)',
                boxShadow: '0 6px 18px rgba(22,33,51,0.04)',
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
              className="w-full appearance-none rounded-[20px] border px-11 py-3 pr-10 text-sm font-semibold outline-none transition hover:border-[var(--civic-border-strong)] sm:px-12 sm:py-3.5 sm:pr-11"
              style={{
                background: 'var(--civic-surface)',
                borderColor: 'var(--civic-border)',
                color: 'var(--civic-text)',
                boxShadow: '0 6px 18px rgba(22,33,51,0.04)',
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
            className="relative col-span-2 flex min-h-[50px] min-w-0 items-center overflow-hidden rounded-[20px] border bg-[var(--civic-surface)] pl-11 pr-1 sm:min-h-[54px] sm:pl-12 xl:col-span-1"
            style={{
              borderColor: 'var(--civic-border)',
              boxShadow: '0 6px 18px rgba(22,33,51,0.04)',
            }}
          >
            <span className="pointer-events-none absolute left-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--civic-border-strong)] bg-[var(--civic-surface)] text-[var(--civic-muted)] sm:h-8 sm:w-8">
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
              className="ml-1 inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.24)] px-3 transition hover:brightness-105"
              style={{
                background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)',
                color: 'var(--civic-primary-contrast)',
                boxShadow: '0 8px 18px rgba(10,106,59,0.18)',
              }}
              aria-label="Search"
            >
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}
