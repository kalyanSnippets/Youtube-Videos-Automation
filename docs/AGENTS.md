# Agents

Every agent is a function in `packages/agents/src/runners/*.ts` that goes through the shared
`runAgent()` harness (`packages/agents/src/run-agent.ts`): resolve a provider, call it with a
versioned prompt, validate the structured result against a Zod schema, retry once with a repair
prompt on failure, record an `agent_runs` row either way. None of them import an SDK directly —
they go through `@yaos/ai-providers`.

## Implemented runners

| Agent | Runner | Reads | Writes | Prompt |
|---|---|---|---|---|
| Idea Research | `runIdeaResearch` | channel profile, seed idea | `video_ideas` | `packages/prompts/src/idea-research` |
| Competitor Analyst | `runCompetitorAnalysis` | selected idea | `reference_videos` | `packages/prompts/src/competitor-analysis` |
| Trust & Claims Researcher | `runClaimsResearch` | topic | `claims`, `claim_sources` | `packages/prompts/src/claims` |
| Experiment Designer | `runExperimentDesigner` | topic | `methodologies` (locked) | — (uses the Claims prompt's sibling; see source) |
| Story Writer | `runStoryWriter` | non-UNVERIFIED claims | `scripts` (new DRAFT version) | `packages/prompts/src/story` |
| Production Director | `runProductionDirector` | approved script | `production_scenes` | `packages/prompts/src/production` |
| Asset Planner | `runAssetPlanner` | production scenes | `shot_list_items`, `asset_requirements`, `assets` (MISSING) | `packages/prompts/src/assets` |

Each of these also calls `transitionStage()` when its output completes the current stage's
requirement (e.g. `runAssetPlanner` moves `PRODUCTION_PLAN_READY -> ASSETS_REQUESTED`) — see
`docs/STATE-MACHINE.md`. A runner never forces a transition that `canTransition()` would reject;
`runStoryWriter` specifically checks `getNextStage(project.currentStage, contentType) === "SCRIPT_DRAFTED"`
before transitioning, so drafting a script while methodology is still required and undefined
creates the draft but leaves the project's stage (and therefore its next action) pointed at
"define methodology" rather than silently skipping it.

## Orchestration model

There is no single "mega agent". `packages/agents/src/domain.ts` holds the state-machine-aware
actions a human or the Next Action Engine triggers (`selectIdea`, `verifyClaim`, `approveScript`,
`markAssetReady`, `approveFinalRender`, `approveAndPublish`, `transitionStage`), and each tab in
the web app wires a specific runner or domain action to a button. The **Orchestrator** role
described in the product spec — "know project state, dispatch the right agent, enforce gates,
pause for approval" — is implemented as this combination of `resolveNextAction()` (what should
happen next) plus the approval gates baked into `domain.ts` (script approval, publishing), rather
than as a separate LLM call; there is nothing to "decide" that isn't already a deterministic
function of project state.

## Not yet implemented as runners

These have DB tables, Zod schemas (`packages/agent-schemas`), and prompts (`packages/prompts`)
ready, but no runner wired up yet — building one follows the exact same pattern as the runners
above:

- **Community Consensus Agent** → `community_consensus` table
- **Motion Director** → scene-level component/intensity selection (currently the Production
  Director picks `motionComponent`/`motionIntensity` directly per scene)
- **Asset Validator** → checking a delivered file against its `asset_requirements` row
- **Edit Director** → `edit_plan_scenes`, needs a real transcript first
- **Video Critic** → `qa_issues`, needs a rough render first
- **Publishing Strategist** → `publish_packages`, `shorts`
- **Analytics Reviewer** → `analytics_snapshots`

## Prompt versioning

`packages/prompts/src/index.ts` exports `PROMPT_REGISTRY: Record<AgentName, PromptVersion[]>` and
`getPromptForAgent(agent)`, which returns the version flagged `active: true` (or the highest
version number if none is flagged). Each prompt lives in its own file
(`packages/prompts/src/<agent>/v1.ts`) with `{ agent, version, createdAt, active, systemPrompt }`
— adding a v2 means adding a new file and flipping `active` rather than editing prompt text
inline in an API route.

## Schema validation and repair

`packages/agent-schemas` defines one Zod schema per structured output type (`IdeaCandidate`,
`Claim`, `ProductionScene`, ...). `safeValidate()` never throws — it returns a discriminated
`{ success: true, data } | { success: false, error }`. `runAgent()` uses that result: on failure
it appends the validation error to the next prompt attempt ("Your previous output failed
validation: ...") and retries exactly once before giving up and marking the `agent_runs` row
`FAILED`.
