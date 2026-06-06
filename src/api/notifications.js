import { supabase } from '@/lib/supabase';

export async function listNotifications(userId, limit = 40) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getUnreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(userId, notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

export async function notifyForumReply(postId, replyPreview) {
  const { error } = await supabase.rpc('notify_forum_reply', {
    p_post_id: postId,
    p_reply_preview: replyPreview?.slice(0, 200) || '',
  });

  if (error) throw error;
}

export function subscribeNotifications(userId, onChange) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => onChange?.(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Filter by user notification preferences */
export function filterNotificationsByPrefs(notifications, prefs) {
  if (!prefs) return notifications;
  return notifications.filter((n) => {
    if (n.type === 'appointment') {
      return prefs.notifications?.appointmentReminders !== false;
    }
    if (n.type === 'forum_reply') {
      return prefs.notifications?.communityReplies !== false;
    }
    if (n.type === 'private_chat') {
      return prefs.community?.allowDirectMessages !== false;
    }
    return true;
  });
}
