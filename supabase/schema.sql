-- Supabase SQL Editor 에서 실행하세요.
create table if not exists public.cases (
  id text primary key,
  title text not null,
  program text not null,
  date text,
  source_title text not null,
  source_url text not null,
  weather text not null,
  road_type text not null,
  summary text not null,
  cause text,
  advice text,
  lesson text not null
);

create table if not exists public.zones (
  id text primary key,
  name text not null,
  region text not null,
  lat double precision not null,
  lng double precision not null,
  road_type text not null,
  climates text[] not null default '{}',
  risk int not null check (risk between 1 and 5),
  description text not null,
  hazards text[] not null default '{}',
  prevention text[] not null default '{}',
  military_note text not null,
  case_ids text[] not null default '{}'
);

create table if not exists public.tips (
  id text primary key,
  "group" text not null,
  key text not null,
  title text not null,
  summary text not null,
  steps text[] not null default '{}',
  caution text
);

-- 읽기 전용 공개 (쓰기는 Supabase 대시보드/service role 로만)
alter table public.cases enable row level security;
alter table public.zones enable row level security;
alter table public.tips enable row level security;

drop policy if exists "public read cases" on public.cases;
drop policy if exists "public read zones" on public.zones;
drop policy if exists "public read tips" on public.tips;
create policy "public read cases" on public.cases for select using (true);
create policy "public read zones" on public.zones for select using (true);
create policy "public read tips" on public.tips for select using (true);
