import { supabase } from '@/lib/supabase';

/** Link an existing auth user (by email) to a doctor profile and set role = doctor */
export async function linkDoctorToUser(doctorId, userEmail) {
  const email = userEmail?.trim();
  if (!email) return;

  const { error } = await supabase.rpc('admin_link_doctor_user', {
    p_doctor_id: doctorId,
    p_user_email: email,
  });

  if (error) throw error;
}

export { adminSetUserBans } from '@/api/moderation';
