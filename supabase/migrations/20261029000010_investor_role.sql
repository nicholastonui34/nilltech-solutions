-- Shareholder investors get their own portal role (owner, 2026-10-29).
-- Separate migration: a new enum value can't be used in the same
-- transaction that adds it.
alter type public.app_role add value if not exists 'investor';
