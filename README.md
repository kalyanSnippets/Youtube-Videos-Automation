# YouTube Agent OS

A persistent, multi-project operating system for researching, planning, scripting, producing,
editing, reviewing, publishing, and learning from YouTube videos — not a one-video generator.

Run multiple video projects simultaneously. Each project carries its own research, evidence
ledger, script, production plan, assets, edit plan, QA issues, publish package, and analytics,
and always knows exactly what's done, what's blocked, and what to do next.

The channel isn't faceless-only: every project independently picks **Face-led**, **Hybrid**
(the default), or **Faceless** presentation, and production planning, asset tracking, and the
Remotion component catalog all adapt to that choice — see
[`docs/PRESENTATION-MODES.md`](docs/PRESENTATION-MODES.md).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system design.

## Status

**Phase 1-4 implemented** (foundation, research/claims/script workflow, production/assets,
AI orchestration with a MOCK provider). **Phase 5-8** (local worker, Remotion rendering, QA loop,
publishing/analytics) have their interfaces and database schema built, with the web UI showing
honest "not connected yet" states rather than fabricated results. See the Roadmap section below.

## Monorepo layout

```
apps/
  web/                 Next.js control-centre app (dashboard, projects, agents UI)
  local-worker/        (planned, Phase 5) CLI that connects a local machine for rendering
packages/
  shared/              Stage state machine, next-action engine, progress calc, shared enums
  database/            Drizzle ORM schema (Postgres) + client + baseline seed
  seed-scripts/        Full demo-data seeding (depends on database + agents)
  agent-schemas/       Zod schemas validating every agent's structured output
  ai-providers/        AIProvider interface: MOCK / OpenAI / Anthropic
  research/            ResearchProvider interface (web/YouTube/community research)
  transcription/       TranscriptionProvider interface (word-level, for local Whisper)
  video-core/          RenderProvider interface + edit-plan types shared with the local worker
  agents/              Orchestrator + specialized agent runners + state-machine domain actions
  prompts/             Versioned system prompts per agent
  remotion/            Remotion component catalog (12 implemented, 24 catalogued)
  ffmpeg/              Typed wrappers around the ffmpeg/ffprobe binaries (local-worker side)
docs/                  Architecture, agents, state machine, database, trust system, etc.
```

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable` or `npm i -g pnpm`)
- A PostgreSQL 14+ database (local Postgres, Docker, or a hosted Supabase project)

## Setup

```bash
pnpm install

# Point the app at your Postgres database
export DATABASE_URL="postgresql://user:password@localhost:5432/yaos_dev"

# Create the schema
pnpm db:generate   # generates SQL migration files from the Drizzle schema (only needed after a schema change)
pnpm db:migrate    # applies migrations to DATABASE_URL

# Seed a dev owner account, channel profile, motion template catalog, and 3 DEMO projects
pnpm db:seed
```

Create `apps/web/.env.local`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/yaos_dev
```

Optional (enables real agent runs instead of MOCK fixtures — see docs/AGENTS.md):

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

Optional (enables real Supabase Auth instead of local single-owner dev mode):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Run

```bash
pnpm dev      # apps/web on http://localhost:3000
pnpm build    # production build of apps/web
pnpm start    # serve the production build
```

Without a Supabase project configured, the sign-in page offers "Continue as Dev Owner",
which uses the single seeded owner account — the UI clearly labels this as local dev mode.

## Test / typecheck / lint

```bash
pnpm typecheck   # tsc --noEmit across every package
pnpm test        # vitest across every package (state machine, next-action engine, agent pipeline)
pnpm lint        # next lint for the web app
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, monorepo rationale, data flow
- [`docs/STATE-MACHINE.md`](docs/STATE-MACHINE.md) — project stages, transition rules, progress calc
- [`docs/AGENTS.md`](docs/AGENTS.md) — every specialized agent, its contract, and its prompt
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema reference
- [`docs/TRUST-SYSTEM.md`](docs/TRUST-SYSTEM.md) — the claim/evidence ledger, the project's core differentiator
- [`docs/PRESENTATION-MODES.md`](docs/PRESENTATION-MODES.md) — face-led / hybrid / faceless, A-roll, and how the mode changes agent behavior
- [`docs/LOCAL-WORKER.md`](docs/LOCAL-WORKER.md) — planned local render worker design
- [`docs/REMOTION.md`](docs/REMOTION.md) — motion template catalog and render pipeline
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — day-to-day dev workflow
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploying the web app and provisioning Postgres

## Roadmap

- **Phase 5 — Local Worker**: `apps/local-worker` CLI (`login`, `start`, `status`, `scan`, `render`),
  heartbeat + job polling against the `jobs`/`local_worker_nodes` tables, faster-whisper transcription,
  FFmpeg processing.
- **Phase 6 — Remotion rendering**: wire `render_jobs` to an actual `@remotion/renderer` invocation on
  the local worker; finish the remaining 12 catalogued-but-unbuilt motion components.
- **Phase 7 — QA loop**: Video Critic agent runner producing real `qa_issues` from a rendered video
  (currently the schema and UI exist; the agent runner is not yet implemented).
- **Phase 8 — Publishing & analytics**: Publishing Strategist and Analytics Reviewer agent runners,
  plus real YouTube Data/Analytics API integration (currently NOT_CONNECTED by design).
