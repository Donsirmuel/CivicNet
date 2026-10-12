import { useRef, useState } from 'react';
import { Icon } from '../common';
import LocationSelector from './LocationSelector';
import type { IssueCategory } from './PostCard';

type PostScope = 'local' | 'state' | 'national';
type ComposerMode = 'post' | 'issue';

const issueCategories: { value: IssueCategory; label: string; icon: string }[] = [
  { value: 'infrastructure', label: 'Infrastructure', icon: 'construction' },
  { value: 'safety', label: 'Safety', icon: 'security' },
  { value: 'health', label: 'Health', icon: 'health_and_safety' },
  { value: 'environment', label: 'Environment', icon: 'eco' },
  { value: 'education', label: 'Education', icon: 'school' },
  { value: 'transportation', label: 'Transport', icon: 'directions_bus' },
  { value: 'utilities', label: 'Utilities', icon: 'bolt' },
  { value: 'other', label: 'Other', icon: 'more_horiz' },
];

interface PostComposerProps {
  onPostSubmit?: (content: string, scope: PostScope, image?: string) => void;
  onIssueSubmit?: (data: {
    content: string;
    category: IssueCategory;
    location: { ward: string; lga: string; state: string };
    scope: PostScope;
    image?: string;
  }) => void;
}

export default function PostComposer({ onPostSubmit, onIssueSubmit }: PostComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('post');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<PostScope>('local');
  const [issueCategory, setIssueCategory] = useState<IssueCategory>('infrastructure');
  const [location, setLocation] = useState<{ ward: string; lga: string; state: string } | undefined>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = mode === 'issue' ? Boolean(content.trim() && location) : Boolean(content.trim());

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => setSelectedImage(loadEvent.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (mode === 'issue' && location && onIssueSubmit) {
      onIssueSubmit({
        content,
        category: issueCategory,
        location,
        scope,
        image: selectedImage || undefined,
      });
    }

    if (mode === 'post' && onPostSubmit) {
      onPostSubmit(content, scope, selectedImage || undefined);
    }

    setContent('');
    setSelectedImage(null);
    setLocation(undefined);
    setIssueCategory('infrastructure');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-[var(--civic-border)] px-4 py-4 sm:px-5"
      style={{ background: 'var(--civic-surface)', boxShadow: '0 24px 48px -36px rgba(22, 33, 51, 0.28)' }}
    >
      <div className="flex gap-4">
        <img
          className="mt-1 size-11 shrink-0 rounded-xl object-cover"
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
          alt="Your avatar"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--civic-muted)]">
                Share something
              </p>
              <p className="mt-2 font-display text-2xl tracking-[-0.03em] text-[var(--civic-text)]">
                Put an update on the record.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('post')}
              className={mode === 'post' ? 'civic-chip-active' : 'civic-chip'}
            >
              <Icon name="edit_square" className="text-[14px]" />
              Update
            </button>
            <button
              type="button"
              onClick={() => setMode('issue')}
              className={mode === 'issue' ? 'civic-chip-active' : 'civic-chip'}
            >
              <Icon name="flag" className="text-[14px]" />
              Report
            </button>
            {mode === 'issue' && (
              <span className="civic-chip">
                <Icon name="sell" className="text-[14px]" />
                {issueCategories.find((item) => item.value === issueCategory)?.label}
              </span>
            )}
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="mt-4 min-h-[130px] w-full resize-none rounded-[20px] bg-transparent px-4 py-4 text-[15px] leading-7 text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none"
            style={{ boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
            placeholder="Report an issue or share an update..."
          />

          {selectedImage && (
            <div
              className="relative mt-4 overflow-hidden rounded-[20px]"
              style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
            >
              <img src={selectedImage} alt="Selected upload" className="max-h-72 w-full object-cover" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full"
                style={{ background: 'var(--civic-surface)', color: 'var(--civic-text)' }}
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </div>
          )}

          {mode === 'issue' && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {issueCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setIssueCategory(category.value)}
                    className={issueCategory === category.value ? 'civic-chip-active' : 'civic-chip'}
                  >
                    <Icon name={category.icon} className="text-[14px]" />
                    {category.label}
                  </button>
                ))}
              </div>

              <LocationSelector value={location} onChange={setLocation} required />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--civic-border)' }}>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="civic-icon-button size-10"
                aria-label="Add media"
              >
                <Icon name="image" className="text-[18px]" />
              </button>
              <button type="button" className="civic-icon-button size-10" aria-label="Add poll">
                <Icon name="poll" className="text-[18px]" />
              </button>
              <button type="button" className="civic-icon-button size-10" aria-label="Add mood">
                <Icon name="mood" className="text-[18px]" />
              </button>
              <button type="button" className="civic-icon-button size-10" aria-label="Schedule">
                <Icon name="event" className="text-[18px]" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative md:min-w-0">
                <select
                  value={scope}
                  onChange={(event) => setScope(event.target.value as PostScope)}
                  className="w-full appearance-none rounded-full border px-11 py-2.5 pr-10 text-[11px] font-semibold uppercase tracking-[0.14em] outline-none transition hover:border-[var(--civic-border-strong)]"
                  style={{
                    background: 'var(--civic-surface)',
                    borderColor: 'var(--civic-border)',
                    color: 'var(--civic-text)',
                    boxShadow: '0 10px 24px -18px rgba(22,33,51,0.45)',
                  }}
                >
                  <option value="local">Local</option>
                  <option value="state">State</option>
                  <option value="national">National</option>
                </select>
                <Icon
                  name="location_on"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--civic-primary)]"
                />
                <Icon
                  name="keyboard_arrow_down"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--civic-muted)]"
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--civic-primary)_0%,var(--civic-primary-deep)_100%)] px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-primary-contrast)] shadow-[0_18px_38px_rgba(10,106,59,0.16)] transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-90"
              >
                {mode === 'issue' ? 'Publish Report' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
