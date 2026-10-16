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

const AVATAR_COLORS = ['#6b4f3a', '#0a6a3b', '#b8912f'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
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

function AvatarCircle({
  initials,
  seed,
  size = 'h-11 w-11',
}: {
  initials: string;
  seed?: string;
  size?: string;
}) {
  return (
    <div
      aria-hidden
      className={`${size} flex shrink-0 items-center justify-center rounded-full text-sm font-bold text-white`}
      style={{ backgroundColor: avatarColor(seed ?? initials) }}
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-1 pb-4">
        <h1 className="font-serif text-2xl text-[#1a2b23]">Messages</h1>
        <button
          onClick={() => setComposing((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e9e0d0] bg-white text-[#1a2b23] transition hover:bg-[#f0f7f2]"
          aria-label="Start a new conversation"
          title="New conversation"
        >
          <Icon name="edit_square" className="text-xl" />
        </button>
      </div>

      {composing && (
        <div className="mb-3 rounded-2xl border border-[#e9e0d0] bg-white p-3">
          <input
            type="text"
            value={userSearch}
            onChange={(event) => searchForUsers(event.target.value)}
            placeholder="Search people by name"
            className="min-h-11 w-full rounded-full border border-[#e9e0d0] bg-white px-4 text-sm text-[#1a2b23] placeholder:text-[#8a938e] outline-none focus:border-[#0a6a3b]"
          />
          {searchingUsers && (
            <p className="mt-2 text-[13px] text-[#8a938e]">Searching...</p>
          )}
          {userResults.map((user) => (
            <button
              key={user.id}
              onClick={() => startConversation(user)}
              className="mt-1 flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[#f0f7f2]"
            >
              <AvatarCircle initials={initialsFor(user)} seed={user.username} size="h-9 w-9" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold text-[#1a2b23]">
                  {displayName(user)}
                </span>
                <span className="block truncate text-[13px] text-[#8a938e]">@{user.username}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a938e]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search messages"
          className="min-h-12 w-full rounded-full border border-[#e9e0d0] bg-white py-3 pl-12 pr-4 text-sm text-[#1a2b23] placeholder:text-[#8a938e] outline-none focus:border-[#0a6a3b]"
        />
      </div>

      <div className={`flex-1 overflow-y-auto civic-scrollbar ${mobile ? '' : ''}`}>
        {loading && (
          <div className="flex items-center justify-center rounded-2xl border border-[#e9e0d0] bg-white px-5 py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0a6a3b] border-t-transparent" role="status" aria-label="Loading messages" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-[#e9e0d0] bg-white px-5 py-10 text-center">
            <p className="font-serif text-xl text-[#1a2b23]">Could not load messages</p>
            <p className="mt-2 text-sm text-[#8a938e]">{error}</p>
            <button
              onClick={loadMessages}
              className="mt-4 rounded-full bg-[#0a6a3b] px-5 py-2 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredConversations.length > 0 && (
          <div className="divide-y divide-[#f0ebe0] rounded-2xl border border-[#e9e0d0] bg-white">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation === conversation.id && !pendingCounterpart;
              return (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`w-full px-4 py-4 text-left transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-[#faf7f1] ${
                    isSelected ? 'bg-[#f0f7f2]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AvatarCircle
                      initials={conversation.user.initials}
                      seed={conversation.user.username}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[15px] font-bold text-[#1a2b23]">
                          {conversation.user.name}
                        </p>
                        {conversation.lastMessage.unread && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-[#0a6a3b]"
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-[#8a938e]">
                        {conversation.user.username} · {conversation.lastMessage.timestamp}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#5b6660]">
                        {conversation.lastMessage.text}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && !error && !filteredConversations.length && (
          <div className="rounded-2xl border border-[#e9e0d0] bg-white px-5 py-12 text-center">
            <p className="font-serif text-xl text-[#1a2b23]">
              {conversations.length ? 'No messages found' : 'No conversations yet'}
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#8a938e]">
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
      <div className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-[#e9e0d0] bg-white">
        <div className="border-b border-[#f0ebe0] bg-white px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {mobile && (
                <button
                  onClick={() => setMobileView('list')}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e9e0d0] bg-white text-[#1a2b23]"
                  aria-label="Back to conversations"
                >
                  <Icon name="arrow_back" className="text-xl" />
                </button>
              )}

              <AvatarCircle
                initials={selectedConv.user.initials}
                seed={selectedConv.user.username}
                size="h-12 w-12"
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-serif text-lg text-[#1a2b23]">
                    {selectedConv.user.name}
                  </h2>
                  {selectedConv.user.verified && (
                    <span className="rounded-full bg-[#e3f2e7] px-2.5 py-0.5 text-[11px] font-bold text-[#0a6a3b]">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13px] text-[#8a938e]">
                  {selectedConv.user.username}
                </p>
              </div>
            </div>

            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#8a938e] transition hover:bg-[#faf7f1] hover:text-[#1a2b23]"
              aria-label="Conversation options"
            >
              <Icon name="more_horiz" className="text-xl" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#faf7f1] px-4 py-6 lg:px-6">
          <div className="w-full space-y-4">
            {currentMessages.length === 0 && (
              <p className="py-10 text-center text-sm text-[#8a938e]">
                Say hello to start this conversation.
              </p>
            )}
            {currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === 'me'
                      ? 'rounded-br-md bg-[#0a6a3b] text-white'
                      : 'rounded-bl-md border border-[#e9e0d0] bg-white text-[#1a2b23]'
                  }`}
                >
                  <p className="text-[14px] leading-6">{message.text}</p>
                  <p
                    className={`mt-1 text-[12px] ${
                      message.sender === 'me' ? 'text-white/70' : 'text-[#8a938e]'
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && !loading && (
          <p className="border-t border-[#f0ebe0] bg-white px-4 py-2 text-center text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="border-t border-[#f0ebe0] bg-white px-4 py-4 lg:px-6">
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
              placeholder="Write a reply"
              rows={1}
              className="max-h-40 min-h-[50px] flex-1 resize-y rounded-2xl border border-[#e9e0d0] bg-white px-4 py-3 text-sm leading-6 text-[#1a2b23] placeholder:text-[#8a938e] outline-none focus:border-[#0a6a3b]"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sending}
              aria-label="Send message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0a6a3b] text-white transition hover:brightness-105 disabled:opacity-45"
            >
              <Icon name="send" className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-[#e9e0d0] bg-white">
        <div className="px-6 py-12 text-center">
          <p className="font-serif text-xl text-[#1a2b23]">No conversations yet</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#8a938e]">
            Start a new conversation to message a citizen or official.
          </p>
        </div>
      </div>
    );

  return (
    <StandardLayout showRightSidebar={false}>
      <div className="min-h-screen bg-[#f6f1e7]">
        <div className="px-4 py-6 lg:hidden">
          {mobileView === 'list' ? renderConversationList(true) : renderThreadPane(true)}
        </div>

        <div className="hidden lg:grid lg:min-h-screen lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-6 lg:p-6">
          <div className="sticky top-0 h-[calc(100vh-3rem)] overflow-y-auto civic-scrollbar">
            {renderConversationList()}
          </div>
          {renderThreadPane()}
        </div>
      </div>
    </StandardLayout>
  );
}
