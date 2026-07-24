---
description: Agent handoff protocol. Run when a new agent/session takes over from another.
---

# Agent Handoff Protocol

When a new agent or session takes over from another, run GBEGP Phase 0 in full and additionally require a handoff packet.

## Handoff Packet (Writer's Side)

The outgoing agent produces a handoff document in `docs/memory/` with this structure, front-loaded:

1. **Status / gate first** — what state is this in right now (PASS / BLOCKED).
2. **Decisions made** — what was decided and why, briefly.
3. **Open items** — what is unresolved, what is deferred and why.
4. **Do-not-touch list** — anything intentionally left alone (e.g. a working integration not to be "improved").
5. **Open questions** — anything the prior agent flagged but did not resolve.
6. **Evidence / links last** — source files, logs, test output, for anyone who needs to go deeper.

No process narration. No re-explaining things already covered in a linked doc. Reference it instead of restating it.

## Reading a Handoff (Reader's Side)

The incoming agent reads in this fixed order:

1. Current status/gate
2. Open issues
3. Decisions already made
4. Do-not-touch list
5. Only then, if something is still unclear, go into the linked source files

**Rule**: Do not re-derive a conclusion the document already states. Trust logged decisions unless something concretely contradicts them. If it does, flag it rather than silently overriding it.

## Incoming Agent Rules

- The incoming agent does not override a prior decision it disagrees with. It flags it for the human to decide.
- Past work is not automatically correct, but it is not fair game for silent rewriting either.
- Run GBEGP Phase 0 (environment check, dev/prod confirm, context ingestion, scope confirm) before touching anything.

## Token Cost Management for Handoffs

- Read only the latest handoff packet and the most recent 2-3 progress reports. Do not read the entire docs/memory/ folder.
- If the handoff packet references files, read only the referenced sections, not the full files.
- Produce a 3-5 line summary of understanding. Get confirmation before proceeding. This is cheaper than re-reading the entire codebase.
