-- SCENE HAUS initial schema
-- Domains: profiles, branches/booths, reservations, scene pass, feed, studio originals

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  handle text not null unique,
  avatar_url text,
  initials text default 'J',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_handle_idx on public.profiles (handle);

-- ---------------------------------------------------------------------------
-- Studio locations & booth catalog
-- ---------------------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  address text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.booth_types (
  id text primary key,
  name text not null,
  description text not null,
  capacity_label text,
  icon_key text,
  sort_order int not null default 0
);

create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  is_available boolean not null default true,
  unique (branch_id, slot_date, start_time)
);

create index if not exists time_slots_branch_date_idx
  on public.time_slots (branch_id, slot_date);

-- ---------------------------------------------------------------------------
-- Reservations & SCENE PASS
-- ---------------------------------------------------------------------------
create type public.reservation_status as enum (
  'pending',
  'confirmed',
  'cancelled',
  'completed'
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid not null references public.branches (id),
  booth_type_id text not null references public.booth_types (id),
  reserved_date date not null,
  reserved_time time not null,
  preset_label text not null default '좌우 이동 프리셋',
  status public.reservation_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_user_idx on public.reservations (user_id);
create index if not exists reservations_date_idx on public.reservations (reserved_date);

create table if not exists public.scene_passes (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pass_code text not null unique,
  qr_payload text not null,
  is_active boolean not null default true,
  issued_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists scene_passes_user_idx on public.scene_passes (user_id);

-- ---------------------------------------------------------------------------
-- Feed / shorts / challenges
-- ---------------------------------------------------------------------------
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  handle text not null,
  title text not null,
  caption text,
  music_label text,
  video_url text not null,
  thumbnail_url text,
  view_count int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);

create table if not exists public.user_shorts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  video_url text,
  thumbnail_url text not null,
  view_label text not null default '0.6K',
  created_at timestamptz not null default now()
);

create index if not exists user_shorts_user_idx on public.user_shorts (user_id);

create table if not exists public.saved_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_post_id uuid references public.feed_posts (id) on delete set null,
  title text,
  thumbnail_url text not null,
  view_label text not null default '0.6K',
  created_at timestamptz not null default now(),
  unique (user_id, feed_post_id)
);

create index if not exists saved_challenges_user_idx on public.saved_challenges (user_id);

-- ---------------------------------------------------------------------------
-- Studio workroom: original footage notifications
-- ---------------------------------------------------------------------------
create type public.original_status as enum (
  'arrived',
  'editing',
  'ready',
  'archived'
);

create table if not exists public.studio_originals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete set null,
  branch_id uuid references public.branches (id),
  title text not null default '원본 영상',
  duration_label text not null default '00:45',
  thumbnail_url text,
  video_url text,
  status public.original_status not null default 'arrived',
  notice_title text not null default '원본 영상 도착!',
  notice_body text not null default '홍대 본점에서 촬영한 원본이 도착했습니다. 편집을 시작해 보세요.',
  created_at timestamptz not null default now()
);

create index if not exists studio_originals_user_idx on public.studio_originals (user_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, handle, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', '지유나'),
    coalesce(new.raw_user_meta_data->>'handle', 'Jiyuna_scene_' || substr(new.id::text, 1, 6)),
    coalesce(new.raw_user_meta_data->>'initials', 'J')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed data aligned with current App.js dummy content
-- ---------------------------------------------------------------------------
insert into public.branches (id, name, short_name, address)
values (
  '11111111-1111-1111-1111-111111111111',
  'SCENE HAUSE 홍대점',
  '홍대 본점',
  '서울 마포구 와우산로 21길 20'
)
on conflict (id) do nothing;

insert into public.booth_types (id, name, description, capacity_label, icon_key, sort_order)
values
  ('solo', '솔로 부스', '1~2인 프라이빗 촬영', '1~2인', 'person-outline', 1),
  ('group', '그룹 부스', '3~4인 프라이빗 촬영', '3~4인', 'people-outline', 2),
  ('motion', '모션 부스', '천장형 레일카메라 촬영', '레일카메라', 'videocam-outline', 3)
on conflict (id) do nothing;

insert into public.time_slots (branch_id, slot_date, start_time)
values
  ('11111111-1111-1111-1111-111111111111', '2026-07-12', '14:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-12', '14:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-12', '15:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-12', '15:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-13', '14:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-13', '14:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-13', '15:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-13', '15:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-14', '14:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-14', '14:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-14', '15:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-14', '15:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-15', '14:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-15', '14:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-15', '15:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-15', '15:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-16', '14:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-16', '14:30'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-16', '15:00'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-16', '15:30')
on conflict (branch_id, slot_date, start_time) do nothing;

insert into public.feed_posts (handle, title, caption, music_label, video_url)
values
  (
    '@vie.node',
    'Hype Boy 미러샷 튜토리얼',
    '부스에서 완벽한 각도로 찍...',
    'Hype Boy - New J',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  ),
  (
    '@cjs.dksss',
    'MOKA "It''s Me" STUDIO',
    'CHOOM Hype Boy 미러...',
    'It''s Me - ILLIT',
    'https://www.w3schools.com/html/mov_bbb.mp4'
  ),
  (
    '@cjs.dksss',
    'MOKA "It''s Me" STUDIO',
    'CHOOM Hype Boy 미러...',
    'Miss you - scens',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.booth_types enable row level security;
alter table public.time_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.scene_passes enable row level security;
alter table public.feed_posts enable row level security;
alter table public.user_shorts enable row level security;
alter table public.saved_challenges enable row level security;
alter table public.studio_originals enable row level security;

-- Public catalog / feed readable by anyone
create policy "branches_public_read" on public.branches
  for select using (true);

create policy "booth_types_public_read" on public.booth_types
  for select using (true);

create policy "time_slots_public_read" on public.time_slots
  for select using (true);

create policy "feed_posts_public_read" on public.feed_posts
  for select using (is_published = true);

-- Profiles
create policy "profiles_read_own_or_public" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Reservations / passes / studio / gallery: owner only
create policy "reservations_select_own" on public.reservations
  for select using (auth.uid() = user_id);

create policy "reservations_insert_own" on public.reservations
  for insert with check (auth.uid() = user_id);

create policy "reservations_update_own" on public.reservations
  for update using (auth.uid() = user_id);

create policy "scene_passes_select_own" on public.scene_passes
  for select using (auth.uid() = user_id);

create policy "scene_passes_insert_own" on public.scene_passes
  for insert with check (auth.uid() = user_id);

create policy "user_shorts_select_own" on public.user_shorts
  for select using (auth.uid() = user_id);

create policy "user_shorts_insert_own" on public.user_shorts
  for insert with check (auth.uid() = user_id);

create policy "saved_challenges_select_own" on public.saved_challenges
  for select using (auth.uid() = user_id);

create policy "saved_challenges_insert_own" on public.saved_challenges
  for insert with check (auth.uid() = user_id);

create policy "saved_challenges_delete_own" on public.saved_challenges
  for delete using (auth.uid() = user_id);

create policy "studio_originals_select_own" on public.studio_originals
  for select using (auth.uid() = user_id);

create policy "studio_originals_insert_own" on public.studio_originals
  for insert with check (auth.uid() = user_id);

create policy "studio_originals_update_own" on public.studio_originals
  for update using (auth.uid() = user_id);
