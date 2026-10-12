import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';
import { authService, messagesService, profilesService, usersService } from '../services';
import type { Message as ApiMessage, User, UserProfile } from '../types';

interface Conversation {
  id: string;
  counterpartId: number;
  user: {
    name: string;
    username: string;
    initials: string;
    verified?: boolean;
    office?: string;
  };
  messageCount: number;
  status: string;
  lastMessage: {
    text: string;
    timestamp: string;
    unread: boolean;
  };
}

interface ThreadMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
}

function displayName(user: User): string {
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return full || user.username;
}

function initialsFor(user: User): string {
  const name = displayName(user);
  const parts = name.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'Now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function fullTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return sameDay ? time : `${date.toLocaleDateString()} · ${time}`;
}

function AvatarCircle({ initials, size = 'size-11' }: { initials: string; size?: string }) {
  return (
    <div
      aria-hidden
      className={`${size} flex shrink-0 items-center justify-center rounded-md text-sm font-bold text-[var(--civic-primary-contrast)]`}
      style={{ background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)' }}
    >
      {initials}
    </div>
  );
}

export default function MessagesPage() {
  const [currentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [profileByUserId, setProfileByUserId] = useState<Record<number, UserProfile>>({});
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [pendingCounterpart, setPendingCounterpart] = useState<User | null>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [messages, profiles] = await Promise.all([
        messagesService.getMessages(),
        profilesService.getProfiles().catch(() => [] as UserProfile[]),
      ]);
      const sorted = [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      setApiMessages(sorted);
      const map: Record<number, UserProfile> = {};
      if (Array.isArray(profiles)) {
        for (const profile of profiles) {
          if (profile?.user?.id) map[profile.user.id] = profile;
        }
      }
      setProfileByUserId(map);
    } catch {
      setError('We could not load your messages. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const conversations: Conversation[] = useMemo(() => {
    if (!currentUser) return [];
    const groups = new Map<number, ApiMessage[]>();
    for (const message of apiMessages) {
      const other = message.sender.id === currentUser.id ? message.receiver : message.sender;
      if (!other) continue;
      const list = groups.get(other.id) || [];
      list.push(message);
      groups.set(other.id, list);
    }
    const result: Conversation[] = [];
    for (const [counterpartId, thread] of groups) {
      const sorted = [...thread].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const other = sorted[0].sender.id === currentUser.id ? sorted[0].receiver : sorted[0].sender;
      const profile = profileByUserId[counterpartId];
      const last = sorted[sorted.length - 1];
      const unread = sorted.some(
        (message) => message.receiver.id === currentUser.id && !message.is_read,
      );
      result.push({
        id: String(counterpartId),
        counterpartId,
        user: {
          name: displayName(other),
          username: `@${other.username}`,
          initials: initialsFor(other),
          verified: profile ? profile.is_verified && profile.role === 'official' : false,
          office:
            profile && (profile.state || profile.lga)
              ? [profile.lga, profile.state].filter(Boolean).join(', ')
              : profile?.role === 'official'
                ? 'Official'
                : `@${other.username}`,
        },
        messageCount: sorted.length,
        status: unread ? 'Unread' : 'Active',
        lastMessage: {
          text: last.content,
          timestamp: relativeTime(last.created_at),
          unread,
        },
      });
    }
    return result.sort((a, b) => {
      const lastA = groups.get(a.counterpartId)?.slice(-1)[0];
      const lastB = groups.get(b.counterpartId)?.slice(-1)[0];
      return (
        new Date(lastB?.created_at || 0).getTime() - new Date(lastA?.created_at || 0).getTime()
      );
    });
  }, [apiMessages, currentUser, profileByUserId]);

  useEffect(() => {
    if (!selectedConversation && conversations.length > 0 && !pendingCounterpart) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation, pendingCounterpart]);

  const currentMessages: ThreadMessage[] = useMemo(() => {
    if (!currentUser) return [];
    if (pendingCounterpart) return [];
    const counterpartId = Number(selectedConversation);
    return apiMessages
      .filter(
        (message) =>
          (message.sender.id === currentUser.id && message.receiver.id === counterpartId) ||
          (message.receiver.id === currentUser.id && message.sender.id === counterpartId),
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((message) => ({
        id: String(message.id),
        sender: message.sender.id === currentUser.id ? 'me' : 'them',
        text: message.content,
        timestamp: fullTimestamp(message.created_at),
      }));
  }, [apiMessages, currentUser, pendingCounterpart, selectedConversation]);

  const selectedConv = pendingCounterpart
    ? {
        id: `pending-${pendingCounterpart.id}`,
        counterpartId: pendingCounterpart.id,
        user: {
          name: displayName(pendingCounterpart),
          username: `@${pendingCounterpart.username}`,
          initials: initialsFor(pendingCounterpart),
          verified: false,
          office: `@${pendingCounterpart.username}`,
        },
        messageCount: 0,
        status: 'New conversation',
        lastMessage: { text: '', timestamp: '', unread: false },
      }
    : conversations.find((conversation) => conversation.id === selectedConversation) || null;

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      [conversation.user.name, conversation.user.username, conversation.lastMessage.text]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, searchQuery]);

  const selectConversation = async (conversationId: string) => {
    setPendingCounterpart(null);
    setSelectedConversation(conversationId);
    setMobileView('thread');
    if (!currentUser) return;
    const counterpartId = Number(conversationId);
    const unread = apiMessages.filter(
      (message) =>
        message.sender.id === counterpartId &&
        message.receiver.id === currentUser.id &&
        !message.is_read,
    );
    if (!unread.length) return;
    try {
      await Promise.all(unread.map((message) => messagesService.markAsRead(message.id)));
      setApiMessages((current) =>
        current.map((message) =>
          unread.some((item) => item.id === message.id) ? { ...message, is_read: true } : message,
        ),
      );
    } catch {
      // Read receipts are best-effort; the thread still opens.
    }
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    const receiverId = pendingCounterpart
      ? pendingCounterpart.id
      : selectedConv?.counterpartId;
    if (!text || !receiverId || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await messagesService.sendMessage(receiverId, text);
      setApiMessages((current) => [...current, sent]);
      setPendingCounterpart(null);
      setSelectedConversation(String(receiverId));
      setMobileView('thread');
      setMessageText('');
    } catch {
      setError('Your message did not send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const searchForUsers = async (query: string) => {
    setUserSearch(query);
    if (query.trim().length < 2) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const results = await usersService.getUsers({ search: query.trim() });
      setUserResults(results.filter((user) => user.id !== currentUser?.id).slice(0, 8));
    } catch {
      setUserResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = (user: User) => {
    setPendingCounterpart(user);
    setSelectedConversation(null);
    setComposing(false);
    setUserSearch('');
    setUserResults([]);
    setMobileView('thread');
  };

  const renderConversationList = (mobile = false) => (
    <div className={`flex h-full flex-col ${mobile ? 'space-y-4' : ''}`}>
      <div
        className={mobile ? 'civic-section' : 'border-b px-5 py-5'}
        style={mobile ? undefined : { borderColor: 'var(--civic-border)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="civic-label">Messages</p>
          <button
            onClick={() => setComposing((open) => !open)}
            className="civic-icon-button size-9"
            aria-label="Start a new conversation"
            title="New conversation"
          >
            <Icon name="edit_square" className="text-xl" />
          </button>
        </div>
        <h1 className="mt-3 font-display text-[1.9rem] tracking-[-0.02em] text-[var(--civic-text)]">Messages</h1>

        {composing && (
          <div className="mt-4 rounded-md p-3" style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}>
            <input
              type="text"
              value={userSearch}
              onChange={(event) => searchForUsers(event.target.value)}
              placeholder="Search people by name..."
              className="min-h-11 w-full rounded-md bg-transparent px-3 text-sm text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none"
              style={{ background: 'var(--civic-surface)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
            />
            {searchingUsers && (
              <p className="mt-2 text-xs text-[var(--civic-muted)]">Searching...</p>
            )}
            {userResults.map((user) => (
              <button
                key={user.id}
                onClick={() => startConversation(user)}
                className="mt-2 flex w-full items-center gap-3 rounded-md p-2 text-left transition hover:bg-[var(--civic-primary-glow)]"
              >
                <AvatarCircle initials={initialsFor(user)} size="size-9" />
                <span>
                  <span className="block text-sm font-bold text-[var(--civic-text)]">
                    {displayName(user)}
                  </span>
                  <span className="block text-xs text-[var(--civic-muted)]">@{user.username}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="relative mt-4">
          <Icon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--civic-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search messages"
            className="min-h-12 w-full rounded-md bg-transparent py-3 pl-12 pr-4 text-sm text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none"
            style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
          />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto civic-scrollbar ${mobile ? 'space-y-3' : ''}`}>
        {loading && (
          <div className="flex items-center justify-center px-5 py-16">
            <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading messages" />
          </div>
        )}

        {error && !loading && (
          <div className="px-5 py-10 text-center">
            <Icon name="cloud_off" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
            <p className="text-lg font-bold text-[var(--civic-text)]">Something went wrong</p>
            <p className="mt-2 text-sm text-[var(--civic-muted)]">{error}</p>
            <button onClick={loadMessages} className="civic-ghost-button mt-4">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredConversations.map((conversation) => {
          const isSelected = selectedConversation === conversation.id && !pendingCounterpart;
          return (
            <button
              key={conversation.id}
              onClick={() => selectConversation(conversation.id)}
              className={`w-full text-left transition ${mobile ? 'rounded-md p-4' : 'border-b px-5 py-5'}`}
              style={{
                borderColor: mobile ? undefined : 'var(--civic-border)',
                background: mobile
                  ? isSelected
                    ? 'var(--civic-primary-glow)'
                    : 'var(--civic-surface)'
                  : isSelected
                    ? 'var(--civic-primary-glow)'
                    : 'transparent',
                boxShadow: mobile ? 'var(--civic-shadow-soft)' : undefined,
              }}
            >
              <div className="flex gap-3">
                <AvatarCircle initials={conversation.user.initials} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-[var(--civic-text)]">
                          {conversation.user.name}
                        </p>
                        {conversation.user.verified && (
                          <Icon name="workspace_premium" className="text-base text-[var(--civic-gold)]" />
                        )}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-muted)]">
                        {conversation.user.office || conversation.user.username}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[11px] font-bold text-[var(--civic-muted)]">
                        {conversation.lastMessage.timestamp}
                      </span>
                      {conversation.lastMessage.unread && (
                        <span className="size-2 rounded-full bg-[var(--civic-primary)]" />
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-sm font-bold text-[var(--civic-text)]">
                    {conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-gold)]">
                    {conversation.status}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--civic-muted)]">
                    {conversation.lastMessage.text}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {!loading && !error && !filteredConversations.length && (
          <div className={`${mobile ? 'civic-section' : 'px-5 py-10'} text-center`}>
            <Icon name="mail" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
            <p className="text-lg font-bold text-[var(--civic-text)]">
              {conversations.length ? 'No messages found' : 'No conversations yet'}
            </p>
            <p className="mt-2 text-sm text-[var(--civic-muted)]">
              {conversations.length
                ? 'Try a different search phrase.'
                : 'Start a new conversation to message a citizen or official.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderThreadPane = (mobile = false) =>
    selectedConv ? (
      <div className="flex min-h-full flex-col">
        <div
          className={`${mobile ? 'sticky top-0 z-10' : 'sticky top-0 z-20'} border-b px-4 py-4 lg:px-8`}
          style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-surface-soft)' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {mobile && (
                <button
                  onClick={() => setMobileView('list')}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--civic-surface)', color: 'var(--civic-text)', boxShadow: 'var(--civic-shadow-soft)' }}
                >
                  <Icon name="arrow_back" className="text-xl" />
                </button>
              )}

              <AvatarCircle initials={selectedConv.user.initials} size="size-12" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold tracking-[-0.01em] text-[var(--civic-text)]">
                    {selectedConv.user.name}
                  </h2>
                  {selectedConv.user.verified && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ background: 'rgba(212,165,64,0.12)', color: 'var(--civic-gold)', boxShadow: 'inset 0 0 0 1px rgba(212,165,64,0.2)' }}
                    >
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--civic-muted)]">{selectedConv.user.username}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-gold)]">
                  {selectedConv.status}
                </p>
              </div>
            </div>

            <button className="civic-icon-button size-10" aria-label="Conversation options">
              <Icon name="more_horiz" className="text-xl" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 px-4 py-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-surface-soft) 100%)' }}
        >
          <div className="w-full space-y-5">
            {currentMessages.length === 0 && (
              <p className="py-10 text-center text-sm text-[var(--civic-muted)]">
                Say hello — your first message starts this conversation.
              </p>
            )}
            {currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="w-full max-w-[840px] rounded-[20px] px-5 py-4"
                  style={{
                    background:
                      message.sender === 'me'
                        ? 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)'
                        : 'var(--civic-surface)',
                    color: message.sender === 'me' ? 'var(--civic-primary-contrast)' : 'var(--civic-text)',
                    boxShadow:
                      message.sender === 'me'
                        ? '0 18px 34px rgba(10,106,59,0.16)'
                        : 'var(--civic-shadow-soft)',
                  }}
                >
                  <p className="text-[15px] leading-7">{message.text}</p>
                  <p
                    className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: message.sender === 'me' ? 'rgba(255,255,255,0.74)' : 'var(--civic-muted)' }}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && !loading && (
          <p className="border-t px-4 py-2 text-center text-xs text-[var(--civic-danger)]" style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-surface)' }}>
            {error}
          </p>
        )}

        <div className="border-t px-4 py-4 lg:px-8" style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-surface)' }}>
          <div className="flex w-full items-end gap-3">
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Write a reply..."
              rows={1}
              className="max-h-40 min-h-[50px] flex-1 resize-y rounded-[18px] bg-transparent px-4 py-3 text-sm leading-6 text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none"
              style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sending}
              aria-label="Send message"
              className="flex size-12 items-center justify-center rounded-full transition hover:brightness-105 disabled:opacity-45"
              style={{
                background: 'linear-gradient(135deg, var(--civic-primary) 0%, var(--civic-primary-deep) 100%)',
                color: 'var(--civic-primary-contrast)',
              }}
            >
              <Icon name="send" className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)', color: 'var(--civic-muted)' }}
      >
        <div className="text-center">
          <Icon name="mail" className="mx-auto mb-4 text-6xl text-[var(--civic-muted)]" />
          <p className="text-lg font-bold text-[var(--civic-text)]">Select a message</p>
          <p className="mt-2 text-sm">Open a thread to continue.</p>
        </div>
      </div>
    );

  return (
    <StandardLayout showRightSidebar={false}>
      <div
        className="min-h-screen"
        style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-bg-deep) 100%)' }}
      >
        <div className="px-4 py-6 lg:hidden">
          {mobileView === 'list' ? renderConversationList(true) : renderThreadPane(true)}
        </div>

        <div className="hidden lg:grid lg:min-h-screen lg:grid-cols-[380px_minmax(0,1fr)]">
          <div
            className="sticky top-0 h-screen overflow-y-auto civic-scrollbar"
            style={{ borderRight: '1px solid var(--civic-border)', background: 'var(--civic-surface-soft)' }}
          >
            {renderConversationList()}
          </div>
          {renderThreadPane()}
        </div>
      </div>
    </StandardLayout>
  );
}
