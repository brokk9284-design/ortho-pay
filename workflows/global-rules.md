---
description: Global build rules extracted from GBEGP, RODP, CCP. Run at session start.
---

# Global Rules — Session Bootstrap

These rules apply to every session in this workspace. They are extracted from the UIOS build governance protocols and are non-negotiable.

## 1. Session Start (GBEGP Phase 0)

Before writing any code, state explicitly:

1. **Environment**: OS, runtime, package manager, framework. Check for existing config files (package.json, requirements.txt, Dockerfile). Do not assume.
2. **Dev/Prod separation**: Confirm `/development` and `/production` directories exist. If not, create them before any build work. Confirm `.env.example` is committed, `.env.development` and `.env.production` are gitignored.
3. **Context ingestion**: Read the latest progress report from `docs/memory/`, the current issue log, and any handoff packet. Produce a 3-5 line summary of where the project stands. Get confirmation before proceeding.
4. **Scope confirmation**: Restate what you understand you are building this session. Nothing more. This is the checkpoint against feature creep.

## 2. Large File Reading (Token Cost Management)

When a file exceeds 20-30KB or has accumulated over many sessions:

1. **Index first**: Extract headers only (`grep -n "^#"`). Build a table of contents before reading body text.
2. **Read the tail first** for rolling logs. Recent entries are what matter.
3. **Targeted read by section/line range**. Never read the full file unless the task genuinely requires it.
4. **Compact on a schedule**: When a log crosses its threshold, fold older entries into a digest. Keep the full log as archive.

## 3. Coding Standards (GBEGP Section 1)

- **YAGNI by default**. Do not write code for a feature not in the current phase spec.
- **No premature abstraction**. Abstract on the second or third real repetition, not the first anticipated one.
- **One responsibility per function/module**. If a function needs "and" to describe it, split it.
- **Comments explain why, not what**. Code should be readable enough that a comment restating it is redundant.
- **Token economy**: Keep files small. Maintain a running state summary. Do not paste entire files when a targeted diff will do.

## 4. File Organization (RODP)

- **One concern per file**. A short file doing three unrelated things gets split. A long file doing one thing is fine.
- **Soft caps**: CSS 150-250 lines, backend service 200-300 lines, frontend component 150-200 lines. The cap is a prompt to check for mixed concerns, not a hard line.
- **CSS split by concern**: tokens, themes, breakpoints, components, layout. Theme logic, responsive logic, and component logic never share a file.
- **Backend split**: controllers (routing only) -> services (business logic) -> repositories (data access) -> validators -> middleware.
- **Frontend pages compose components**. A page does not implement multiple workflows inline.

## 5. Documentation Rules (RODP Section 6)

- `/docs/architecture` — system design, decision records
- `/docs/schema` — data models, DB schema, API contracts
- `/docs/backend` — service responsibilities, endpoint inventories
- `/docs/frontend` — component inventory, design-system reference
- `/docs/memory` — progress reports, session summaries, handoff packets

## 6. Progress Report Triggers (RODP Section 7)

Write a progress report to `docs/memory/` whenever:
- Any substantial code change lands
- A new plan or architectural decision is made
- A mistake is found and corrected

**Format** (short, not a novel):
```
Date | Phase
What changed
Why
What's next
Links to relevant files/docs
```

## 7. Writing Rules (CCP)

- **No em dashes**. Use periods, commas, or restructure.
- **No AI-slop**: "seamless," "robust," "unlock," "elevate," "leverage," "dive in," "game-changing," "cutting-edge," "empower," "supercharge." Use the plain verb.
- **No sci-fi jargon**. Say the plain action, not a metaphor for it.
- **Lead with the conclusion**. Then only the supporting detail actually needed.
- **No process narration**. State the finding, not the journey.
- **One idea per sentence**. If it needs "and," it's two sentences.

## 8. Code-Writing Workflow (CCP Section 3)

Never generate code as one giant pass. Sequence:
1. Define the interface first (name, inputs, outputs). Confirm it matches the spec.
2. Write the unit (one function, one component).
3. Validate that unit before moving to the next.
4. Integrate the unit into its module.
5. Module-level check once all units are in.
6. Repeat for the next module.

## 9. Feature Scope Discipline (GBEGP Section 2)

- **Idea to spec**: When a new idea is raised, restate it as a short structured spec before coding. What problem, who uses it, what existing feature it overlaps with.
- **Synthesis check**: Before adding any new UI surface, ask: can this live inside an existing surface? If a dashboard trends past 5-6 top-level tabs, consolidate.
- **Boundary rule**: The agent proposes. The human approves scope. Never silently expand scope mid-build.

## 10. Dev to Production Promotion (GBEGP Section 3)

1. All active work in `/development` against `.env.development`.
2. A phase is only eligible for promotion after PIVP passes (no open Blocker/Critical).
3. Promotion is a deliberate copy/PR step, never automatic.
4. Environment-specific behavior is driven by `.env` files, never hardcoded `if (dev)` branches.

## 11. Change Discipline

These rules govern every edit to a code file. They exist to prevent cascading failures and unfocused work.

1. **One problem per change.** Do not create a new problem while solving one. If a change requires touching a second file or a second function to be correct, state that explicitly before making the second edit. Do not silently expand the blast radius.
2. **Report bugs before fixing them.** If you find a bug while making an unrelated change, stop. Report the bug (file, line, description, severity). Do not fix it in the same edit. The human decides whether to fix it now, defer it, or ignore it. Fixing an unreported bug in the middle of another task is how regressions are born.
3. **Deep diagnosis for code reviews.** When reviewing code, read every line of the function or module under review. Trace the data flow. Check the schema against the code that writes to it. Check the types against the code that consumes them. Check the error paths, not just the happy path. "Looks fine" is not a review. Paste the actual code, state the actual finding.
4. **Goal lock.** State the goal before starting work. Do not deviate from it mid-task. If a new idea or improvement occurs during the work, write it down and continue with the original goal. The human decides whether to pivot. Scope creep in the middle of a change is the most common cause of incomplete work and broken builds.

## 12. Mobile-First and Vectorization

These rules govern how frontend and backend code is structured. They exist to keep files small, concerns separated, and the product usable on phones first.

1. **Mobile-first web app.** Every screen is designed for phone portrait first, then scaled up to tablet, laptop, desktop. Never the reverse. Test on a 375px viewport before testing on 1440px. If it breaks on mobile, it is broken.

2. **CSS is branched by concern, not monolithic.** No single CSS file. Split into:
   - `foundation/` -- colors, typography, spacing, shadows, radii, z-index, breakpoints, opacity, blur
   - `themes/` -- light, dark (and future: high-contrast, corporate)
   - `layouts/` -- page shells, grid systems, containers
   - `components/` -- one file per component or component group
   - `motion/` -- transitions, page animations, skeleton loaders, hover effects, micro-interactions
   - `responsiveness/` -- phone, tablet, laptop, desktop, orientation
   - `accessibility/` -- keyboard, screen-reader, reduced-motion, focus, contrast
   - `utilities/` -- spacing, visibility, positioning, overflow, transforms

   Theme logic, responsive logic, and component logic never share a file. A component CSS file owns its base styles, variants, and states. A responsive CSS file owns breakpoint overrides only. A theme CSS file owns color and contrast overrides only.

3. **TypeScript is vectorized.** No god files. Split by concern: one component per file, one hook per file, one utility per file, one type definition per file. If a file needs "and" to describe it, split it.

4. **No file exceeds 1000 lines.** Frontend, backend, CSS, TypeScript, Python. No exceptions. If a file approaches 800 lines, plan the split before it crosses 1000. The split is by responsibility, not by arbitrary line count. A 900-line file doing one thing is acceptable. A 600-line file doing three things is not.

5. **Backend modules are vectorized.** Split by concern: controllers (routing only), services (business logic), repositories (data access), validators, middleware. One responsibility per module. No service file that handles auth AND billing AND data access.
