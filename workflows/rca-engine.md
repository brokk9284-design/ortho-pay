---
description: RCA Engine implementation guide. Domain: algorithmic trading. Hybrid TS + Python stack.
---

# RCA Engine Implementation

## Context

The RCA Engine (RCAL-02) is a Root Cause Analysis system built on the UIOS engine architecture. It is being built as an "RCA Labroom" calibrated for the algorithmic trading domain.

**Repo structure** (each service in its own folder under `services/`):
```
services/
  rca-frontend/       React 18 + Vite 5 + TypeScript (Pallet Ross design system)
  rca-api-gateway/    Express + TypeScript (API gateway)
  rca-playwright/     Playwright workers (search, extraction, dedup)
  rca-ai-engine/      Python + FastAPI + LangGraph (AI orchestration)
shared/
  types/              Cross-service TypeScript types
  schema/             SQLite schema (shared by TS and Python)
data/                 SQLite database (gitignored)
```

**Key documents**:
- `docs/architecture/RCAL-02-RCA-Engine-Architecture.html` — full architecture, schema, build plan, benchmark
- `docs/architecture/RCAL-01 Multi-Agent-RCA-Lab Systems-Design-Brief.md` — original design brief
- `docs/architecture/playwright-for-RCA-Labroom.md` — Playwright research engine spec
- `services/rca-frontend/` — existing frontend (React 18, Vite 5, Pallet Ross design system, Level 3 SaaS)

**Domain**: Algorithmic trading failure analysis
**Benchmark**: RED-2400 (6,660 rejected trading events) + 4 verified incidents (Citigroup, Jane Street, Japan flash crash, Warsaw halt)
**Approval targets**: 70% exact match on incidents, 80% on RED-2400, <10% calibration delta

## Technology Stack

### TypeScript Layer (Mechanical + Presentation)
- **Playwright workers**: browser automation, multi-engine search, HTML extraction, deduplication
- **API Gateway**: Express or Fastify. Routes research jobs, serves RCA reports. Talks to Python via internal HTTP.
- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + Framer Motion 11 (already built)
- **Database**: SQLite via better-sqlite3. sqlite-vec for vector similarity. Shared with Python layer.

### Python Layer (AI + Causal Reasoning)
- **LangGraph orchestration (ADCOS)**: StateGraph with nodes for each engine stage
- **Causal reasoning (ARUEV)**: 5 Whys, Fishbone, Fault Tree, Bayesian confidence ensemble
- **Hypothesis validation (HVE)**: Separate OpenAI Assistant instance. No self-certification.
- **Embeddings**: sentence-transformers all-MiniLM-L6-v2 (CPU-friendly). Writes to shared sqlite-vec.
- **Claim extraction + consensus**: LLM-based. Contradiction detection across sources.

### Inter-Layer Communication
- TypeScript API Gateway calls Python FastAPI via HTTP (`localhost:8000`)
- SQLite database file is the shared state between both layers
- The frontend never knows Python exists. The AI layer never knows React exists.

## Build Sequence

### Backend (in order)

1. **TypeScript API Gateway** — Express/Fastify server. Routes: POST /research, GET /research/:id, GET /research/:id/report, POST /crawl, GET /evidence/:incidentId. SQLite via better-sqlite3.
2. **Playwright Worker Pool** — Node.js worker threads. Multi-engine search. Query variation generator. Content extraction, metadata parsing, SHA-256 deduplication.
3. **Python AI Orchestration** — FastAPI server. LangGraph StateGraph. Nodes: pre_research, qof_gate, kge_retrieve, aruev_cause, hve_validate, sme_simulate, dqs_score, rge_report, gce_compliance, xte_trace.
4. **Embeddings + RAG** — sentence-transformers. sqlite-vec index. Index all evidence and reference cases.
5. **Database Schema** — SQLite implementation of the schema in RCAL-02 Section 03. All tables from the architecture doc.
6. **Integration Testing** — End-to-end: submit incident, Playwright crawls, Python reasons, report generated. Verify against RED-2400 and verified incidents.

### Frontend Integration (in order)

1. **API Client Layer** — Type-safe fetch client. React Query or SWR for caching. Loading states use existing Skeleton components.
2. **Incident Submission View** — Form matching RCARequest schema. Uses existing Pallet Ross components.
3. **Live Analysis Dashboard** — Real-time pipeline progress. Pipeline nodes light up as stages complete. Uses existing motion variants.
4. **RCA Report Viewer** — Structured display of RCAReport. Causal chain with confidence scores. Evidence graph with citations. Uses DetailModal for deep-dives.
5. **Calibration Dashboard** — Accuracy vs reference set, false positive rate, confidence calibration curve.

## Frontend Validation via Pallet Ross

Every new view inherits the design system automatically:
- Semantic CSS variables ensure theme-aware rendering (zero hardcoded colors)
- useBreakpoint hook ensures responsive behavior at 375px, 768px, 1024px, 1440px
- FocusTrap + ARIA attributes ensure keyboard accessibility
- token-audit.mjs runs in CI to catch violations
- Playwright visual tests cover page loads, navigation, theme toggle, modal interactions
- New RCA views use existing components (InfoCard, DetailModal, PillButton, Eyebrow, WordRevealHeading). No new design primitives needed.

## Calibration Protocol

1. **Seed reference set**: 4 verified incidents + 20 sampled RED-2400 events into rca_reference_cases. Total: 24 cases (meets RCAL-01 minimum of 20).
2. **Blind run**: Run ADCOS on each case with known root cause withheld.
3. **Score**: exact match, partial match, or miss. Track false positive causes.
4. **Confidence calibration**: Compare engine-reported confidence to actual accuracy. Adjust Bayesian priors if miscalibrated.
5. **Drift tracking**: Re-run on every model version change. Store in rca_calibration_runs.
6. **Approval gate**: 70% exact match on incidents, 80% on RED-2400, <10% calibration delta, zero false positives on verified incidents.

## Token Cost Management

- **Read only what you need**: Use grep and targeted reads. Do not read entire files unless the task requires it.
- **Index large files first**: Extract headers before reading body text (GBEGP Section 0.5).
- **Compact logs on schedule**: When docs/memory/ progress logs cross 20-30KB, fold older entries into a digest.
- **One unit at a time**: Build and validate one function/component before moving to the next (CCP Section 3). This keeps context small.
- **State summary**: Maintain a running 3-5 line state summary. Update at the end of each phase. This replaces re-reading the entire codebase.
- **Do not paste entire files**: Use targeted diffs and function-level snippets when working.
- **Run automated checks via command**: tsc, lint, build. Do not manually read code to check for errors.
- **Progress reports are short**: Date, what changed, why, what's next, links. Not a novel.

## Memory and Documentation Rules

Any agent picking up this project must:

1. Read the latest progress report in `docs/memory/` (not the entire folder, just the latest 2-3)
2. Read the handoff packet if one exists
3. Read the relevant section of `docs/architecture/RCAL-02-RCA-Engine-Architecture.html` for the current build phase
4. Check the current issue log for open Blocker/Critical items
5. Produce a 3-5 line summary of understanding and get confirmation before proceeding
6. Write a progress report at the end of the session (or when a substantial change lands)
7. Save important context as memories using the memory system (architectural decisions, schema choices, calibration results, bug patterns)

## What Is Already Built

- **Frontend**: `services/rca-frontend/` — React 18, Vite 5, TypeScript, Tailwind CSS 3, Framer Motion 11. Level 3 SaaS maturity. 17 reusable components. Pallet Ross design system with semantic CSS variables, dark mode, responsive, accessibility (FocusTrap, ARIA), token-audit (0 violations), Playwright visual tests. Build clean, 99KB gzipped.
- **Architecture doc**: `docs/architecture/RCAL-02-RCA-Engine-Architecture.html` — 12 sections covering engine mapping, I/O model, schema, Playwright architecture, orchestration, domain selection, tech stack, build plan, benchmark protocol.
- **Playwright spec**: `docs/architecture/playwright-for-RCA-Labroom.md` — research engine architecture, crawl strategy, source trust weights, reliability scoring, cross-verification protocol.
- **API Gateway scaffold**: `services/rca-api-gateway/` — Express server with route stubs. Not yet implemented.
- **Playwright scaffold**: `services/rca-playwright/` — Types, query generator, deduplication. Crawl worker not yet implemented.
- **AI Engine scaffold**: `services/rca-ai-engine/` — FastAPI server with health and orchestrate stubs. LangGraph not yet wired.
- **Shared types**: `shared/types/rca.ts` — RCARequest, RCAReport, EvidenceItem, CausalChainNode, JobStatus, etc.
- **Shared schema**: `shared/schema/rca-schema.sql` — All SQLite tables with indexes.

## What Remains

- TypeScript API Gateway
- Playwright worker pool
- Python AI orchestration (LangGraph)
- Embeddings + RAG
- SQLite schema implementation
- Frontend integration (API client, incident submission, live dashboard, report viewer, calibration dashboard)
- Calibration run against RED-2400 and verified incidents
- PIVP validation gate on each phase
