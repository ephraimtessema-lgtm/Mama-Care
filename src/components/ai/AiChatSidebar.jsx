import { Plus, Trash2, MessageSquare, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function AiChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  open,
  onToggle,
  className,
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/20 z-30"
          aria-label="Close chat menu"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'flex flex-col bg-white border-r border-rose-100 shrink-0 z-40 transition-transform duration-200',
          'fixed inset-y-0 left-0 w-[min(100vw-3rem,280px)] md:w-64',
          'top-14 md:top-0 h-[calc(100dvh-3.5rem)] md:h-full',
          open ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        <div className="p-3 border-b border-rose-100 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-800">Chats</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
            aria-label="Close chat history"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3">
          <Button
            type="button"
            onClick={onNewChat}
            className="w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white gap-2 h-10"
          >
            <Plus className="w-4 h-4" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sessions.length === 0 && (
            <p className="text-xs text-gray-400 text-center px-2 py-6">No chats yet. Start a new one!</p>
          )}
          {sessions.map((session) => {
            const active = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                className={cn(
                  'group relative flex items-start gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors',
                  active ? 'bg-rose-100 text-rose-900' : 'hover:bg-rose-50 text-gray-700',
                )}
                onClick={() => onSelectSession(session.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectSession(session.id)}
                role="button"
                tabIndex={0}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
                <div className="min-w-0 flex-1 pr-6">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-[10px] opacity-60">{formatWhen(session.updated_at)}</p>
                </div>
                <button
                  type="button"
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-red-500',
                    'opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-50 transition-opacity',
                  )}
                  title="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

export function AiChatMenuToggle({ open, onClick }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0 text-gray-600 hover:text-rose-600 hover:bg-rose-50"
      onClick={onClick}
      aria-label={open ? 'Close chat history' : 'Open chat history'}
      aria-expanded={open}
    >
      <PanelLeft className="w-5 h-5" />
    </Button>
  );
}
