import { useRef, useState } from 'react';
import { Icon } from '../common';
import LocationSelector from './LocationSelector';
import { getLocationString } from '../../data/locationData';
import { authService } from '../../services';
import type { IssueCategory } from './PostCard';

const AVATAR_COLORS = ['#a87b5a', '#0a6a3b', '#31572c', '#d4a540'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ? parts[0][0] : '';
  const second = parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : '';
  return `${first}${second}`.toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % 2147483647;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0] ?? '#0a6a3b';
}

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
    responsibleOffice?: string;
  }) => void;
}

export default function PostComposer({ onPostSubmit, onIssueSubmit }: PostComposerProps) {
  const [mode, setMode] = useState<ComposerMode>('issue');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<PostScope>('local');
  const [issueCategory, setIssueCategory] = useState<IssueCategory>('infrastructure');
  const [responsibleOffice, setResponsibleOffice] = useState('');
  const [location, setLocation] = useState<{ ward: string; lga: string; state: string } | undefined>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hideName, setHideName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = mode === 'issue' ? Boolean(content.trim() && location) : Boolean(content.trim());
  const activeCategoryLabel = issueCategories.find((category) => category.value === issueCategory)?.label;

  const currentUser = authService.getCurrentUser();
  const composerName =
    currentUser
      ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ').trim() ||
        currentUser.username ||
        'You'
      : 'You';
  const composerAvatar = currentUser?.avatar || currentUser?.profile_picture;

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
        responsibleOffice: responsibleOffice.trim() || undefined,
      });
    }

    if (mode === 'post' && onPostSubmit) {
      onPostSubmit(content, scope, selectedImage || undefined);
    }

    setContent('');
    setSelectedImage(null);
    setLocation(undefined);
    setResponsibleOffice('');
    setIssueCategory('infrastructure');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section
      className="rounded-[20px] border border-[var(--civic-border)] bg-white px-4 py-4 sm:px-5"
      style={{ boxShadow: '0 12px 28px rgba(22, 33, 51, 0.06)' }}
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('issue')}
          className={`inline-flex min-h-9 items-center rounded-full px-4 text-[13px] font-semibold transition ${
            mode === 'issue'
              ? 'bg-[#0a6a3b] text-white'
              : 'border border-[var(--civic-border)] bg-white text-[var(--civic-muted)]'
          }`}
        >
          Report an issue
        </button>
        <button
          type="button"
          onClick={() => setMode('post')}
          className={`inline-flex min-h-9 items-center rounded-full px-4 text-[13px] font-semibold transition ${
            mode === 'post'
              ? 'bg-[#f4ead2] text-[#132033]'
              : 'border border-[var(--civic-border)] bg-white text-[var(--civic-muted)]'
          }`}
        >
          Share an update
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        {composerAvatar ? (
          <img
            className="size-11 shrink-0 rounded-full object-cover"
            src={composerAvatar}
            alt="Your avatar"
          />
        ) : (
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white"
            style={{ background: getAvatarColor(composerName) }}
            aria-hidden="true"
          >
            {getInitials(composerName)}
          </span>
        )}
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          className="min-h-[76px] w-full resize-none rounded-[16px] bg-transparent px-4 py-3 text-[15px] leading-7 text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none"
          style={{ boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
          placeholder={mode === 'issue' ? 'What is wrong on your street?' : 'Share an update for your neighbours'}
        />
      </div>

      {selectedImage ? (
        <div className="relative mt-4 overflow-hidden rounded-[16px] border border-[var(--civic-border)]">
          <img src={selectedImage} alt="Selected upload" className="max-h-72 w-full object-cover" />
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white text-[var(--civic-text)]"
            aria-label="Remove photo"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex min-h-[88px] w-full flex-col items-center justify-center gap-1 rounded-[16px] border border-dashed border-[var(--civic-border-strong)] text-[13px] font-medium text-[var(--civic-muted)] transition hover:text-[var(--civic-text)]"
        >
          <Icon name="image" className="text-[20px]" />
          Add photo or video
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {mode === 'issue' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#0a6a3b] px-3 text-[12px] font-semibold text-[#0a6a3b]">
              <Icon name="location_on" className="text-[15px]" />
              {location ? getLocationString(location) : 'Add location'}
            </span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-dashed border-[var(--civic-border-strong)] px-3 text-[12px] font-medium text-[var(--civic-muted)]">
              Category{activeCategoryLabel ? `: ${activeCategoryLabel}` : ''}
            </span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-dashed border-[var(--civic-border-strong)] px-3 text-[12px] font-medium text-[var(--civic-muted)]">
              {responsibleOffice.trim() ? responsibleOffice.trim() : 'Responsible office (optional)'}
            </span>
          </div>

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

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--civic-muted)]">
              Responsible office (optional)
            </span>
            <input
              type="text"
              value={responsibleOffice}
              onChange={(event) => setResponsibleOffice(event.target.value)}
              placeholder="e.g. Ward waste office"
              className="w-full rounded-[16px] bg-transparent px-4 py-3 text-sm text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none"
              style={{ boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-[#0a6a3b]"
            style={{ background: 'rgba(10,106,59,.08)' }}
          >
            <Icon name="image" className="text-[15px]" />
            Photo
          </button>
          {[
            { label: 'Video', icon: 'videocam' },
            { label: 'Voice note', icon: 'mic' },
            { label: 'Location', icon: 'location_on' },
          ].map((item) => (
            <span
              key={item.label}
              title="Coming soon"
              aria-disabled="true"
              className="inline-flex min-h-8 cursor-not-allowed items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-[#0a6a3b] opacity-50"
              style={{ background: 'rgba(10,106,59,.08)' }}
            >
              <Icon name={item.icon} className="text-[15px]" />
              {item.label}
            </span>
          ))}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[var(--civic-muted)]">
          Hide my name
          <button
            type="button"
            role="switch"
            aria-checked={hideName}
            aria-label="Hide my name"
            onClick={() => setHideName((current) => !current)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${hideName ? 'bg-[#0a6a3b]' : 'bg-[var(--civic-surface-inset)]'}`}
            style={hideName ? undefined : { boxShadow: 'inset 0 0 0 1px var(--civic-border-strong)' }}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-white shadow transition ${hideName ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0a6a3b] px-5 text-[13px] font-bold text-white transition hover:brightness-105 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === 'issue' ? 'Post report' : 'Share update'}
        </button>
        <div className="relative">
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as PostScope)}
            aria-label="Post scope"
            className="appearance-none rounded-full border border-[var(--civic-border)] bg-white py-2.5 pl-4 pr-9 text-[12px] font-semibold text-[var(--civic-text)] outline-none"
          >
            <option value="local">Local</option>
            <option value="state">State</option>
            <option value="national">National</option>
          </select>
          <Icon
            name="keyboard_arrow_down"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[var(--civic-muted)]"
          />
        </div>
      </div>
    </section>
  );
}
