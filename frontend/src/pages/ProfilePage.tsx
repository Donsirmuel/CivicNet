import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, Input } from '../components/common';
import PostCard, { type Post } from '../components/issues/PostCard';
import StandardLayout from '../layouts/StandardLayout';
import { postsService, profilesService, usersService } from '../services';
import { convertBackendPostToPost } from '../utils/dataMappers';
import type { User } from '../types';

type ProfileTab = 'posts' | 'replies' | 'media';

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfileDisplay | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
        const fetchedPosts = await postsService.getPosts({ ordering: '-created_at' }).catch(() => []);
        const convertedPosts = fetchedPosts.map(convertBackendPostToPost);
        const authoredPosts = convertedPosts.filter(
          (post) =>
            post.author.username === userData.username ||
            post.author.name === `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        );

        setUser(userData as UserProfileDisplay);
        setPosts(authoredPosts);
        setAvatarPreview((userData as UserProfileDisplay).avatar || (userData as UserProfileDisplay).profile_picture || null);
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
  }, []);

  const profileName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.full_name || user?.name || 'Citizen';

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setAvatarPreview(loadEvent.target?.result as string);
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
        avatar: avatarPreview || (updatedCoreUser as UserProfileDisplay).avatar,
        profile_picture: avatarPreview || (updatedCoreUser as UserProfileDisplay).profile_picture,
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
          <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Error Loading Profile</h2>
          <p className="mt-2 text-[var(--civic-muted)]">{error || 'Profile not found'}</p>
        </div>
      </StandardLayout>
    );
  }

  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'media', label: 'Media' },
  ];

  return (
    <StandardLayout showRightSidebar={false}>
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(22,33,51,0.28)] px-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-hidden civic-panel">
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: 'var(--civic-border)' }}>
              <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Edit profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 text-[var(--civic-muted)] hover:text-[var(--civic-text)]">
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-6">
              <div className="flex items-center gap-4">
                <img
                  src={
                    avatarPreview ||
                    user.avatar ||
                    user.profile_picture ||
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                  }
                  alt="Avatar preview"
                  className="size-20 rounded-md object-cover"
                />
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Upload Photo
                  </Button>
                </div>
              </div>

              <Input
                label="First Name"
                value={editFormData.firstName}
                onChange={(event) => setEditFormData({ ...editFormData, firstName: event.target.value })}
              />
              <Input
                label="Last Name"
                value={editFormData.lastName}
                onChange={(event) => setEditFormData({ ...editFormData, lastName: event.target.value })}
              />
              <div>
                  <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#36506b]">
                    Bio
                  </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(event) =>
                    setEditFormData({ ...editFormData, bio: event.target.value.slice(0, 160) })
                  }
                  rows={4}
                  className="w-full resize-none rounded-md p-4 text-[15px] text-[var(--civic-text)] outline-none"
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

      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}>
        <div className="relative h-56 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--civic-surface-muted) 0%, var(--civic-surface-inset) 100%)' }}>
          <img
            src={
              user.banner ||
              user.cover_image ||
              'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1400&h=500&fit=crop'
            }
            alt="Citizen banner"
            className="h-full w-full object-cover opacity-55"
          />
        </div>

        <div className="px-4 pb-10 lg:px-8">
          <div className="relative -mt-20 civic-panel p-6">
            <div className="absolute right-6 top-6 z-10">
              <Button variant="outline" size="sm" icon="edit" onClick={() => setIsEditModalOpen(true)}>
                Edit Profile
              </Button>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <img
                  src={
                    avatarPreview ||
                    user.avatar ||
                    user.profile_picture ||
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                  }
                  alt={profileName}
                    className="size-32 rounded-md object-cover"
                    style={{ boxShadow: '0 18px 36px rgba(22,33,51,0.16), 0 0 0 4px var(--civic-surface)' }}
                  />

                <div>
                  <h1 className="text-4xl font-black tracking-[-0.04em] text-[var(--civic-text)] lg:text-5xl">
                    {profileName}
                  </h1>
                  <p className="mt-2 text-lg font-bold text-[var(--civic-primary)]">@{user.username || 'citizen'}</p>
                  <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--civic-muted)]">
                    {user.bio ||
                      'Your profile shows the updates and reports you have shared with your community.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--civic-border)] pt-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="feed" className="text-sm text-[var(--civic-primary)]" />
                  Posts <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{posts.length}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="flag" className="text-sm text-[var(--civic-primary)]" />
                  Issues <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{posts.filter((post) => post.type === 'issue').length}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="chat_bubble" className="text-sm text-[var(--civic-gold)]" />
                  Replies <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{posts.reduce((sum, post) => sum + post.stats.comments, 0)}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="alternate_email" className="text-sm text-[var(--civic-primary)]" />
                  Username <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">@{user.username || 'citizen'}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="location_on" className="text-sm text-[var(--civic-primary)]" />
                  Location <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{user.location || 'Nigeria'}</strong>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--civic-muted)]">
                  <Icon name="calendar_month" className="text-sm text-[var(--civic-primary)]" />
                  Joined <strong className="ml-1 text-sm font-black text-[var(--civic-text)]">{user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Recently joined'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 civic-panel">
            <div className="flex gap-8 overflow-x-auto px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-1 py-4 text-sm font-bold transition ${
                    activeTab === tab.id ? 'text-[var(--civic-text)]' : 'text-[var(--civic-muted)] hover:text-[var(--civic-text)]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--civic-primary)]" />}
                </button>
              ))}
            </div>

            <div className="p-6">
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
                    <div className="rounded-md p-10 text-center" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                      <Icon name="feed" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
                      <p className="text-lg font-bold text-[var(--civic-text)]">No posts yet</p>
                      <p className="mt-2 text-sm text-[var(--civic-muted)]">
                        When you post updates or reports, they will show up here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'replies' && (
                <div className="rounded-md p-10 text-center" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                  <Icon name="chat_bubble" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
                  <p className="text-lg font-bold text-[var(--civic-text)]">No replies yet</p>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="rounded-md p-10 text-center" style={{ background: 'var(--civic-surface-soft)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
                  <Icon name="photo_library" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
                  <p className="text-lg font-bold text-[var(--civic-text)]">No media yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
