import { supabase } from '@/lib/supabase';

export async function deleteMotherChatMessage(messageId, userId) {
  const { error } = await supabase
    .from('mother_chat_messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', userId);

  if (error) throw error;
}

export async function deletePrivateMessage(messageId, userId) {
  const { error } = await supabase
    .from('mother_private_messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', userId);

  if (error) throw error;
}

export async function adminSetUserBans(userId, { forum, motherChat }) {
  const { error } = await supabase.rpc('admin_set_user_bans', {
    p_user_id: userId,
    p_banned_from_forum: forum ?? null,
    p_banned_from_mother_chat: motherChat ?? null,
  });

  if (error) throw error;
}
