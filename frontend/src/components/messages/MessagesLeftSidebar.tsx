import { Icon } from '../../components/common';

interface MessagesLeftSidebarProps {
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

export default function MessagesLeftSidebar({
  activeConversationId,
  onConversationSelect,
}: MessagesLeftSidebarProps) {
  const conversations = [
    {
      id: '1',
      name: 'City Planning Team',
      avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
      lastMessage: 'Thanks for the update!',
      timestamp: '2m ago',
      unread: 2,
      verified: true,
    },
    {
      id: '2',
      name: 'Environmental Committee',
      avatar: 'https://images.unsplash.com/photo-1577896851905-dc638c4e7e7a?w=100&h=100&fit=crop',
      lastMessage: 'Meeting scheduled for Friday',
      timestamp: '1h ago',
      unread: 0,
      verified: true,
    },
    {
      id: '3',
      name: 'Babatunde Adebayo',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      lastMessage: 'Sounds good to me',
      timestamp: '5h ago',
      unread: 0,
      verified: false,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your conversations</p>
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all">
          <Icon name="add" className="text-primary text-xl" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon
          name="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
        />
        <input
          type="text"
          placeholder="Search messages..."
          className="w-full bg-slate-100 dark:bg-navy-900 border-none rounded-lg py-2 pl-10 pr-4 focus:ring-1 focus:ring-primary text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
        />
      </div>

      {/* Conversations */}
      <div className="space-y-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onConversationSelect(conv.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
              activeConversationId === conv.id
                ? 'bg-primary/15 border border-primary/50'
                : 'hover:bg-slate-100 dark:hover:bg-navy-800 border border-transparent'
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={conv.avatar}
                alt={conv.name}
                className="size-10 rounded-full border border-slate-200 dark:border-navy-700"
              />
              {conv.unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full size-5 flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className={`text-sm font-semibold text-slate-900 dark:text-white truncate ${
                  conv.unread > 0 ? 'font-bold' : 'font-medium'
                }`}>
                  {conv.name}
                </p>
                {conv.verified && (
                  <Icon name="verified" filled className="text-primary text-xs flex-shrink-0" />
                )}
              </div>
              <p className={`text-xs truncate ${
                conv.unread > 0
                  ? 'text-slate-600 dark:text-slate-300 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {conv.lastMessage}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
              {conv.timestamp}
            </span>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-navy-700">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all text-slate-700 dark:text-slate-300">
          <Icon name="group" className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium">New Group</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-all text-slate-700 dark:text-slate-300">
          <Icon name="request_quote" className="text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium">Message Requests</span>
        </button>
      </div>
    </div>
  );
}
