import { supabase } from '@/lib/supabase';
import { ForumPost } from '@/api/entities';

export async function listMyForumLikedPostIds(userId) {
  const { data, error } = await supabase
    .from('forum_post_likes')
    .select('post_id')
    .eq('user_id', userId);

  if (error) throw error;
  return new Set((data || []).map((row) => row.post_id));
}

/** @returns {boolean} true if liked after toggle */
export async function toggleForumLike(postId, userId) {
  const { data: existing, error: readError } = await supabase
    .from('forum_post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) throw readError;

  if (existing) {
    const { error } = await supabase
      .from('forum_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from('forum_post_likes').insert({
    post_id: postId,
    user_id: userId,
  });
  if (error) throw error;
  return true;
}

export async function deleteForumPost(postId, userId, isAdmin = false) {
  let query = supabase.from('forum_posts').delete().eq('id', postId);
  if (!isAdmin) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteForumReply(postId, replyId, userId, isAdmin = false) {
  const post = await ForumPost.get(postId);
  if (!post) throw new Error('Post not found');

  const replies = post.replies || [];
  const target = replies.find((r) => r.id === replyId);
  if (!target) return;

  if (!isAdmin && target.user_id !== userId) {
    throw new Error('You can only delete your own reply');
  }

  const next = replies.filter((r) => r.id !== replyId);
  const { error } = await supabase.from('forum_posts').update({ replies: next }).eq('id', postId);
  if (error) throw error;
}
