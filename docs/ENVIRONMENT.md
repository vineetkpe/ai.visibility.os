# Environment configuration

Use **one local runtime environment file only**:

`apps/web/.env`

Do not create `.env.local`, `.env.development`, `.env.production`, or additional `.env*` files for this application.

The file is intentionally ignored by Git. Never commit secrets.

## Required variables

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
SUPABASE_SECRET_KEY=<server-only-secret-key>
JOB_WORKER_SECRET=<long-random-worker-secret>
CRON_SECRET=<long-random-cron-secret>
```

For the scanner, add the provider key only when the provider is enabled:

```text
GEMINI_API_KEY=<gemini-api-key>
```

Server-only secrets must never use a `NEXT_PUBLIC_` prefix.

## Vercel

Production and preview secrets belong in Vercel Environment Variables. They are not committed to the repository and do not require a second local `.env` file.

## Why this repository does not contain `.env.example`

The project deliberately keeps environment configuration documented here instead of maintaining multiple example files that can drift apart. The runtime source of truth for local development is `apps/web/.env`.
