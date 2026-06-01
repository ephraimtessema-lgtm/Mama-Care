import { supabase } from '@/lib/supabase';
import { Appointment } from '@/api/entities';

export async function getDoctorForCurrentUser() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return null;

  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAppointmentsForDoctor(doctorId) {
  return Appointment.filter({ doctor_id: String(doctorId) }, '-created_date', 100);
}

export async function updateDoctorProfile(doctorId, patch) {
  const allowed = [
    'bio',
    'phone',
    'hospital',
    'location',
    'accepts_online',
    'accepts_physical',
    'consultation_fee',
  ];
  const safe = {};
  for (const key of allowed) {
    if (key in patch) safe[key] = patch[key];
  }

  const { data, error } = await supabase
    .from('doctors')
    .update(safe)
    .eq('id', doctorId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
