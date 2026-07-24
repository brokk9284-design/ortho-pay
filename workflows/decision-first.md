---
description: Decision-first development integration. Positions spec generation after problem discovery and decision validation.
---

# Decision-First Development (DFDI)

Spec-driven development fixes the failure mode where an agent goes straight from a vague prompt to code. But it assumes the user already knows the real problem. This protocol handles the harder, earlier case: the user does not yet know the real problem, and the system has to discover it before a specification can be written.

## The Combined Pipeline

```
Problem Discovery          (discover the real problem, not just the stated one)
   ↓
Knowledge Construction
   ↓
Decision Validation        (hypothesis generation, verification, simulation)
   ↓
Specification Generation   ← spec writing enters here
   ↓
Architecture               ← environment/folder structure
   ↓
Task Planning              ← unit-by-unit build sequencing
   ↓
Implementation             ← one unit at a time
   ↓
Testing / Verification     ← PIVP gate
   ↓
Deployment                 ← promotion workflow + security gate
   ↓
Monitoring / Learning / Memory  ← progress reports, handoff packets
```

## Where Each Protocol Slots In

| Pipeline stage | Owning system |
|---|---|
| Problem Discovery, Knowledge Construction, Decision Validation | Decision-engineering pipeline |
| Specification Generation | Spec document in docs/architecture/ |
| Architecture | GBEGP Section 1 (environment/folder structure) |
| Task Planning | CCP Section 3 (unit-by-unit build sequencing) |
| Implementation | One unit at a time per CCP |
| Testing / Verification | PIVP gate |
| Deployment | GBEGP Section 3 + STBP Sections 4-5 |
| Monitoring / Learning / Memory | RODP docs/memory (progress reports, handoff packets) |

## Rules

- Do not start coding until the problem is understood and the decision layer is validated.
- Write a short structured spec before implementation: what problem, who uses it, what existing feature it overlaps with.
- Get a go-ahead on the spec before any code is written.
- PIVP remains the real gate after implementation, not a lighter built-in check.
