# Project State Machine

Source of truth: `packages/shared/src/stages.ts`.

## Stages

```
IDEA_RESEARCH -> IDEA_SELECTED -> REFERENCES_ANALYSED -> CLAIMS_VERIFIED
  -> [METHODOLOGY_READY] -> SCRIPT_DRAFTED -> SCRIPT_APPROVED
  -> PRODUCTION_PLAN_READY -> ASSETS_REQUESTED -> ASSETS_READY
  -> NARRATION_READY -> TRANSCRIPT_READY -> EDIT_PLAN_READY
  -> ROUGH_RENDERED -> QA_COMPLETE -> FINAL_RENDERED
  -> PUBLISH_PACKAGE_READY -> PUBLISHED -> ANALYTICS_REVIEWED
```

`METHODOLOGY_READY` is bracketed because it's conditional (see below) — every other stage is
required for every content type.

## Content types and optional stages

`isStageOptional(stage, contentType)` is the single place that decides which stages a content
type needs. Today only `METHODOLOGY_READY` is conditional:

- **Required** for `experiment`, `comparison`, `case_study` — these make a claim that needs a
  locked-before-results test design.
- **Skipped** for `tutorial`, `build`, `opinion`, `news_reaction`, `explainer`.

`getRequiredStages(contentType)` filters the full stage list down to what a given project
actually needs to pass through.

## Transitions

`canTransition(from, to, contentType)` is content-type-aware and is the **only** function allowed
to answer "can this project move from A to B". It has two branches:

1. **Forward**: legal only if `to === getNextStage(from, contentType)` — i.e. `to` is the single
   next stage in that content type's required path. This is what makes `METHODOLOGY_READY`
   mandatory for a comparison (its next stage after `CLAIMS_VERIFIED`) while a tutorial jumps
   straight from `CLAIMS_VERIFIED` to `SCRIPT_DRAFTED` (methodology isn't in its required list at
   all). Multi-stage jumps are never legal, even if every intermediate stage would eventually be
   reached.
2. **Revision**: an explicit, hardcoded set of backward edges for reopening a stage — a script
   can go from `SCRIPT_APPROVED` back to `SCRIPT_DRAFTED`, a QA pass can send a project back to
   `EDIT_PLAN_READY` or `ASSETS_REQUESTED`, etc. (see `REVISION_EDGES`).

`transitionStage()` in `packages/agents/src/domain.ts` is the only place in the codebase allowed
to write `projects.current_stage`. It calls `canTransition()`, throws if the move is illegal,
otherwise updates the project and appends a `project_stage_history` row recording `fromStage`,
`toStage`, `actorType` (`USER` / `AGENT` / `SYSTEM`), an optional `actorLabel`, and an optional
`note` (used for override reasons, e.g. "Approved with override: <reason>").

## Progress

`calculateProgress(stage, contentType)` is **not** `stageIndex / totalStages`. Each stage has a
weight (`STAGE_WEIGHTS`, summing to 100 across the full stage list). Progress is:

```
sum(weight of required stages up to and including current) / sum(weight of all required stages for this content type)
```

So a tutorial (no methodology) reaches 100% without ever passing through `METHODOLOGY_READY`,
and its percentage at any given stage reflects only the stages it actually has to complete.

## Next Action Engine

`resolveNextAction(stage, contentType, signals)` (`packages/shared/src/next-action.ts`) computes
the **single** next action shown on a project — never a checklist. `ProjectSignals` is a plain
data object (counts and booleans only, no DB types) computed by
`computeProjectSignals()` (`packages/agents/src/signals.ts`), which queries every table the
engine might need. Every project surface (dashboard card, project header) renders from the same
`{ kind, label, blocking, requiresApproval }` result — there is no separate, hand-written "what do
I do next" copy anywhere in the UI.

Approval gates (`requiresApproval: true`) mark the actions the product spec calls out as
mandatory user checkpoints: idea selection, script approval, missing-evidence resolution, final
render approval, and publishing. The web app never auto-advances past one of these.
