# AI Visibility OS Marketing

Standalone marketing website. It is intentionally isolated from `apps/web` so landing-page work cannot alter the authenticated product or scanner.

## Run locally

From the repository root:

```bash
pnpm install
pnpm --filter @ai-visibility-os/marketing dev
```

Open http://localhost:3000.

For a different port:

```bash
pnpm --filter @ai-visibility-os/marketing dev -- -p 3100
```

## Architecture

- `apps/marketing` — public marketing site
- `apps/web` — authenticated user/admin product
- `packages/*` — shared backend/domain packages

The marketing app currently has no dependency on the scanner, Supabase, authentication, or dashboard code.
