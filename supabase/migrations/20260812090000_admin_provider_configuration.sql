alter table public.providers
  add column if not exists adapter text not null default 'gemini',
  add column if not exists primary_model text,
  add column if not exists fallback_models jsonb not null default '[]'::jsonb,
  add column if not exists base_url text,
  add column if not exists is_default boolean not null default false;

create table if not exists public.provider_secrets (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  api_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.provider_secrets enable row level security;
revoke all on public.provider_secrets from anon, authenticated;

create index if not exists providers_default_active_idx on public.providers (is_default, is_active);

update public.providers
set adapter = case when slug = 'gemini' then 'gemini' else 'openai_compatible' end,
    primary_model = case when slug = 'gemini' then coalesce(primary_model, 'gemini-flash-latest') else primary_model end,
    fallback_models = case when slug = 'gemini' and fallback_models = '[]'::jsonb then '["gemini-2.5-flash-lite"]'::jsonb else fallback_models end;

create or replace function public.route_scan_to_default_provider()
returns trigger
language plpgsql
as $$
declare
  gemini_id uuid;
  default_id uuid;
begin
  select id into gemini_id from public.providers where slug='gemini' limit 1;
  select id into default_id from public.providers where is_active=true and is_default=true order by updated_at desc limit 1;
  if default_id is not null and gemini_id is not null and new.provider_id = gemini_id then
    new.provider_id := default_id;
  end if;
  return new;
end;
$$;

drop trigger if exists route_scan_to_default_provider on public.ai_scans;
create trigger route_scan_to_default_provider
before insert on public.ai_scans
for each row execute function public.route_scan_to_default_provider();

update public.providers
set is_default=true
where slug='gemini'
  and not exists (select 1 from public.providers where is_default=true and is_active=true);
