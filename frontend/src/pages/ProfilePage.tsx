import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, Input } from '../components/common';
import PostCard, { type Post } from '../components/issues/PostCard';
import StandardLayout from '../layouts/StandardLayout';
import { issuesService, postsService, profilesService, usersService } from '../services';
import { convertBackendPostToPost } from '../utils/dataMappers';
import type { User } from '../types';

type ProfileTab = 'posts';

interface UserProfileDisplay extends Partial<User> {
  avatar?: string;
  profile_picture?: string;
  banner?: string;
  cover_image?: string;
  bio?: string;
  location?: string;
  full_name?: string;
  name?: string;
  created_at?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatJoinedMonthYear(dateJoined?: string): string {
  if (!dateJoined) return 'Recently';
  const d = new Date(dateJoined);
  if (Number.isNaN(d.getTime())) return 'Recently';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfileDisplay | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ownIssues, setOwnIssues] = useState<{ status: string; has_official_reply?: boolean }[]>([]);
  const [retryKey, setRetryKey] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hasUploadedAvatar, setHasUploadedAvatar] = useState(false);
  // The account's real role/verification, so we never claim "Verified" falsely.
  const [accountProfile, setAccountProfile] = useState<{
    role?: string;
    is_verified?: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const userData = await usersService.getCurrentUser();
        // Fetch the profile too: role / is_verified live there, not on the user.
        profilesService
          .getCurrentProfile()
          .then((profile) => setAccountProfile({ role: profile.role, is_verified: profile.is_verified }))
          .catch(() => {});
        const fetchedPosts = await postsService.getPosts({ ordering: '-created_at' }).catch(() => []);
        const fetchedIssues = await issuesService.getIssues({ ordering: '-created_at' }).catch(() => []);
        const convertedPosts = fetchedPosts.map(convertBackendPostToPost);
        const authoredPosts = convertedPosts.filter(
          (post) =>
            post.author.username === userData.username ||
            post.author.name === `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        );
        const reporterIssues = fetchedIssues.filter(
          (issue) =>
            issue.created_by?.id === userData.id ||
            issue.created_by?.username === userData.username,
        );

        setUser(userData as UserProfileDisplay);
        setPosts(authoredPosts);
        setOwnIssues(reporterIssues);
        setAvatarPreview(null);
        setHasUploadedAvatar(false);
        setEditFormData({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          bio: (userData as UserProfileDisplay).bio || '',
          location: (userData as UserProfileDisplay).location || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [retryKey]);

  const profileName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.full_name || user?.name || 'Citizen';

  const initials = getInitials(profileName);
  const locationText = user?.location || 'Nigeria';
  const joinedText = formatJoinedMonthYear(user?.date_joined);

  const issuesRaised = ownIssues.length;
  // "Answered" means a verified official replied, not merely "resolved".
  const answered = ownIssues.filter((issue) => issue.has_official_reply).length;
  // Support this user's reports and updates have received.
  const supportReceived = posts.reduce((sum, post) => sum + post.stats.likes, 0);

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setAvatarPreview(loadEvent.target?.result as string);
      setHasUploadedAvatar(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const trimmedFirstName = editFormData.firstName.trim();
      const trimmedLastName = editFormData.lastName.trim();
      const trimmedBio = editFormData.bio.trim();
      const trimmedLocation = editFormData.location.trim();

      const updatedCoreUser = await usersService.updateCurrentUser({
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
      });

      const currentProfile = await profilesService.getCurrentProfile().catch(() => null);
      if (currentProfile) {
        await profilesService.updateProfile(currentProfile.id, {
          bio: trimmedBio,
          location: trimmedLocation,
        });
      }

      const mergedUser = {
        ...updatedCoreUser,
        bio: trimmedBio,
        location: trimmedLocation,
      } as UserProfileDisplay;

      usersService.setCurrentUser(mergedUser as User);
      setUser(mergedUser);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveError('Could not save profile right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLike = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              stats: {
                ...post.stats,
                likes: post.liked ? post.stats.likes - 1 : post.stats.likes + 1,
              },
            }
          : post,
      ),
    );
  };

  const handleShare = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, stats: { ...post.stats, shares: post.stats.shares + 1 } } : post,
      ),
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)),
    );
  };

  const handleComment = (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    navigate(post.type === 'issue' ? `/issue/${postId}` : `/post/${postId}`);
  };

  if (isLoading) {
    return (
      <StandardLayout showRightSidebar={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
          <div className="flex items-center gap-2 text-[var(--civic-primary)]">
            <div className="size-5 animate-spin rounded-full border-2 border-[var(--civic-primary)] border-t-transparent" />
            <span className="text-sm font-semibold">Loading profile...</span>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (error || !user) {
    return (
      <StandardLayout showRightSidebar={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16">
          <Icon name="error" className="mb-4 text-6xl text-[var(--civic-danger)]" />
          <h2 className="text-xl font-bold tracking-[-0.01em] text-[var(--civic-text)]">Could not load this profile</h2>
          <p className="mt-2 text-[var(--civic-muted)]">{error || 'Profile not found'}</p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            className="mt-5 rounded-full bg-[var(--civic-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            Try again
          </button>
        </div>
      </StandardLayout>
    );
  }

  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: 'posts', label: 'Posts' },
  ];

  const showUploadedAvatar = hasUploadedAvatar && !!avatarPreview;

  return (
    <StandardLayout showRightSidebar={false}>
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,33,51,0.28)] px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--civic-border)] bg-[var(--civic-surface)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: 'var(--civic-border)' }}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--civic-muted)]">Profile settings</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.01em] text-[var(--civic-text)]">Edit profile</h2>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-[var(--civic-muted)] hover:text-[var(--civic-text)]">
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-6">
              <div className="flex items-center gap-4">
                {showUploadedAvatar ? (
                  <img
                    src={avatarPreview as string}
                    alt="Avatar preview"
                    className="size-20 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex size-20 items-center justify-center rounded-full font-display text-2xl text-white"
                    style={{ background: '#a87b5a' }}
                  >
                    {getInitials(
                      `${editFormData.firstName} ${editFormData.lastName}`.trim() || profileName,
                    )}
                  </div>
                )}
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Upload photo
                  </Button>
                </div>
              </div>

              <Input
                label="First name"
                value={editFormData.firstName}
                onChange={(event) => setEditFormData({ ...editFormData, firstName: event.target.value })}
              />
              <Input
                label="Last name"
                value={editFormData.lastName}
                onChange={(event) => setEditFormData({ ...editFormData, lastName: event.target.value })}
              />
              <div>
                <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--civic-muted)]">
                  Bio
                </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(event) =>
                    setEditFormData({ ...editFormData, bio: event.target.value.slice(0, 160) })
                  }
                  rows={4}
                  className="w-full resize-none rounded-[20px] p-4 text-[15px] text-[var(--civic-text)] outline-none"
                  style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
                />
              </div>
              <Input
                label="Location"
                icon="location_on"
                value={editFormData.location}
                onChange={(event) => setEditFormData({ ...editFormData, location: event.target.value })}
                placeholder="City, State"
              />

              {saveError && (
                <p className="text-sm font-medium text-[var(--civic-danger)]">{saveError}</p>
              )}
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t px-6 py-5" style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-surface)' }}>
              <Button variant="outline" fullWidth onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth onClick={handleSaveProfile} loading={isSaving}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
        <section className="overflow-hidden rounded-[24px] border border-[var(--civic-border)] bg-[var(--civic-surface)]">
          {/* Banner: CSS shapes only */}
          <div
            className="relative h-[180px] w-full overflow-hidden rounded-t-[24px]"
            style={{ background: 'linear-gradient(135deg,#0e2a1d,#1d5c38)' }}
          >
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{
                width: 220,
                height: 220,
                background: '#d4a540',
                right: -56,
                bottom: -72,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{
                width: 64,
                height: 64,
                background: 'rgba(255,255,255,0.12)',
                right: 190,
                bottom: 28,
              }}
            />
          </div>

          <div className="px-6 pb-6 pt-6 lg:px-8">
            {/* Avatar sits fully below the banner — never overlapped */}
            <div>
              {showUploadedAvatar ? (
                <img
                  src={avatarPreview as string}
                  alt={profileName}
                  className="size-[112px] rounded-full object-cover ring-4 ring-white"
                />
              ) : (
                <div
                  className="flex size-[112px] items-center justify-center rounded-full font-display text-4xl text-white ring-4 ring-white"
                  style={{ background: '#a87b5a' }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Name row + Edit profile */}
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-[40px] leading-none tracking-[-0.01em] text-[var(--civic-text)]">
                  {profileName}
                </h1>
                <p className="mt-2 text-[15px] font-semibold text-[var(--civic-primary)]">
                  @{user.username || 'citizen'}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="shrink-0 rounded-full border border-[#1a1a1a] bg-white px-5 py-2 text-sm font-semibold text-[#1a1a1a] transition hover:bg-gray-50"
              >
                Edit profile
              </button>
            </div>

            {/* Meta line */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f2e7] px-3 py-1.5 text-[13px] font-semibold text-[#1d5c38]">
                {accountProfile?.role === 'official'
                  ? accountProfile.is_verified
                    ? 'Official · Verified'
                    : 'Official'
                  : 'Citizen'}
              </span>
              <span className="text-[14px] text-[var(--civic-muted)]">
                {locationText} · Joined {joinedText}
              </span>
            </div>

            {/* Stat cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[16px] border border-[var(--civic-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--civic-muted)]">
                  Issues raised
                </p>
                <p className="mt-2 font-display text-[32px] leading-none text-[var(--civic-text)]">
                  {issuesRaised}
                </p>
              </div>
              <div className="rounded-[16px] border border-[var(--civic-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--civic-muted)]">
                  Answered
                </p>
                <p className="mt-2 font-display text-[32px] leading-none text-[var(--civic-text)]">
                  {answered}
                </p>
              </div>
              <div className="rounded-[16px] border border-[var(--civic-border)] bg-white px-5 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--civic-muted)]">
                  Support received
                </p>
                <p className="mt-2 font-display text-[32px] leading-none text-[var(--civic-text)]">
                  {supportReceived}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-[var(--civic-border)] px-6 lg:px-8">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-1 py-4 text-[15px] transition ${
                    activeTab === tab.id
                      ? 'font-bold text-black'
                      : 'font-medium text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[var(--civic-primary)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab panels */}
          <div className="border-t border-[var(--civic-border)] bg-[var(--civic-surface-soft)] p-5 lg:p-8">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length ? (
                  posts.map((post) => (
                    <PostCard
                      key={`${post.type}-${post.id}`}
                      post={post}
                      onLike={handleLike}
                      onComment={handleComment}
                      onShare={handleShare}
                      onBookmark={handleBookmark}
                    />
                  ))
                ) : (
                  <div className="rounded-[16px] border border-[var(--civic-border)] bg-white p-10 text-center">
                    <p className="font-display text-2xl text-[var(--civic-text)]">No posts yet</p>
                    <p className="mx-auto mt-2 max-w-md text-[14px] text-[var(--civic-muted)]">
                      When you report an issue or share an update, it shows up here.
                    </p>
                    <button
                      onClick={() => navigate('/feed')}
                      className="mt-5 rounded-full bg-[var(--civic-primary)] px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                    >
                      Report an issue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </StandardLayout>
  );
}
