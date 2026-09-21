# Development

## First-time setup

```bash
pnpm install

# any local Postgres works; this repo's docs assume:
export DATABASE_URL="postgresql://yaos:yaos_dev_password@localhost:5432/yaos_dev"

pnpm db:generate   # only needed after changing packages/database/src/schema
pnpm db:migrate
pnpm db:seed       # dev owner, channel profile, motion templates, 3 DEMO projects

echo "DATABASE_URL=$DATABASE_URL" > apps/web/.env.local
pnpm dev           # http://localhost:3000
```

No sign-in step — the app lands straight on the dashboard, auto-provisioning the owner user and
workspace on first request (see `docs/ARCHITECTURE.md`'s Auth section).

## Adding a new agent runner

1. Add its structured-output type + Zod schema to `packages/agent-schemas/src/index.ts`.
2. Add a deterministic MOCK fixture generator to `packages/agents/src/mock-fixtures.ts`.
3. Add its system prompt: `packages/prompts/src/<agent-name>/v1.ts`, register it in
   `packages/prompts/src/index.ts`'s `PROMPT_REGISTRY`. Add the agent name to `AGENT_NAMES` in
   `packages/shared/src/enums.ts` (this also extends the `agent_name` Postgres enum — regenerate
   + apply a migration).
4. Add a runner in `packages/agents/src/runners/<agent-name>.ts` following the existing pattern:
   call `runAgent()`, branch `build()` on `providerId === "MOCK"` vs. parsing real provider JSON,
   insert the validated result, call `transitionStage()` only if
   `getNextStage(project.currentStage, project.contentType) === <the stage this completes>`.
5. Export it from `packages/agents/src/index.ts`.
6. Wire a button + inline server action into the relevant project tab in `apps/web`.

## Adding a table

1. Add the `pgTable(...)` definition to the right file under `packages/database/src/schema/`
   (or a new file, re-exported from `schema/index.ts`). Use extensionless relative imports (see
   `docs/DATABASE.md`).
2. `pnpm db:generate` then `pnpm db:migrate`.
3. If the table needs enum-like constraints, add the values to `packages/shared/src/enums.ts`
   first so `@yaos/shared`, the DB enum, and the UI stay in sync.

## Adding a project tab

Tabs are plain routes under `apps/web/src/app/(app)/projects/[id]/<tab>/page.tsx`. The parent
`layout.tsx` already renders the project header (stage, progress, trust coverage, next action)
and the tab strip (`components/project/project-tabs.tsx`) — a new tab just needs its route added
to the `TABS` array there and a page that fetches its own data with Drizzle.

## Conventions

- Server actions live next to their domain in `apps/web/src/lib/actions/*.ts`, or as inline
  `"use server"` closures inside a page when they need to close over a specific row's id (see any
  existing tab page for the pattern).
- Every mutation that changes visible state calls the relevant `revalidatePath()`s.
- Never write `projects.current_stage` directly — always go through `transitionStage()`.
- Never fabricate a result for an unconnected integration — throw, and let the UI render a
  "not connected yet" state (see `components/project/not-connected-panel.tsx` for the pattern).

## Testing

```bash
pnpm test               # every package's vitest suite
pnpm --filter @yaos/shared test    # state machine, next-action engine, trust coverage (pure, no DB)
pnpm --filter @yaos/agents test    # integration tests against DATABASE_URL (needs a real Postgres)
```

## Running against a browser

Chromium is available in CI/dev sandboxes without a full Playwright project — see this repo's own
verification notes for the exact invocation used to smoke-test the wizard → ideas → references →
claims → script → production → shot-list flow end-to-end in a real browser.
