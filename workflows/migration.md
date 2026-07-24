---
description: Stack migration protocol. Run before migrating any module between languages or stacks.
---

# Stack Migration Protocol (SMP)

Migration is not a rewrite from memory. It is a behavior-preserving translation. The acceptance criteria come from the old system's actual observed behavior, captured before any new code is written.

## Phase 0 — Full Functional Inventory

Before writing any new-stack code:
- Enumerate every route/endpoint, every UI state, every function's inputs and outputs, every side effect (including implicit ones).
- Include edge cases and error paths explicitly, not just the happy path.
- Include behavior that is true of the running system but undocumented.
- Output: a Functional Inventory document in `docs/architecture/`. This becomes the acceptance criteria.

## Phase 1 — Characterization Tests

- Write tests against the old stack capturing its actual current behavior, including quirky edge-case outputs.
- If something is a known bug being intentionally fixed, flag it explicitly and exclude from the parity contract.
- These tests are the parity contract. The migrated code is not done until the same tests pass against the new stack.

## Phase 2 — Concept Mapping Table

Build an explicit idiom-to-idiom mapping table for the specific language pair in play. Translate through the table so equivalent constructs get consistent treatment.

### JS to Python notes:
- Truthy/falsy differences: JS treats `[]` and `{}` as truthy. Python treats empty collections as falsy.
- Equality: JS `==` coercion has no Python equivalent. Needs explicit type handling.
- Async model: Node's event loop and Python's asyncio are not drop-in equivalents.
- JSON/date handling: JS `Date` and Python `datetime` do not match by default.
- Naming: camelCase to snake_case needs a systematic rename pass.

### Python to JS notes:
- Typing looseness: Python's `TypeError` at call time does not translate to JS coercion. Add explicit validation.
- Comprehensions/generators translate to map/filter/reduce or manual loops.
- Decorators translate to higher-order functions. Confirm runtime support.
- GIL-based concurrency assumptions do not hold in JS/Node.

## Phase 3 — Incremental Migration

- Migrate in vertical slices, one feature/module at a time. Never the whole app in one pass.
- Old and new code coexist via a compatibility/adapter layer.
- Each slice gets its own full PIVP validation before the next slice starts.

## Phase 4 — Per-Unit Parity Checklist

For every migrated unit:
- **Functional parity** — same inputs produce same outputs
- **Edge-case parity** — including error conditions and boundary values
- **Error-handling parity** — errors surface the same way, or change is intentional and documented
- **Performance parity** — not silently slower
- **Security parity** — STBP still applies. Migration is not an excuse to reintroduce a vulnerability.
- **Type-safety parity** — new types describe real observed behavior, not an idealized simplification

## Exit Gate

A migration is not complete until:
- Every item in the Phase 0 Functional Inventory has a passing characterization test on the new stack.
- No Blocker/Critical items open per PIVP.
- No STBP security regressions.
- Migration log fully written in `docs/architecture/`.
- The old stack's compatibility layer is scheduled for removal only after a defined production burn-in period.
