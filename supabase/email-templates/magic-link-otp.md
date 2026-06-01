# Email setup — Mama-Care sender + email OTP

## 1. Sender name: **Mama-Care** (not Supabase)

**Authentication → Emails → SMTP Settings**

- **Sender name:** `Mama-Care`
- **Sender email:** use your domain if you have custom SMTP, or Supabase’s default address until you add SMTP

For production, connect **Custom SMTP** (e.g. Resend, SendGrid) so the “From” line shows `Mama-Care <noreply@yourdomain.com>`.

---

## 2. Sign-up verification OTP (6 digits)

Edit **both** templates that send codes:

### Confirm signup (used after **Create account**)

**Authentication → Email Templates → Confirm signup**

**Subject:** `Verify your email for Mama-Care`

Use `{{ .Token }}` for the 6-digit code (not only a link):

```html
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <div style="background: #e0f2fe; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #0c4a6e; margin: 0;">Verify your email</h1>
  </div>
  <div style="padding: 24px; border: 1px solid #fce7f3;">
    <p>Hey,</p>
    <p>Welcome to <strong>Mama-Care</strong>. Please verify your email to complete registration.</p>
    <p style="text-align: center; color: #666; font-size: 14px;">Your verification code</p>
    <p style="text-align: center; font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 8px;">
      {{ .Token }}
    </p>
    <p style="font-size: 14px; color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
    <p>See you there,<br><strong>The Mama-Care team</strong></p>
  </div>
</div>
```

### Magic Link (optional — passwordless / resend OTP)

Same `{{ .Token }}` pattern if you use OTP resend via `signInWithOtp`.

---

## 3. Auth providers

- **Email** — enabled (password sign-up)
- **Google** — enable under **Authentication → Providers → Google** and add redirect URL:  
  `http://localhost:5173/` (and your production URL)

---

## 4. App flow

1. Home opens normally — **Sign in** / **Sign up** top right  
2. **Sign up** → email + password → `/verify-email` → enter 6-digit code from email  
3. **Sign in** → email + password (or Google)

If you receive a **link** instead of a code, the template still uses the magic link URL — switch to `{{ .Token }}` as above.
