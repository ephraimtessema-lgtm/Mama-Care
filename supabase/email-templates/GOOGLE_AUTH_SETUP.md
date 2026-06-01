# Enable Google sign-in (fix “Unsupported provider”)

The error `provider is not enabled` means Google is **not turned on** in your Supabase project yet. The app cannot fix this in code — you enable it once in the dashboard.

## Steps

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers**.
3. Find **Google** → turn **Enable** on.
4. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/):
   - APIs & Services → Credentials → Create OAuth client ID
   - Type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173` (and your production URL)
   - Authorized redirect URIs: copy from Supabase Google provider page (looks like `https://YOUR_PROJECT.supabase.co/auth/v1/callback`)
5. Paste **Client ID** and **Client Secret** into Supabase Google provider settings → **Save**.
6. Go to **Authentication** → **URL Configuration**:
   - **Site URL:** `http://localhost:5173`
   - **Redirect URLs:** add `http://localhost:5173/**` and your production URL
7. Restart `npm run dev` and try **Continue with Google** again.

Until this is done, use **email + password** sign up and sign in.
