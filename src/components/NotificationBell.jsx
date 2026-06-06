import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Calendar, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { mergePreferences } from '@/lib/userSettings';
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeNotifications,
  filterNotificationsByPrefs,
} from '@/api/notifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

function typeIcon(type) {
  if (type === 'appointment') return Calendar;
  if (type === 'private_chat') return MessageCircle;
  if (type === 'forum_reply') return Heart;
  return Bell;
}

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const prefs = mergePreferences(user?.preferences);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
    qc.invalidateQueries({ queryKey: ['notifications_unread', user?.id] });
  };

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => listNotifications(user.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications_unread', user?.id],
    queryFn: () => getUnreadNotificationCount(user.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!user?.id) return undefined;
    return subscribeNotifications(user.id, invalidate);
  }, [user?.id]);

  if (!user) return null;

  const visible = filterNotificationsByPrefs(notifications, prefs);
  const visibleUnread = visible.filter((n) => !n.read_at).length;

  async function openNotification(n) {
    if (!n.read_at) {
      await markNotificationRead(user.id, n.id).catch(() => {});
      invalidate();
    }
    if (n.link) navigate(n.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative shrink-0 text-gray-600 dark:text-gray-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-gray-800"
          aria-label={`Notifications${visibleUnread ? `, ${visibleUnread} unread` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {visibleUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {visibleUnread > 9 ? '9+' : visibleUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,360px)] rounded-xl p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 dark:border-gray-800">
          <DropdownMenuLabel className="p-0 font-semibold text-gray-900 dark:text-gray-100">
            Notifications
          </DropdownMenuLabel>
          {visibleUnread > 0 && (
            <button
              type="button"
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
              onClick={async () => {
                await markAllNotificationsRead(user.id).catch(() => {});
                invalidate();
              }}
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[min(60vh,320px)] overflow-y-auto">
          {visible.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10 px-4">
              No notifications yet. You&apos;ll see appointment updates, replies, and messages here.
            </p>
          )}
          {visible.map((n) => {
            const Icon = typeIcon(n.type);
            return (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 cursor-pointer rounded-none',
                  !n.read_at && 'bg-rose-50/80 dark:bg-rose-950/20',
                )}
                onClick={() => openNotification(n)}
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatWhen(n.created_at)}</p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Link to="/settings" className="block">
            <Button variant="ghost" size="sm" className="w-full rounded-lg text-xs text-gray-600">
              Notification settings
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
