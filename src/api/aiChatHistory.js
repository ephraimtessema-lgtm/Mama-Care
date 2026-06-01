import { supabase } from '@/lib/supabase';

export async function listAiChatSessions(userId) {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAiChatSession(userId, title = 'New chat') {
  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .insert({ user_id: userId, title })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updateAiChatSession(sessionId, patch) {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function deleteAiChatMessage(userId, messageId) {
  const { error } = await supabase
    .from('ai_chat_messages')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId)
    .eq('role', 'user');

  if (error) throw error;
}

export async function deleteAiChatSession(userId, sessionId) {
  const { error } = await supabase
    .from('ai_chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function loadAiChatMessages(userId, sessionId, limit = 200) {
  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('id, role, content, is_emergency, created_at')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    is_emergency: row.is_emergency,
    timestamp: row.created_at,
  }));
}

export async function saveAiChatMessage(userId, sessionId, { role, content, is_emergency = false }) {
  const { error: msgError } = await supabase.from('ai_chat_messages').insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content,
    is_emergency,
  });
  if (msgError) throw msgError;

  await updateAiChatSession(sessionId, {}).catch(() => {});
}

/** @deprecated — use session APIs */
export async function loadAiChatHistory(userId, limit = 200) {
  const sessions = await listAiChatSessions(userId);
  if (sessions.length === 0) return [];
  return loadAiChatMessages(userId, sessions[0].id, limit);
}

export async function clearAiChatHistory(userId) {
  const { error } = await supabase.from('ai_chat_sessions').delete().eq('user_id', userId);
  if (error) throw error;
}

export function titleFromFirstMessage(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 'New chat';
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
}
