-- Phase 6: the owner's recruitment department screens applicants
-- (owner, 2026-10-25). Its own role keeps recruiters out of finance and
-- admin data. Added alone because a new enum value can't be used in the
-- same transaction that creates it.
alter type public.app_role add value if not exists 'recruitment';
