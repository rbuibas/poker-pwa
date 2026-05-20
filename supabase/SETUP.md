# Supabase setup

One-time setup for a fresh Supabase project. After this is done, just paste your keys into `.env.local` and `npm run dev`.

## 1. Get your keys

In the Supabase dashboard → **Project Settings → API**, copy:
- `Project URL` → `PUBLIC_SUPABASE_URL`
- `anon public` → `PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**never** ship to client)

Paste them into `poker-pwa/.env.local`.

## 2. Run the migration

**SQL Editor → New query**, paste the contents of [`migrations/001_initial.sql`](./migrations/001_initial.sql), run.

This creates `profiles`, `lounges`, `lounge_members`, the new-user trigger, RLS policies, and the `lounge_id_by_code` helper.

## 3. Create the `avatars` storage bucket

**Storage → New bucket**:
- Name: `avatars`
- Public bucket: **on**
- File size limit: `2 MB`
- Allowed MIME types: `image/jpeg, image/png, image/webp`

The RLS policies on `storage.objects` in the migration assume this bucket exists and is public.

## 4. Enable Google OAuth

**Authentication → Providers → Google → Enable**, paste your Google OAuth client ID + secret. (Google Cloud Console → Credentials → OAuth 2.0 Client ID, type "Web application".)

In Google Cloud, the authorized redirect URI is:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

## 5. Allow-list redirect URLs

**Authentication → URL Configuration → Redirect URLs**, add:
- `http://localhost:5173/auth/callback` (dev)
- `https://<your-prod-domain>/auth/callback` (when you deploy)

Set **Site URL** to `http://localhost:5173` during development.

## Reset / re-run

Migration is idempotent for the trigger only (uses `drop trigger if exists`). To re-run from scratch, drop the tables manually first or use a new Supabase project.
