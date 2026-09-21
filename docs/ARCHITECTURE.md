# Architecture

## Core design principle

```
WEB APP        = control centre  (project state, research, approvals, prompts, jobs, progress)
AI AGENTS      = research / creative / production team (structured, schema-validated outputs)
LOCAL WORKER   = video production machine (Remotion render, FFmpeg, Whisper, local file access)
```

The web app never assumes it has direct access to a user's raw media files, and it never
performs heavy video processing itself. It owns state and orchestration; a separate local
worker (Phase 5, see [`docs/LOCAL-WORKER.md`](LOCAL-WORKER.md)) owns rendering and transcription,
polling for jobs and reporting results back through the `jobs` / `render_jobs` tables.

## Monorepo

pnpm workspaces, no Turborepo (kept deliberately simple — a handful of small packages with a flat
dependency graph doesn't need a task-graph build system yet).

```
apps/web             Next.js 15 App Router, TypeScript, Tailwind CSS
apps/local-worker     (planned)
packages/shared        pure functions, zero framework/DB dependencies
packages/database      Drizzle ORM schema + Postgres client (the only package that talks SQL)
packages/agent-schemas Zod contracts every agent output is validated against
packages/ai-providers  AIProvider interface + MOCK/OpenAI/Anthropic implementations
packages/research      ResearchProvider interface (web search / YouTube / community research)
packages/transcription TranscriptionProvider interface (word-level timestamps)
packages/video-core    RenderProvider interface + EditPlan types (shared with local-worker)
packages/agents        Orchestrator + specialized agent runners + state-machine domain actions
packages/prompts       Versioned system prompts, one file per agent per version
packages/remotion      Remotion components + motion template catalog
packages/ffmpeg        Typed wrappers around the ffmpeg/ffprobe binaries
packages/seed-scripts  Composes database + agents to seed demo data (kept separate from
                       packages/database specifically to avoid a database <-> agents cycle,
                       since agents depends on database)
```

### Why a separate `seed-scripts` package

`packages/agents` depends on `packages/database` (it writes agent output to tables). Realistic
demo data needs to run real agent pipelines (idea research -> select -> claims -> script ->
production -> assets) against the database. Putting that seeding logic inside
`packages/database` would create `database -> agents -> database`, a dependency cycle. Instead
`packages/database` only seeds the DB-only baseline (owner user, workspace, channel profile,
integration rows), and `packages/seed-scripts` — a leaf package with no other package depending
on it — composes `database` and `agents` to build the three DEMO projects.

## Request flow (example: approving a script)

1. User clicks "Approve Script" on `/projects/[id]/script` (`apps/web`).
2. The page's inline server action calls `approveScriptAction` (`apps/web/src/lib/actions/scripts.ts`).
3. That calls `approveScript()` in `packages/agents/src/domain.ts`, which:
   - recomputes `ProjectSignals` via `computeProjectSignals()` (`packages/agents/src/signals.ts`),
   - refuses if `unverifiedClaimCount > 0` and no override was given,
   - marks the script row `APPROVED`,
   - calls `transitionStage()`, which checks `canTransition()` (`packages/shared/src/stages.ts`)
     before writing `projects.current_stage` and appending a `project_stage_history` row,
   - writes a `project_activity` row.
4. `revalidatePath` refreshes the Next.js cache for the project's routes.

Every stage transition in the app goes through `transitionStage()` — nothing writes
`projects.current_stage` directly. Every meaningful action writes a `project_activity` row with
an `actorType` of `USER`, `AGENT`, `SYSTEM`, or `LOCAL_WORKER`.

## Provider abstractions

Four interfaces gate every external capability. Business logic never imports an SDK directly:

| Interface              | Package                    | Real implementation                          |
|-------------------------|-----------------------------|-----------------------------------------------|
| `AIProvider`            | `@yaos/ai-providers`        | OpenAI / Anthropic REST calls, gated on env keys |
| `ResearchProvider`      | `@yaos/research`            | not yet connected (`NotConnectedResearchProvider`) |
| `TranscriptionProvider` | `@yaos/transcription`       | local worker (faster-whisper), not yet connected |
| `RenderProvider`        | `@yaos/video-core`          | local worker (Remotion + FFmpeg), not yet connected |

Every "not connected" implementation throws a descriptive error rather than returning invented
data. See [`docs/TRUST-SYSTEM.md`](TRUST-SYSTEM.md) for why this matters and how the UI reflects it.

## MOCK mode

`resolveAIProvider()` (`packages/ai-providers/src/index.ts`) returns the requested provider only
if it's configured (has an API key); otherwise it silently falls back to `MockAIProvider` — never
under a real provider's name. The web app's topbar shows a persistent **MOCK MODE** badge
whenever no real provider is available, so nobody mistakes fixture data for a real research or
generation result. All three seeded DEMO projects always run through the MOCK provider.

## Structured agent outputs

Every agent that produces machine-critical data (ideas, claims, scripts, production scenes, asset
requirements, ...) returns JSON validated against a Zod schema in `packages/agent-schemas`. The
shared harness `runAgent()` (`packages/agents/src/run-agent.ts`):

1. resolves the provider (falling back to MOCK),
2. calls it with the agent's versioned system prompt (`packages/prompts`),
3. validates the result,
4. on failure, retries once with a repair prompt describing what failed,
5. records the whole attempt as an `agent_runs` row with `agent_messages` for traceability,
6. throws (never silently persists malformed data) if validation still fails after the retry.

## Frontend

Next.js App Router, server components by default, inline server actions for mutations (each tab
page defines its own `"use server"` closures bound to the row/project it renders, calling into
`packages/agents` domain functions or agent runners). No client-side state management beyond
what `usePathname()` needs for tab/nav highlighting. Tailwind CSS with a small custom dark
palette (`apps/web/tailwind.config.ts`) — cyan/purple accents, restrained gradients, dense
information-first layout per the product's "premium production dashboard" brief.

## Auth

There is no sign-in flow — this is a single-owner tool. `apps/web/src/lib/auth.ts`'s
`getCurrentUser()` auto-provisions the owner user and workspace on first access (via
`seedBaseline()` in `packages/database/src/seed/index.ts`), so the dashboard is usable
immediately with no login step. Every table that's user/workspace-scoped still carries
`workspace_id`, and `workspaces.owner_user_id` points at `users.id`, so multi-user workspaces
remain a schema-level given even though the product only exposes a single owner today.
