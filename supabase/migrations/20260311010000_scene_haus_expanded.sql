-- SCENE HAUS expanded schema
-- Prefer wide columns / extra tables over premature normalization that blocks product work.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.reservation_status as enum (
    'draft', 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pass_status as enum (
    'issued', 'scanned', 'expired', 'revoked'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.original_status as enum (
    'uploading', 'arrived', 'editing', 'ready', 'shared', 'archived', 'failed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.edit_mode as enum (
    'one_touch_ai', 'manual', 'none'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.feed_visibility as enum (
    'public', 'followers', 'private'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'reservation', 'scene_pass', 'original_ready', 'like', 'comment', 'system'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  handle text not null unique,
  initials text default 'J',
  avatar_url text,
  bio text,
  email text,
  phone text,
  result_count int not null default 0,
  reservation_count int not null default 0,
  follower_count int not null default 0,
  following_count int not null default 0,
  preferred_branch_id uuid,
  marketing_opt_in boolean not null default false,
  is_creator boolean not null default false,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_handle_idx on public.profiles (handle);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- Studio catalog
-- ---------------------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  short_name text not null,
  address text not null,
  address_detail text,
  city text,
  district text,
  latitude double precision,
  longitude double precision,
  phone text,
  open_time time,
  close_time time,
  timezone text not null default 'Asia/Seoul',
  cover_image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_preferred_branch_id_fkey;
alter table public.profiles
  add constraint profiles_preferred_branch_id_fkey
  foreign key (preferred_branch_id) references public.branches (id);

create table if not exists public.booth_types (
  id text primary key,
  name text not null,
  description text not null,
  capacity_min int not null default 1,
  capacity_max int not null default 2,
  capacity_label text,
  icon_key text,
  price_krw int,
  duration_minutes int not null default 30,
  features jsonb not null default '[]'::jsonb,
  preset_options jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.booth_rooms (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  booth_type_id text not null references public.booth_types (id),
  room_code text not null,
  room_name text,
  floor_label text,
  is_active boolean not null default true,
  equipment jsonb not null default '{}'::jsonb,
  unique (branch_id, room_code)
);

create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  booth_room_id uuid references public.booth_rooms (id) on delete set null,
  booth_type_id text references public.booth_types (id),
  slot_date date not null,
  start_time time not null,
  end_time time,
  capacity int not null default 1,
  booked_count int not null default 0,
  is_available boolean not null default true,
  price_override_krw int,
  unique (branch_id, booth_room_id, slot_date, start_time)
);

create index if not exists time_slots_branch_date_idx
  on public.time_slots (branch_id, slot_date);

-- ---------------------------------------------------------------------------
-- Reservations & SCENE PASS
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid not null references public.branches (id),
  booth_type_id text not null references public.booth_types (id),
  booth_room_id uuid references public.booth_rooms (id),
  time_slot_id uuid references public.time_slots (id),
  reserved_date date not null,
  reserved_time time not null,
  reserved_end_time time,
  party_size int not null default 1,
  preset_label text not null default '좌우 이동 프리셋',
  preset_payload jsonb not null default '{}'::jsonb,
  status public.reservation_status not null default 'confirmed',
  price_krw int,
  currency text not null default 'KRW',
  notes text,
  cancel_reason text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  checked_in_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_user_idx on public.reservations (user_id);
create index if not exists reservations_date_idx on public.reservations (reserved_date);
create index if not exists reservations_status_idx on public.reservations (status);

create table if not exists public.scene_passes (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pass_code text not null unique,
  qr_payload text not null,
  status public.pass_status not null default 'issued',
  booth_label text,
  preset_label text,
  scanned_at timestamptz,
  scanned_by text,
  kiosk_id text,
  is_active boolean not null default true,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists scene_passes_user_idx on public.scene_passes (user_id);

-- ---------------------------------------------------------------------------
-- Challenges & feed
-- ---------------------------------------------------------------------------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  cover_url text,
  music_title text,
  music_artist text,
  music_label text,
  reference_video_url text,
  difficulty text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  challenge_id uuid references public.challenges (id) on delete set null,
  handle text not null,
  title text not null,
  caption text,
  music_label text,
  music_title text,
  music_artist text,
  video_url text not null,
  thumbnail_url text,
  duration_seconds int,
  view_count int not null default 0,
  like_count int not null default 0,
  comment_count int not null default 0,
  bookmark_count int not null default 0,
  share_count int not null default 0,
  visibility public.feed_visibility not null default 'public',
  is_recommended boolean not null default true,
  is_published boolean not null default true,
  branch_id uuid references public.branches (id),
  booth_type_id text references public.booth_types (id),
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);
create index if not exists feed_posts_recommended_idx on public.feed_posts (is_recommended, created_at desc);

create table if not exists public.feed_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  parent_id uuid references public.feed_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feed_bookmarks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.user_shorts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feed_post_id uuid references public.feed_posts (id) on delete set null,
  reservation_id uuid references public.reservations (id) on delete set null,
  title text,
  caption text,
  video_url text,
  thumbnail_url text not null,
  view_label text not null default '0.6K',
  view_count int not null default 0,
  duration_seconds int,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_shorts_user_idx on public.user_shorts (user_id);

create table if not exists public.saved_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete set null,
  feed_post_id uuid references public.feed_posts (id) on delete set null,
  title text,
  thumbnail_url text not null,
  view_label text not null default '0.6K',
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index if not exists saved_challenges_user_idx on public.saved_challenges (user_id);

-- ---------------------------------------------------------------------------
-- Studio workroom
-- ---------------------------------------------------------------------------
create table if not exists public.studio_originals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reservation_id uuid references public.reservations (id) on delete set null,
  branch_id uuid references public.branches (id),
  booth_type_id text references public.booth_types (id),
  title text not null default '원본 영상',
  file_name text,
  duration_label text not null default '00:45',
  duration_seconds int,
  file_size_bytes bigint,
  thumbnail_url text,
  video_url text,
  status public.original_status not null default 'arrived',
  notice_title text not null default '원본 영상 도착!',
  notice_body text not null default '홍대 본점에서 촬영한 원본이 도착했습니다. 편집을 시작해 보세요.',
  transfer_progress int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_originals_user_idx on public.studio_originals (user_id);

create table if not exists public.edit_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  original_id uuid not null references public.studio_originals (id) on delete cascade,
  mode public.edit_mode not null default 'one_touch_ai',
  status text not null default 'queued',
  output_video_url text,
  output_thumbnail_url text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications & lightweight app config
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null,
  body text,
  link_path text,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers / triggers
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

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

drop trigger if exists feed_posts_set_updated_at on public.feed_posts;
create trigger feed_posts_set_updated_at
before update on public.feed_posts
for each row execute function public.set_updated_at();

drop trigger if exists studio_originals_set_updated_at on public.studio_originals;
create trigger studio_originals_set_updated_at
before update on public.studio_originals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, handle, initials, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', '지유나'),
    coalesce(
      new.raw_user_meta_data->>'handle',
      'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
    ),
    coalesce(new.raw_user_meta_data->>'initials', 'J'),
    new.email
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
-- Seed
-- ---------------------------------------------------------------------------
insert into public.branches (
  id, code, name, short_name, address, city, district, is_active, sort_order
) values (
  '11111111-1111-1111-1111-111111111111',
  'hongdae',
  'SCENE HAUSE 홍대점',
  '홍대 본점',
  '서울 마포구 와우산로 21길 20',
  '서울',
  '마포구',
  true,
  1
)
on conflict (id) do nothing;

insert into public.booth_types (
  id, name, description, capacity_min, capacity_max, capacity_label, icon_key,
  price_krw, duration_minutes, features, preset_options, sort_order
) values
  (
    'solo', '솔로 부스', '1~2인 프라이빗 촬영', 1, 2, '1~2인', 'person-outline',
    20000, 30,
    '["프라이빗","미러샷"]'::jsonb,
    '["좌우 이동 프리셋","정면 고정"]'::jsonb,
    1
  ),
  (
    'group', '그룹 부스', '3~4인 프라이빗 촬영', 3, 4, '3~4인', 'people-outline',
    35000, 30,
    '["그룹","와이드"]'::jsonb,
    '["그룹 중앙","좌우 이동 프리셋"]'::jsonb,
    2
  ),
  (
    'motion', '모션 부스', '천장형 레일카메라 촬영', 1, 4, '레일카메라', 'videocam-outline',
    45000, 30,
    '["레일카메라","모션"]'::jsonb,
    '["레일 트래킹","좌우 이동 프리셋"]'::jsonb,
    3
  )
on conflict (id) do nothing;

insert into public.booth_rooms (branch_id, booth_type_id, room_code, room_name)
values
  ('11111111-1111-1111-1111-111111111111', 'solo', 'S1', '솔로 1호'),
  ('11111111-1111-1111-1111-111111111111', 'solo', 'S2', '솔로 2호'),
  ('11111111-1111-1111-1111-111111111111', 'group', 'G1', '그룹 1호'),
  ('11111111-1111-1111-1111-111111111111', 'motion', 'M1', '모션 1호')
on conflict (branch_id, room_code) do nothing;

insert into public.time_slots (branch_id, booth_type_id, slot_date, start_time, end_time)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  null,
  d::date,
  t::time,
  (t::time + interval '30 minutes')
from unnest(array['2026-07-12','2026-07-13','2026-07-14','2026-07-15','2026-07-16']) as d
cross join unnest(array['14:00','14:30','15:00','15:30']) as t
on conflict do nothing;

insert into public.challenges (slug, title, description, music_label, music_title, music_artist, is_featured)
values
  (
    'hype-boy-mirror',
    'Hype Boy 미러샷 튜토리얼',
    '부스에서 완벽한 각도로 찍는 미러샷 챌린지',
    'Hype Boy - New J',
    'Hype Boy',
    'New J',
    true
  ),
  (
    'moka-its-me',
    'MOKA "It''s Me" STUDIO',
    'CHOOM Hype Boy 미러 챌린지',
    'It''s Me - ILLIT',
    'It''s Me',
    'ILLIT',
    true
  )
on conflict (slug) do nothing;

insert into public.feed_posts (
  handle, title, caption, music_label, music_title, music_artist, video_url, is_recommended
) values
  (
    '@vie.node',
    'Hype Boy 미러샷 튜토리얼',
    '부스에서 완벽한 각도로 찍...',
    'Hype Boy - New J',
    'Hype Boy',
    'New J',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    true
  ),
  (
    '@cjs.dksss',
    'MOKA "It''s Me" STUDIO',
    'CHOOM Hype Boy 미러...',
    'It''s Me - ILLIT',
    'It''s Me',
    'ILLIT',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    true
  ),
  (
    '@cjs.dksss',
    'MOKA "It''s Me" STUDIO',
    'CHOOM Hype Boy 미러...',
    'Miss you - scens',
    'Miss you',
    'scens',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    true
  );

insert into public.app_settings (key, value)
values
  ('feed', '{"default_tab":"recommend","mute_by_default":true}'::jsonb),
  ('reservation', '{"month_label":"2026년 7월","default_branch_code":"hongdae"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.branches enable row level security;
alter table public.booth_types enable row level security;
alter table public.booth_rooms enable row level security;
alter table public.time_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.scene_passes enable row level security;
alter table public.challenges enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_comments enable row level security;
alter table public.feed_bookmarks enable row level security;
alter table public.user_shorts enable row level security;
alter table public.saved_challenges enable row level security;
alter table public.studio_originals enable row level security;
alter table public.edit_jobs enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;

create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "follows_public_read" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

create policy "branches_public_read" on public.branches for select using (true);
create policy "booth_types_public_read" on public.booth_types for select using (true);
create policy "booth_rooms_public_read" on public.booth_rooms for select using (true);
create policy "time_slots_public_read" on public.time_slots for select using (true);
create policy "challenges_public_read" on public.challenges for select using (is_active = true);
create policy "feed_posts_public_read" on public.feed_posts for select using (is_published = true);
create policy "app_settings_public_read" on public.app_settings for select using (true);

create policy "reservations_select_own" on public.reservations for select using (auth.uid() = user_id);
create policy "reservations_insert_own" on public.reservations for insert with check (auth.uid() = user_id);
create policy "reservations_update_own" on public.reservations for update using (auth.uid() = user_id);

create policy "scene_passes_select_own" on public.scene_passes for select using (auth.uid() = user_id);
create policy "scene_passes_insert_own" on public.scene_passes for insert with check (auth.uid() = user_id);
create policy "scene_passes_update_own" on public.scene_passes for update using (auth.uid() = user_id);

create policy "feed_likes_read" on public.feed_likes for select using (true);
create policy "feed_likes_write_own" on public.feed_likes for insert with check (auth.uid() = user_id);
create policy "feed_likes_delete_own" on public.feed_likes for delete using (auth.uid() = user_id);

create policy "feed_comments_read" on public.feed_comments for select using (true);
create policy "feed_comments_write_own" on public.feed_comments for insert with check (auth.uid() = user_id);
create policy "feed_comments_update_own" on public.feed_comments for update using (auth.uid() = user_id);
create policy "feed_comments_delete_own" on public.feed_comments for delete using (auth.uid() = user_id);

create policy "feed_bookmarks_select_own" on public.feed_bookmarks for select using (auth.uid() = user_id);
create policy "feed_bookmarks_write_own" on public.feed_bookmarks for insert with check (auth.uid() = user_id);
create policy "feed_bookmarks_delete_own" on public.feed_bookmarks for delete using (auth.uid() = user_id);

create policy "user_shorts_select_own_or_public" on public.user_shorts
  for select using (is_public = true or auth.uid() = user_id);
create policy "user_shorts_insert_own" on public.user_shorts for insert with check (auth.uid() = user_id);
create policy "user_shorts_update_own" on public.user_shorts for update using (auth.uid() = user_id);

create policy "saved_challenges_select_own" on public.saved_challenges for select using (auth.uid() = user_id);
create policy "saved_challenges_insert_own" on public.saved_challenges for insert with check (auth.uid() = user_id);
create policy "saved_challenges_delete_own" on public.saved_challenges for delete using (auth.uid() = user_id);

create policy "studio_originals_select_own" on public.studio_originals for select using (auth.uid() = user_id);
create policy "studio_originals_insert_own" on public.studio_originals for insert with check (auth.uid() = user_id);
create policy "studio_originals_update_own" on public.studio_originals for update using (auth.uid() = user_id);

create policy "edit_jobs_select_own" on public.edit_jobs for select using (auth.uid() = user_id);
create policy "edit_jobs_insert_own" on public.edit_jobs for insert with check (auth.uid() = user_id);
create policy "edit_jobs_update_own" on public.edit_jobs for update using (auth.uid() = user_id);

create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
