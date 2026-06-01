import { supabase } from '@/lib/supabase';

function mapRow(row) {
  if (!row) return row;
  return {
    ...row,
    created_date: row.created_at,
  };
}

export async function getPartnerProfile(partnerId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, flower_name, full_name')
    .eq('id', partnerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadPrivateMessages(userId, partnerId, limit = 200) {
  const { data, error } = await supabase
    .from('mother_private_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`,
    )
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function sendPrivateMessage({
  senderId,
  recipientId,
  senderFlowerName,
  content,
}) {
  const { data, error } = await supabase
    .from('mother_private_messages')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      sender_flower_name: senderFlowerName,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function listRecentPrivatePartners(userId, limit = 30) {
  const { data, error } = await supabase
    .from('mother_private_messages')
    .select('sender_id, recipient_id, sender_flower_name, created_at')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const seen = new Set();
  const partners = [];

  for (const row of data || []) {
    const partnerId = row.sender_id === userId ? row.recipient_id : row.sender_id;
    if (!partnerId || seen.has(partnerId)) continue;
    seen.add(partnerId);
    partners.push({
      id: partnerId,
      lastFlowerName: row.sender_id === userId ? null : row.sender_flower_name,
      lastAt: row.created_at,
    });
  }

  const withNames = await Promise.all(
    partners.map(async (p) => {
      const profile = await getPartnerProfile(p.id).catch(() => null);
      return {
        ...p,
        flowerName: profile?.flower_name || p.lastFlowerName || 'Flower Mom',
      };
    }),
  );

  return withNames;
}

export function subscribePrivateMessages(userId, partnerId, onMessage) {
  const channel = supabase
    .channel(`mother-dm-${userId}-${partnerId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mother_private_messages' },
      (payload) => {
        const m = payload.new;
        const inThread =
          (m.sender_id === userId && m.recipient_id === partnerId) ||
          (m.sender_id === partnerId && m.recipient_id === userId);
        if (inThread) onMessage(mapRow(m));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
