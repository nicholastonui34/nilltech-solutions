# Database backups

Supabase Free keeps no backups (CLAUDE.md §3), and the database holds real
invoices, payments, leads and applications. `.github/workflows/db-backup.yml`
takes a nightly encrypted backup.

## What it does

- Runs every night at 03:17 Nairobi time, and on demand (Actions > Nightly
  database backup > Run workflow).
- Dumps the `public` schema (all app data) and the `auth` schema (portal
  users) with `pg_dump` 17 in custom format.
- Encrypts the dump with AES-256 (`gpg --symmetric`) using
  `BACKUP_PASSPHRASE`, then keeps it as a workflow artifact for 30 days.
- The `vault` schema is **not** included, so the KRA PIN encryption key
  never sits next to the encrypted PINs. See "The KRA PIN key" below.

If a run fails, GitHub emails the account that owns the workflow schedule.

## One-time setup (owner)

1. **Get the connection string.** Supabase dashboard > project
   `nilltech-solutions` > **Connect** > **Session pooler** (GitHub's runners
   need IPv4, which the direct connection doesn't offer). Copy the URI and
   put the database password in place of `[YOUR-PASSWORD]`. If you don't
   know the password, reset it under Project Settings > Database.
2. **Create a passphrase.** A long random one from a password manager.
   Save it there: without it, no backup can be opened.
3. **Add both as repository secrets** on GitHub: Settings > Secrets and
   variables > Actions > New repository secret.
   - `SUPABASE_DB_URL`: the connection string from step 1.
   - `BACKUP_PASSPHRASE`: the passphrase from step 2.
4. **Run it once by hand** (Actions > Nightly database backup > Run
   workflow) and check the run is green with an artifact attached.

## The KRA PIN key

KRA PINs are encrypted with a key held in Supabase Vault (`tax_id_key`).
Restoring into the same Supabase project keeps working, because the key is
still there. To be able to restore into a **new** project, keep a copy of
the key in the password manager:

```sql
-- Supabase SQL editor, run as the owner. Copy the result into the
-- password manager; don't paste it anywhere else.
select decrypted_secret from vault.decrypted_secrets where name = 'tax_id_key';
```

When restoring into a new project, recreate it before restoring data:
`select vault.create_secret('<key>', 'tax_id_key');`

## Restoring

1. Download the artifact from the workflow run (Actions > run > Artifacts)
   and unzip it.
2. Decrypt:
   `gpg --decrypt --output backup.dump nilltech-db-<stamp>.dump.gpg`
   (it asks for the passphrase).
3. Look before restoring: `pg_restore --list backup.dump | less`.
4. Restore into a project whose schema is already in place (apply
   `supabase/migrations/` first on a new project), data only:
   `pg_restore --data-only --disable-triggers --dbname "$TARGET_DB_URL" backup.dump`
   Use `--table=<name>` to bring back a single table.
5. Never restore over the live database without taking a fresh backup of
   it first.

## Limits

- 30 days of history. GitHub artifacts are capped at 90 days; move to
  Cloudflare R2 (free tier) if longer retention is needed.
- Storage files (Supabase Storage) aren't included. The app doesn't store
  files there yet; PDFs are generated on demand from database snapshots.
