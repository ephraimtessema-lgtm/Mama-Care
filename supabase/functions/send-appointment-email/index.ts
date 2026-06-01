// Deploy: supabase functions deploy send-appointment-email
// Secrets (Dashboard → Edge Functions → Secrets, or CLI):
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465
//   SMTP_USER=your@gmail.com
//   SMTP_PASS=your-google-app-password
//   SMTP_FROM=Mama-Care <your@gmail.com>

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EmailType = 'confirmed' | 'declined';

function buildHtml(type: EmailType, apt: Record<string, unknown>, doctorName: string) {
  const patient = String(apt.patient_name || 'there');
  const date = String(apt.date || '—');
  const time = String(apt.time || '—');
  const visitType = apt.type === 'physical' ? 'In-person visit' : 'Online video call';
  const reason = apt.reason ? `<p style="color:#666;font-size:14px;"><strong>Reason:</strong> ${apt.reason}</p>` : '';

  if (type === 'declined') {
    return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;background:#fff5f7;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #fecdd3;">
    <p style="font-size:28px;margin:0 0 8px;">Mama-Care 💗</p>
    <h1 style="color:#9f1239;margin:0 0 16px;font-size:22px;">Appointment update</h1>
    <p style="color:#374151;line-height:1.6;">Hello <strong>${patient}</strong>,</p>
    <p style="color:#374151;line-height:1.6;">We're sorry — <strong>Dr. ${doctorName}</strong> is unable to take your appointment on <strong>${date}</strong> at <strong>${time}</strong>.</p>
    <p style="color:#374151;line-height:1.6;">Please book another time or choose another doctor on Mama-Care. We're here for you 🌸</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">— The Mama-Care team</p>
  </div>
</body></html>`;
  }

  return `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;background:#fff5f7;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #fecdd3;">
    <p style="font-size:28px;margin:0 0 8px;">Mama-Care 💗</p>
    <h1 style="color:#16a34a;margin:0 0 8px;font-size:22px;">Yes — your appointment is confirmed! ✅</h1>
    <p style="color:#374151;line-height:1.6;">Hello <strong>${patient}</strong>,</p>
    <p style="color:#374151;line-height:1.6;">Great news! <strong>Dr. ${doctorName}</strong> has approved your appointment. We look forward to caring for you and your baby 🤰💕</p>
    <div style="background:#fff1f2;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="margin:4px 0;color:#9f1239;"><strong>📅 Date:</strong> ${date}</p>
      <p style="margin:4px 0;color:#9f1239;"><strong>🕐 Time:</strong> ${time}</p>
      <p style="margin:4px 0;color:#9f1239;"><strong>📍 Type:</strong> ${visitType}</p>
    </div>
    ${reason}
    <p style="color:#374151;line-height:1.6;">If you have questions before your visit, reply to this email or call the clinic number on your booking.</p>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">This is not for emergencies — call emergency services if you need urgent help.</p>
    <p style="color:#9ca3af;font-size:12px;">— The Mama-Care team 🌸</p>
  </div>
</body></html>`;
}

function subjectFor(type: EmailType, doctorName: string) {
  if (type === 'declined') {
    return `Mama-Care: appointment update with Dr. ${doctorName}`;
  }
  return `✅ Confirmed: your Mama-Care appointment with Dr. ${doctorName}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { appointmentId, type } = (await req.json()) as {
      appointmentId?: string;
      type?: EmailType;
    };

    if (!appointmentId || !type || !['confirmed', 'declined'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid appointmentId or type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: apt, error: aptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (aptError || !apt) {
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const to = (apt.patient_email as string)?.trim();
    if (!to) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, reason: 'No patient email on appointment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return new Response(
        JSON.stringify({
          ok: false,
          skipped: true,
          reason: 'SMTP not configured on Edge Function (set SMTP_HOST, SMTP_USER, SMTP_PASS secrets)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const doctorName = String(apt.doctor_name || 'your doctor');
    const html = buildHtml(type, apt, doctorName);
    const subject = subjectFor(type, doctorName);

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: Number(Deno.env.get('SMTP_PORT') || '465'),
        tls: true,
        auth: { username: smtpUser, password: smtpPass },
      },
    });

    await client.send({
      from: smtpFrom!,
      to,
      subject,
      html,
    });
    await client.close();

    return new Response(JSON.stringify({ ok: true, sentTo: to }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
