---
description: PIVP validation gate. Run after every implementation phase before advancing.
---

# Validation Gate (PIVP)

This is a gate, not a suggestion. The agent does not advance to the next phase until this protocol completes.

## Phase 0 — Context Lock

Before validating, explicitly restate:
1. **Stack** — language, framework, runtime, package manager.
2. **Spec reference** — which plan/spec document and section this phase implements.
3. **Acceptance criteria** — as written in the plan, not invented or inferred.
4. **Out-of-scope items** — what this phase deliberately does not cover.

If the spec, criteria, or scope is ambiguous or missing: STOP and ask. Do not guess the acceptance bar.

## Phase 1 — Dead Code and Artifact Sweep

- Search for unused imports, unreferenced functions/classes, orphaned files, stale commented-out blocks, unused config keys, leftover debug prints.
- Use the correct tool for the stack: `ts-prune`/`depcheck` for TS/JS, `vulture` for Python.
- Every removal is logged as a REMOVED entry (file + line) in the issue log. Nothing is silently deleted.

## Phase 2 — Automated Debug Pass

- Run the project's actual build/compile step. No skipping.
- Run the full existing test suite (unit + integration). Do not mock away a failing test.
- Run the linter/type-checker at the strictest configured level.
- For each failure: attempt one automated fix, re-run. If still failing after 2 attempts, log as Blocker, halt. Do not suppress with try/catch, @ts-ignore, or type cast.

## Phase 3 — Code Review

Evidence-based only. Paste the actual diff/snippet, never "looks fine."

- Matches the architectural pattern already established (naming, layering, schema decisions).
- No hardcoded values that belong in config.
- No exposed secrets, credentials, or unauthenticated endpoints.
- Error handling present on every I/O, network, or external call.
- **Domain-specific risk check**: Name the bug class most likely for this domain and check for it explicitly. For algo trading: look-ahead bias, race conditions in concurrent code. For web: XSS/CSRF. This must be named, not skipped.

## Phase 4 — Validation

- Line up the implementation against each acceptance criterion from Phase 0, one at a time.
- Explicit PASS or FAIL per criterion. No aggregate "looks good."
- Any criterion that isn't testable as implemented is flagged UNVERIFIABLE, never silently passed.

## Phase 5 — Verification

- Execute the real feature path. Start the server, hit the endpoint, run the actual build.
- Capture real output/logs as evidence.
- **No self-certification**: The agent cannot mark a phase VERIFIED without pasting the actual command output. "Should work" is not verification.

## Phase 6 — Issue Logging

Append-only, persistent across phases.

| Field | Description |
|---|---|
| ID | Sequential |
| Phase | Which implementation phase |
| Severity | Blocker / Critical / Major / Minor / Cosmetic |
| Category | Dead Code / Debug / Review / Validation / Verification |
| Description | What's wrong |
| Evidence | Command output, diff, or log line |
| Status | Open / Fixed / Deferred |
| Owner Phase | Which phase fixes it if deferred |

## Exit Gate

- **Blocker or Critical open**: phase is NOT complete. No advancing.
- **Major**: must be fixed or explicitly deferred with a stated reason and owner phase.
- **Minor/Cosmetic**: logged, non-blocking.
- End with a summary: issue counts by severity, and gate status (PASS / BLOCKED).

## Token Cost Management

- Do not re-read entire files during validation. Use grep/targeted reads.
- Paste only the relevant diff or function, not the whole file.
- Run automated checks (tsc, lint, build) via command, not by reading code manually.
- Keep the issue log compact. One line per issue. Do not narrate.
