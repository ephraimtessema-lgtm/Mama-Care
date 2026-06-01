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

Enable **Realtime** for `mother_chat_messages` in **Database → Replication** if live chat does not update.

### 4. Auth (login, signup, email OTP)

1. **Authentication → Providers** → enable **Email**.
2. **Google (optional):** follow `supabase/email-templates/GOOGLE_AUTH_SETUP.md` or you will see “provider is not enabled”.
3. Set email **sender name** to **Mama-Care** under **Authentication → Emails**.
4. **Authentication → Providers → Email** → set **OTP length** to **6** (must match the app).
5. Copy **Confirm signup** HTML from `supabase/email-templates/confirm-signup.html` into **Authentication → Email Templates → Confirm signup** (subject: `Verify your email for Mama-Care`). Must include `{{ .Token }}`.
6. Users enter the **6-digit code** on `/verify-email` after signup.

The app opens on the home page. **Sign in** and **Sign up** are in the top-right corner. After signup, users verify email on `/verify-email` with the code from their inbox.

**Login required** for AI Chat, Forum, Mom Chat, Doctors, Library, and booking. Nav links send guests to sign-in first.

### 5. Admin & doctor roles (run once)

Run `supabase/migrations/003_roles_doctors_security.sql` in the SQL Editor. This adds:

- `doctor` role and secure row-level security (only admins manage doctors/articles; doctors see their own appointments)
- Links between `doctors` rows and user accounts

**Make yourself admin** (replace with your signup email):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'your-email@gmail.com');
```

**Admin dashboard:** `/admin` — add doctors, manage appointments & articles.

**Doctor dashboard:** `/doctor` — doctors confirm appointments and edit their profile (after admin verifies them).

**Add a doctor:** In admin, fill doctor details + use the same email they will use to sign up. When they register, they are auto-linked. Or link an existing account with **Portal login email**.

### 6. User history (run once if DB already exists)

Run `supabase/migrations/002_user_history.sql` in the SQL Editor. This adds:

- `ai_chat_messages` — AI chat saved per user (persists after closing the app)
- `profiles.flower_name` — same flower name each session
- `user_id` on forum posts and appointments

### 7. AI chat (Groq)

1. Get an API key from [console.groq.com](https://console.groq.com/keys).
2. Add to `.env.local`:
   ```
   VITE_GROQ_API_KEY=gsk_your_key_here
   VITE_GROQ_MODEL=llama-3.3-70b-versatile
   ```
3. Restart `npm run dev`.

### 8. Appointment confirmation emails (when doctor clicks Confirm)

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project.
2. Deploy the function:
   ```bash
   supabase functions deploy send-appointment-email
   ```
3. Set secrets (same Gmail App Password as Auth SMTP):
   ```bash
   supabase secrets set SMTP_HOST=smtp.gmail.com SMTP_PORT=465 SMTP_USER=your@gmail.com SMTP_PASS=your-app-password SMTP_FROM="Mama-Care <your@gmail.com>"
   ```
4. Patients must enter an **email** when booking. When a doctor clicks **Confirm**, they receive a “Yes — your appointment is confirmed” email automatically.

### 9. Run the app

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (JS with types) |
=======
A pregnancy support web app built with React, Vite, and **Supabase**.
