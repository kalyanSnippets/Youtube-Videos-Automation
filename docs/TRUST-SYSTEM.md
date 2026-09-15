# Trust & Evidence System

This is the project's core differentiator: every factual or evaluative statement a script makes
is tracked as a **claim**, classified, sourced, and gated before it can reach an approved script.

## Claim types

| Type         | Meaning                                                    | Example safe wording |
|--------------|-------------------------------------------------------------|------------------------|
| `FACT`       | Backed by an official/primary source                        | "According to the official pricing page, ..." |
| `OUR_TEST`   | Backed by a test the channel ran itself, under a locked methodology | "In our test run, we found ..." |
| `COMMUNITY`  | Backed by broad (multi-source) community sentiment           | "Several community threads report ..." |
| `OPINION`    | The channel's own judgment, not presented as fact             | "In our opinion, ..." |
| `UNVERIFIED` | No adequate source found yet                                  | must use hedged/absent wording; **blocks script approval** |

A claim's `safeWording` and `forbiddenWording` fields exist so the Story Writer (and a human
reviewer) can see exactly how a claim may and may not be phrased — an `OPINION` must always read
as opinion, a `COMMUNITY` claim must never be phrased as settled fact.

## Trust coverage

`calculateTrustCoverage(claims)` (`packages/shared/src/enums.ts`) is:

```
(total claims - UNVERIFIED claims) / total claims * 100
```

An empty ledger reports 100% (nothing to distrust yet) — trust coverage only ever measures
claims that have actually been extracted. It's shown on every project card, the project header,
and the Claims & Evidence tab.

## The approval gate

`approveScript()` (`packages/agents/src/domain.ts`) refuses to mark a script `APPROVED` while
`unverifiedClaimCount > 0`, **unless** the caller explicitly passes `overrideUnverified: true` and
a reason string. An override:

- is recorded on the project (`claim_override_at`, `claim_override_reason`),
- is recorded on the script row (`overrode_unverified_claims`),
- produces a visible warning in the UI (the Script tab shows the exact count and requires typing
  a reason before the override checkbox does anything),
- is logged to `project_activity` with the reason included.

Nothing in the codebase can silently approve a script with unresolved unverified claims.

## Sources

Every claim can carry multiple `claim_sources` rows, each tagged `OFFICIAL`, `INDEPENDENT`,
`COMMUNITY`, or `OUR_TEST`. The UI renders these with distinct badge colors specifically so an
official source is never visually confused with a community source or the channel's own test —
mixing "company says" with "community thinks" with "our test" with "our opinion" in one
undifferentiated sentence is exactly what this system exists to prevent (see product rule #6 in
the spec this app was built from).

## Community consensus

`community_consensus` rows never claim scientific polling — the schema stores `sentiment` as one
of `STRONGLY_POSITIVE / MOSTLY_POSITIVE / MIXED / MOSTLY_NEGATIVE / WEAK_CONSENSUS`, plus a
`sourceCount` and `confidence`, specifically so a consensus derived from two threads reads
differently from one derived from twenty.

## Never-fabricate rules enforced in code, not just prompts

- `NotConnectedResearchProvider`, `NotConnectedTranscriptionProvider`, and
  `NotConnectedRenderProvider` all throw rather than returning synthetic data.
- The MOCK AI provider's output is tagged `_mock: true` and every row it produces is stamped
  with `sourceProvider` / `providerUsed = "MOCK"`; the web app shows a persistent MOCK MODE badge
  whenever no real provider is configured.
- `runAgent()` never persists output that failed Zod validation twice in a row — it throws.
