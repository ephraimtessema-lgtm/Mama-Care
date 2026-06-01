import { supabase } from '@/lib/supabase';

/**
 * Ask Edge Function to email the patient after doctor confirms/declines.
 * Requires: supabase functions deploy send-appointment-email
 * Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export async function sendAppointmentStatusEmail(appointmentId, type) {
  const { data, error } = await supabase.functions.invoke('send-appointment-email', {
    body: { appointmentId, type },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
