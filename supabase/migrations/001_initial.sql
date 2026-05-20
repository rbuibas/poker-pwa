-- Phase 1: profiles, lounges, lounge_members. No game tables yet.

-- =========================================================================
-- Profiles (extends auth.users)
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- Lounges
-- =========================================================================
-- 6-char alphanumeric join code. Generated server-side; collisions handled
-- in the SvelteKit action with a small retry on unique_violation (23505).
-- Confusable chars (0/O, 1/I/l) are mapped away via translate().
create or replace function public.generate_lounge_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  code := upper(
    substr(
      translate(
        encode(gen_random_bytes(12), 'base64'),
        '+/=OIl01oi',
        'ABCDEFGHJK'
      ),
      1, 6
    )
  );
  return code;
end;
$$;

create table public.lounges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default public.generate_lounge_code(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  persistent boolean not null default false,
  created_at timestamptz default now(),
  last_active_at timestamptz default now(),
  settings jsonb not null default '{
    "turn_timer_seconds": 30,
    "max_players": 9,
    "small_blind": 5,
    "big_blind": 10,
    "default_buy_in": 1000
  }'::jsonb
);

create index lounges_owner_id_idx on public.lounges(owner_id);

-- =========================================================================
-- Lounge members
-- =========================================================================
create table public.lounge_members (
  lounge_id uuid references public.lounges(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (lounge_id, user_id)
);

create index lounge_members_user_id_idx on public.lounge_members(user_id);

-- =========================================================================
-- Auto-create profile on signup
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Updated_at maintenance
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.lounges enable row level security;
alter table public.lounge_members enable row level security;

-- Profiles ----------------------------------------------------------------
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Lounges -----------------------------------------------------------------
-- Members can see their lounges. Also: anyone authenticated can look up a
-- lounge BY CODE (so the join-by-code flow works before they're a member).
-- The "by code" select is funneled through a SECURITY DEFINER helper so we
-- don't need a permissive SELECT policy.
create policy "Lounge visible to members"
  on public.lounges for select to authenticated
  using (
    exists (
      select 1 from public.lounge_members
      where lounge_members.lounge_id = lounges.id
        and lounge_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create lounges"
  on public.lounges for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owner can update lounge"
  on public.lounges for update to authenticated using (owner_id = auth.uid());

create policy "Owner can delete lounge"
  on public.lounges for delete to authenticated using (owner_id = auth.uid());

-- Lounge members ----------------------------------------------------------
create policy "Members can view lounge membership"
  on public.lounge_members for select to authenticated
  using (
    exists (
      select 1 from public.lounge_members m2
      where m2.lounge_id = lounge_members.lounge_id
        and m2.user_id = auth.uid()
    )
  );

create policy "Users can join lounges"
  on public.lounge_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave lounges"
  on public.lounge_members for delete to authenticated
  using (user_id = auth.uid());

-- =========================================================================
-- Join-by-code helper (SECURITY DEFINER)
-- =========================================================================
-- Returns the lounge id for a code if it exists. Lets non-members resolve a
-- code → id without exposing lounge rows via a permissive select policy.
create or replace function public.lounge_id_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result uuid;
begin
  select id into result from public.lounges where code = upper(p_code);
  return result;
end;
$$;

grant execute on function public.lounge_id_by_code(text) to authenticated;

-- =========================================================================
-- Storage: avatars bucket policies
-- =========================================================================
-- NOTE: create the `avatars` bucket (public) in the Supabase dashboard
--       before this section will have any effect.
create policy "Avatar images are publicly accessible"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
