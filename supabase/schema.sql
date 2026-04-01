create extension if not exists pgcrypto;

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  nickname text not null default '',
  session_id text not null default '',
  result_key text not null,
  result_title text not null default '',
  one_line text not null default '',
  pcts jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  lang text not null default 'ko',
  source text not null default 'pixel-prototype',
  created_at timestamptz not null default now(),
  received_at timestamptz not null default now()
);

create index if not exists idx_test_results_created_at on public.test_results (created_at desc);
create index if not exists idx_test_results_result_key on public.test_results (result_key);
create index if not exists idx_test_results_lang on public.test_results (lang);

alter table public.test_results enable row level security;

comment on table public.test_results is 'ETU-TUDE prototype test results';
