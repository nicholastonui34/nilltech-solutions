-- Per-visitor rate limit for the public forms (CLAUDE.md §7, Phase 8).
-- Host-portable: lives in Supabase, not in a Vercel-only store (§3).
--
-- Buckets are "<form>:<sha256(ip + form + UTC date)>", hashed in the app,
-- so no raw IP address is ever stored and a bucket can't be linked across
-- days. Rows older than a day are deleted on every check.

create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_bucket_created_idx
  on public.rate_limit_hits (bucket, created_at desc);
create index rate_limit_hits_created_idx on public.rate_limit_hits (created_at);

-- RLS on with no policies: only the service role (server actions) and the
-- function below can touch it.
alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;

-- Records a hit and returns true if the bucket is under both limits;
-- returns false (and records nothing) once either limit is reached.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_max_per_window integer,
  p_window_seconds integer,
  p_max_per_day integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_count integer;
  v_day_count integer;
begin
  -- Serialise concurrent submissions from the same visitor.
  perform pg_advisory_xact_lock(hashtext(p_bucket));

  delete from public.rate_limit_hits where created_at < now() - interval '1 day';

  select
    count(*) filter (where created_at > now() - make_interval(secs => p_window_seconds)),
    count(*)
  into v_window_count, v_day_count
  from public.rate_limit_hits
  where bucket = p_bucket;

  if v_window_count >= p_max_per_window or v_day_count >= p_max_per_day then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return true;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer, integer)
  to service_role;
