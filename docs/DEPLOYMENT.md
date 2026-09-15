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

### Deploying to Vercel

This is a pnpm-workspace monorepo, so the Next.js app isn't at the repo root:

1. [Import the repo](https://vercel.com/new) in the Vercel dashboard.
2. When Vercel asks for the project's **Root Directory**, set it to `apps/web`. Vercel then
   auto-detects the pnpm workspace from `pnpm-lock.yaml` at the repo root and runs the install at
   the workspace root automatically — no custom install/build command needed.
3. Add the environment variables below in the project's Settings → Environment Variables
   (Production, and Preview if you want preview deployments to work too).
4. Provision a Postgres database Vercel's build can reach at deploy time — e.g. a
   [Neon](https://neon.tech) or [Supabase](https://supabase.com) project (both have a free tier
   and work as a plain `DATABASE_URL`). Vercel's own "Vercel Postgres" offering is now a
   marketplace add-on backed by Neon and works the same way.
5. Run the schema migration against that database **once**, from your own machine (Vercel's build
   step doesn't run migrations automatically):
   ```bash
   DATABASE_URL=<your production connection string> pnpm db:migrate
   DATABASE_URL=<your production connection string> pnpm db:seed   # optional: demo data + dev owner
   ```
6. Deploy. Vercel gives you a `https://<project>.vercel.app` URL once the build finishes.

Re-run step 5 (`pnpm db:migrate`) against production after any future change to
`packages/database/src/schema/*` and a fresh `pnpm db:generate`.

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

### Deploying to Netlify

`netlify.toml` at the repo root already configures this monorepo for Netlify — no dashboard
build-settings overrides needed:

```toml
[build]
  command = "pnpm --filter @yaos/web build"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

`@netlify/plugin-nextjs` (pinned in `apps/web/package.json`'s `devDependencies`) is Netlify's
official adapter — it translates the Next.js build output (including server actions and dynamic
routes, both of which this app relies on) into Netlify Functions, so the app is not limited to a
static export.

1. [Add a new site from Git](https://app.netlify.com/start) in the Netlify dashboard and pick this
   repo. Leave **Base directory** empty — `netlify.toml` at the repo root already points the build
   at `apps/web` via the `command`/`publish` paths, and Netlify needs the repo root to see the
   pnpm workspace (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) so it installs once for every package.
   Netlify detects `pnpm-lock.yaml` automatically and runs `pnpm install` before `build.command`.
2. Add the environment variables below in **Site configuration → Environment variables**.
3. Provision a Postgres database reachable at deploy time — e.g. [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) (Netlify doesn't offer a managed Postgres of its own).
4. Run the schema migration against that database **once**, from your own machine (Netlify's build
   doesn't run migrations automatically):
   ```bash
   DATABASE_URL=<your production connection string> pnpm db:migrate
   DATABASE_URL=<your production connection string> pnpm db:seed   # optional: demo data + dev owner
   ```
5. Deploy. Netlify gives you a `https://<site-name>.netlify.app` URL once the build finishes.

Re-run step 4 (`pnpm db:migrate`) against production after any future change to
`packages/database/src/schema/*` and a fresh `pnpm db:generate`.

Deploying from the CLI instead of linking a Git repo works the same way once authenticated
(`netlify login`, then `netlify deploy --build --prod` from the repo root) — `netlify.toml` drives
the build either way.

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
