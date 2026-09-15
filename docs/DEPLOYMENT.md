# Deployment

## Database

Any managed Postgres works (Supabase, RDS, Neon, Fly Postgres, ...). This project was built
against Supabase in mind (the spec calls for Supabase Auth + Postgres), but nothing in
`packages/database` is Supabase-specific beyond the connection string.

1. Provision a Postgres instance, get its connection string.
2. `DATABASE_URL=<connection string> pnpm db:migrate` from a machine with network access to it.
3. Optionally `pnpm db:seed` for a fresh environment's demo data (skip in a real production
   workspace — it seeds a `owner@local.dev` dev account, which is meant for local development
   only when Supabase Auth isn't configured).

## Web app

`apps/web` is a standard Next.js app (App Router, no `output: "export"` — it needs a Node
runtime for server actions and Postgres access). Deploy it anywhere that runs Next.js server
builds: Vercel, a Node server behind a reverse proxy, a container platform, etc.

Required environment variables:

```
DATABASE_URL=postgresql://...
```

Optional (enables real agent runs / real auth instead of MOCK / local dev mode):

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Build and run:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## Secrets

- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` are read server-side only (`packages/ai-providers`) —
  never exposed to the client bundle.
- `DATABASE_URL` is read server-side only (`packages/database/src/client.ts`).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is, by Supabase's own design, safe to expose client-side (it's
  the public anon key, not a service-role key) — never put a Supabase **service-role** key in a
  `NEXT_PUBLIC_*` variable.

## Local worker (Phase 5, planned)

The local worker is meant to run on the user's own machine, not alongside the web deployment —
see `docs/LOCAL-WORKER.md`. It needs network access to the deployed web app, but not
`DATABASE_URL`: it authenticates against the web app and receives/reports job state over the
network rather than talking to Postgres directly.

## What "done" looks like for Phase 1-4 in production

- `pnpm build` succeeds with zero type errors (`pnpm typecheck` is part of `next build`'s type
  check step).
- `pnpm db:migrate` has been run against the target database.
- A real owner has signed in via Supabase Auth (or, for an internal/demo deployment, dev mode is
  acceptable but should say so — see the sign-in page's own messaging).
- Settings → Integrations accurately reflects what's actually connected; nothing shows
  `CONNECTED` that isn't.
