# Mama-Care

A pregnancy support web app built with React, Vite, and **Supabase**.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
3. Paste them into `.env.local` (see `.env.example`).

### 3. Run the database schema

In the Supabase dashboard, open **SQL Editor** and run the full contents of:

```
supabase/schema.sql
```

Also run migrations in order if setting up an existing project: `002`, `003`, `004`.

Enable **Realtime** for `mother_chat_messages` in **Database → Replication** if live chat does not update.

### 4. Auth (login, signup, email OTP)

1. **Authentication → Providers** → enable **Email**.
2. **Google (optional):** follow `supabase/email-templates/GOOGLE_AUTH_SETUP.md` or you will see “provider is not enabled”.
3. Set email **sender name** to **Mama-Care** under **Authentication → Emails**.
4. **Authentication → Providers → Email** → set **OTP length** to **6** (must match the app).
5. Copy **Confirm signup** HTML from `supabase/email-templates/confirm-signup.html` into **Authentication → Email Templates → Confirm signup** (subject: `Verify your email for Mama-Care`). Must include `{{ .Token }}`.
6. Users enter the **6-digit code** on `/verify-email` after signup.

**Login required** for AI Chat, Forum, Mom Chat, Doctors, Library, and booking.

### 5. Admin & doctor roles (run once)

Run `supabase/migrations/003_roles_doctors_security.sql` in the SQL Editor.

**Make yourself admin** (replace with your signup email):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your-email@gmail.com');
```

### 6. AI chat (Groq)

1. Get an API key from [console.groq.com](https://console.groq.com/keys).
2. Add to `.env.local` (see `.env.example`).
3. Restart `npm run dev`.

### 7. Appointment confirmation emails

Deploy `supabase/functions/send-appointment-email` and set SMTP secrets (see README section in repo history or Supabase dashboard).

### 8. Run locally

```bash
npm run dev
```

## Deploy on Vercel

### A. Import from GitHub

1. Push this repo to GitHub (if you have not already).
2. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**.
3. Import **Mama-Care** (your GitHub repo).
4. Vercel should auto-detect **Vite**. Confirm:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add (same values as `.env.local`):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your anon key |
   | `VITE_GROQ_API_KEY` | your Groq key |
   | `VITE_GROQ_MODEL` | `llama-3.3-70b-versatile` |

6. Click **Deploy**.

Your live URL will look like `https://mama-care-xxx.vercel.app`.

### B. Supabase URLs (required after deploy)

In **Supabase → Authentication → URL Configuration**:

| Field | Example |
|-------|---------|
| **Site URL** | `https://your-app.vercel.app` |
| **Redirect URLs** | `https://your-app.vercel.app/**` |

Add the same URL under **Google Cloud Console** OAuth redirect URIs if you use Google sign-in (see `supabase/email-templates/GOOGLE_AUTH_SETUP.md`).

### C. Redeploy after env changes

If you add or change environment variables in Vercel, open the project → **Deployments** → **⋯** on the latest → **Redeploy**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (JS with types) |
