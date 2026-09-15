# Database

Postgres via Drizzle ORM (`drizzle-orm/node-postgres`). Schema lives in
`packages/database/src/schema/*.ts`, split by domain and re-exported from
`packages/database/src/schema/index.ts`. Every table uses a `uuid` primary key
(`defaultRandom()`), every table has `created_at` (and `updated_at` where the row is ever
mutated after creation), and every project-owned table carries `project_id`.

## Tables (31)

**Core / workspace**: `users`, `workspaces`, `channel_profiles`, `integration_settings`,
`local_worker_nodes`, `jobs`

**Project lifecycle**: `projects`, `project_stage_history`, `project_activity`

**Research**: `video_ideas`, `reference_videos`

**Trust & evidence**: `claims`, `claim_sources`, `methodologies`, `community_consensus`

**Assets**: `assets`, `asset_requirements`

**Script & production**: `scripts`, `production_scenes`, `shot_list_items`

**Post-production**: `transcripts`, `transcript_words`, `edit_plan_scenes`, `motion_templates`,
`qa_issues`, `render_jobs`

**Publishing & analytics**: `publish_packages`, `shorts`, `analytics_snapshots`

**Agent execution**: `agent_runs`, `agent_messages`

`community_consensus` is one addition beyond the spec's minimum table list — the Community
Consensus Agent needs somewhere to persist sentiment/praise/criticism separately from the claim
ledger.

## Enums

Defined once in `packages/database/src/schema/enums.ts`, several backed directly by the shared
constant arrays in `@yaos/shared` (`STAGES`, `CONTENT_TYPES`, `CLAIM_TYPES`, `ASSET_STATUSES`,
`JOB_STATUSES`, `ACTOR_TYPES`, `INTEGRATION_STATUSES`, `INTEGRATION_SERVICES`, `AGENT_NAMES`) so
the database, the state machine, and the UI can never drift out of sync on what a valid value is.

## Client

`packages/database/src/client.ts` exports a singleton `db` (Drizzle instance) and `pool` (node-postgres
`Pool`), reading `DATABASE_URL` from the environment (defaulting to the local dev connection
string used throughout this repo's docs). The instance is cached on `globalThis` outside
production to survive Next.js dev-server hot reloads without leaking connections.

## Migrations

Drizzle Kit generates SQL migrations from the schema:

```bash
pnpm db:generate   # writes packages/database/drizzle/NNNN_*.sql
pnpm db:migrate    # applies pending migrations to DATABASE_URL
```

Migration files are checked into `packages/database/drizzle/` and should never be hand-edited
after being applied anywhere — change the schema and generate a new migration instead.

## Seeding

Two layers, split to avoid a package dependency cycle (`packages/agents` already depends on
`packages/database`):

- `pnpm --filter @yaos/database seed` (or importing `seedBaseline()` from `@yaos/database`) —
  dev owner user, workspace, default channel profile, `NOT_CONNECTED` rows for every integration.
  No dependency on agents.
- `pnpm db:seed` (→ `packages/seed-scripts`) — the above, plus the motion template catalog and
  the three DEMO projects, built by actually running the agent pipeline (idea research → select →
  competitor analysis → claims → methodology when required → script → approval → production →
  assets) against the MOCK provider. Re-running is idempotent: it looks up existing rows by a
  unique key (email, project title) before inserting.

## Relative import convention

Every file under `packages/database/src` (and every other package's `src`) imports sibling
modules **without** a `.js`/`.ts` extension (`from "./enums"`, not `from "./enums.js"`). This
isn't just style: `drizzle-kit generate` loads the schema by requiring it directly, and its
loader does not remap an explicit `.js` extension onto a same-named `.ts` file the way `tsx` and
Next's bundler do — an extensioned relative import breaks `drizzle-kit generate` with a
`Cannot find module` error. Keep new relative imports extensionless.
