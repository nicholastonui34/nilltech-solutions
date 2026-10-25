-- Main Admin "budget/usage triggers" (CLAUDE.md §3/§10): Supabase Free caps
-- the database at 500 MB and the upgrade trigger fires at 400 MB. There's
-- no API for this on the free tier, so expose pg_database_size to
-- super_admin only. SECURITY DEFINER because pg_database_size needs no
-- special grant, but the role check must not be bypassable by callers.

create function public.admin_database_size_bytes()
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'super_admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return pg_database_size(current_database());
end;
$$;

revoke all on function public.admin_database_size_bytes() from public, anon;
grant execute on function public.admin_database_size_bytes() to authenticated;
