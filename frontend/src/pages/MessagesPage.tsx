import { useMemo, useState } from 'react';
import { Icon } from '../components/common';
import StandardLayout from '../layouts/StandardLayout';

interface Conversation {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
    office?: string;
  };
  subject: string;
  status: string;
  lastMessage: {
    text: string;
    timestamp: string;
    unread: boolean;
  };
}

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
}

const initialConversations: Conversation[] = [
  {
    id: '1',
    user: {
      name: 'Lagos Works Department',
      username: '@lagos_works',
      avatar:
        'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
      verified: true,
      office: 'Verified official',
    },
    subject: 'Bridge expansion case update',
    status: 'Open case',
    lastMessage: {
      text: 'Field engineers will inspect the reported vibrations this afternoon.',
      timestamp: '2h',
      unread: true,
    },
  },
  {
    id: '2',
    user: {
      name: 'Hon. Julia Smith',
      username: '@jsmith_state',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      verified: true,
      office: 'State official',
    },
    subject: 'Road expansion update',
    status: 'Waiting on reply',
    lastMessage: {
      text: 'Your message has been added to the review list.',
      timestamp: '1d',
      unread: false,
    },
  },
  {
    id: '3',
    user: {
      name: 'Community Moderator',
      username: '@civic_moderator',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      office: 'Moderator',
    },
    subject: 'Case file clarification',
    status: 'Need more info',
    lastMessage: {
      text: 'Please attach one more image to strengthen the infrastructure report.',
      timestamp: '3d',
      unread: false,
    },
  },
];

const initialMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      sender: 'them',
      text: 'This chat is open for follow-up on your bridge report.',
      timestamp: '10:12 AM',
    },
    {
      id: '2',
      sender: 'me',
      text: 'Residents are concerned because heavy vehicles continue to pass through the affected lane.',
      timestamp: '10:18 AM',
    },
    {
      id: '3',
      sender: 'them',
      text: 'Field engineers will inspect the reported vibrations this afternoon and publish a status note afterward.',
      timestamp: '10:34 AM',
    },
  ],
  '2': [
    {
      id: '1',
      sender: 'them',
      text: 'Your message has been reviewed and added to the review list.',
      timestamp: 'Yesterday',
    },
  ],
  '3': [
    {
      id: '1',
      sender: 'them',
      text: 'Please attach one more image to strengthen the infrastructure report.',
      timestamp: '3 days ago',
    },
  ],
};

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string>('1');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const [conversations, setConversations] = useState(initialConversations);
  const [messagesByConversation, setMessagesByConversation] = useState(initialMessages);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      [conversation.user.name, conversation.subject, conversation.lastMessage.text, conversation.status]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [conversations, searchQuery]);

  const selectedConv = conversations.find((conversation) => conversation.id === selectedConversation) || null;
  const currentMessages = useMemo(
    () => messagesByConversation[selectedConversation] || [],
    [messagesByConversation, selectedConversation],
  );

  const selectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: { ...conversation.lastMessage, unread: false },
            }
          : conversation,
      ),
    );
    setMobileView('thread');
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    setMessagesByConversation((current) => ({
      ...current,
      [selectedConversation]: [
        ...(current[selectedConversation] || []),
        {
          id: `${Date.now()}`,
          sender: 'me',
          text: messageText.trim(),
          timestamp: 'Now',
        },
      ],
    }));

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation
          ? {
              ...conversation,
              lastMessage: {
                text: messageText.trim(),
                timestamp: 'Now',
                unread: false,
              },
            }
          : conversation,
      ),
    );

    setMessageText('');
  };

  const renderConversationList = (mobile = false) => (
    <div className={`flex h-full flex-col ${mobile ? 'space-y-4' : ''}`}>
      <div
        className={mobile ? 'civic-section' : 'border-b px-5 py-5'}
        style={mobile ? undefined : { borderColor: 'var(--civic-border)' }}
      >
        <p className="civic-label">Messages</p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[var(--civic-text)]">Messages</h1>
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
        {filteredConversations.map((conversation) => {
          const isSelected = selectedConversation === conversation.id;
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
                <img
                  src={conversation.user.avatar}
                  alt={conversation.user.name}
                  className="size-11 rounded-md object-cover"
                />
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

                  <p className="mt-3 text-sm font-bold text-[var(--civic-text)]">{conversation.subject}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-gold)]">
                    {conversation.status}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--civic-muted)]">
                    {conversation.lastMessage.text}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {!filteredConversations.length && (
          <div className={`${mobile ? 'civic-section' : 'px-5 py-10'} text-center`}>
            <Icon name="mail" className="mx-auto mb-4 text-5xl text-[var(--civic-muted)]" />
            <p className="text-lg font-bold text-[var(--civic-text)]">No messages found</p>
            <p className="mt-2 text-sm text-[var(--civic-muted)]">Try a different search phrase.</p>
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
          style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-surface)' }}
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

              <img
                src={selectedConv.user.avatar}
                alt={selectedConv.user.name}
                className="size-12 rounded-md object-cover"
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-black tracking-[-0.03em] text-[var(--civic-text)]">
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
                <p className="mt-1 text-sm text-[var(--civic-muted)]">{selectedConv.subject}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--civic-gold)]">
                  {selectedConv.status}
                </p>
              </div>
            </div>

            <button className="civic-icon-button size-10">
              <Icon name="more_horiz" className="text-xl" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 px-4 py-6 lg:px-8"
          style={{ background: 'linear-gradient(180deg, var(--civic-bg) 0%, var(--civic-surface-soft) 100%)' }}
        >
          <div className="mx-auto max-w-4xl space-y-4">
            {currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[720px] rounded-[20px] px-5 py-4"
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

        <div className="border-t px-4 py-4 lg:px-8" style={{ borderColor: 'var(--civic-border)', background: 'var(--civic-surface)' }}>
          <div className="mx-auto flex max-w-4xl items-end gap-3">
            <button className="hidden civic-icon-button size-10 sm:flex" aria-label="Add image">
              <Icon name="image" className="text-xl" />
            </button>
            <button className="hidden civic-icon-button size-10 sm:flex" aria-label="Attach file">
              <Icon name="attach_file" className="text-xl" />
            </button>
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Write a reply..."
              rows={1}
              className="max-h-40 min-h-[50px] flex-1 resize-y rounded-md bg-transparent px-4 py-3 text-sm leading-6 text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] outline-none"
              style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-border)' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
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
            style={{ borderRight: '1px solid var(--civic-border)', background: 'var(--civic-surface)' }}
          >
            {renderConversationList()}
          </div>
          {renderThreadPane()}
        </div>
      </div>
    </StandardLayout>
  );
}
