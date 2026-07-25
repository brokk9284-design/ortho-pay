# ORTHO-PAY — Gap Analysis & Fix Specification
**Current score:** 5.3 / 10 (benchmarked against reference job-board UI)
**Target score:** 9.9 / 10
**Reference standard:** The job-board app screenshot — clean gutters, consistent rounded geometry, layered cards, soft-gradient pills, floating action button, tight 8pt rhythm

This isn't a redesign from zero — ORTHO-PAY's information architecture (balance → actions → stats → activity) is already sound. The gap is almost entirely in **systemization**: the reference app clearly runs on a locked spacing/radius/color token system and layered card construction. ORTHO-PAY currently looks hand-assembled screen-by-screen, so the same components drift slightly in different places. Every point below is something a design system would have prevented automatically.

---

## 1. Spacing & Gutter System — no locked scale

**Gap:** In the reference, every gap between sections (search bar → filter pills → "Suggested Work" → card → "Job List" → card → bottom nav) is visibly built on one consistent unit (looks like an 8pt/4pt base grid — 8, 16, 24, 32px multiples only). In ORTHO-PAY, the gutter between the balance card and the action row, the action row and the stats row, and the stats row and "Recent Activity" all feel slightly different from each other — close, but not locked.

**Fix:**
- Adopt an explicit spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48px` — nothing outside this set
- Section-to-section gutter = fixed at one value (recommend 24px) everywhere, no exceptions
- Card internal padding = fixed at one value (recommend 20px) everywhere, no exceptions
- This single change is responsible for a large share of "why does the reference feel more expensive" — it's rhythm, not decoration

---

## 2. Corner Radius — inconsistent roundedness across components

**Gap:** The reference uses one clearly deliberate radius language: large, soft "superellipse"-style rounding (~24-28px) on cards and pills, consistently, everywhere — balance-adjacent cards, filter pills, the suggested-work card, the bottom nav pill, the FAB. ORTHO-PAY currently mixes radii: the balance card, the action tiles, the input fields, and the filter pills all appear to use *different* corner radii relative to their own size, so nothing feels like one family of shapes.

**Fix:**
- Lock exactly 3 radius tokens: `sm: 10px` (chips/inputs), `md: 16px` (buttons/small cards), `lg: 24px` (hero cards, bottom nav container)
- Apply consistently: balance card = `lg`, action tiles = `md`, filter pills = full pill (`999px`), inputs = `sm`
- Never let radius scale improvisationally with component size — pick from the 3 tokens only

---

## 3. Flat, Static Cards vs. Layered Card Construction

**Gap:** This is probably the single biggest reason for the score gap. The reference's job card isn't one flat surface — it's **two visually distinct layers fused into one card**: a white info layer (company, role, tags, bookmark) sitting directly on top of a colored footer layer (time-ago + CTA button), with a subtle color/tone shift at the seam. This layering is what makes it read as "designed" rather than "templated." ORTHO-PAY's cards (balance card, action tiles, stat tiles) are single flat fills with no internal layering or depth — every card is one visual event instead of two.

**Fix:**
- Redesign the balance card as two zones: top zone (balance figure, tag) on the brand gradient/color, bottom zone (Copy Tag action + a secondary stat like "this month") on a subtly shifted tone of the same color family
- Apply the same layered logic to any "status" cards in Recent Activity (e.g., transaction row = white info layer + colored status footer strip for Pending/Completed/Reversed, matching the reference's time+CTA footer pattern)

---

## 4. No Motion / Transition Design — everything is a static screenshot state

**Gap:** The evaluator flagged "no transition" — meaning there's no evidence of state change design: no button press feedback, no card entrance animation, no tab-switch transition, no skeleton/loading state, no pull-to-refresh. A reference-tier UI is judged not just on the static frame but on the implied interaction quality — soft-gradient pills like the ones in "All Jobs" imply a designed active/inactive transition state that ORTHO-PAY's flat pill fills don't suggest at all.

**Fix (minimum viable motion system):**
- **Tab/filter pills:** 150–200ms ease-out transition between active/inactive fill + a subtle scale (0.97→1) on tap
- **Buttons (Send/Request/Deposit/Withdraw, Apply/View equivalents):** press state = scale to 0.96 + opacity 0.9, 100ms
- **Card entrance:** stagger fade+slide-up (8px) on list items when the screen loads, 40ms stagger between items
- **Balance number:** animate count-up on load/refresh rather than static render
- **Bottom nav active tab:** animated pill background that slides between tabs (visible in the reference's "Home" pill), not an instant swap
- **Loading/skeleton state:** shimmer skeletons for balance card and activity rows while data loads — currently implied to not exist

---

## 5. Filter Pills — flat vs. soft-gradient depth

**Gap:** Reference "All Jobs" pill has a soft blue gradient with a subtle highlight, giving it tactile depth even in a static screenshot. ORTHO-PAY's equivalent pills (All / In Escrow / Pending / Completed / Reversed) are flat solid fills — same information, less perceived quality.

**Fix:** Apply a subtle 2-stop gradient (10–15% lightness difference, same hue) to the active pill state, plus a 1px inner highlight at the top edge. Inactive pills stay flat/neutral — contrast between active and inactive should come from *both* color and this depth cue, not color alone.

---

## 6. Icon Treatment — boxed vs. floating

**Gap:** Reference icons (bell, filter, bookmark, clock) are either bare or in a perfectly circular soft-fill container, consistently sized, consistently weighted (thin/medium line-weight, not mixed). ORTHO-PAY's action icons sit in translucent rounded-square containers nested inside already-rounded cards (double-container problem noted previously) — this reads as assembled-from-kit rather than drawn-for-this-app.

**Fix:** Standardize every icon to one of two treatments only — bare icon with label (bottom nav, small actions) or icon in a perfect circle, one fixed size (36–40px), one fixed opacity — never a rounded-square inside a rounded-square.

---

## 7. Typography Hierarchy — good bones, imprecise scale

**Gap:** The reference uses a clear 3-tier scale: large bold headline (job title/role), medium label (company/meta), small pill text — each with a visible weight *and* size jump between tiers, not just a color change. ORTHO-PAY's "Available Balance" label, the $ figure, and the tag/USD line are close in visual weight to each other relative to the reference's clearer jumps.

**Fix:** Lock a type scale: `label: 12px/500`, `body: 14px/500`, `subhead: 16px/600`, `headline: 28-32px/700`, `hero-figure: 40px/800`. Apply the same scale identically across every screen (Home, Request Money, Settings) — the Request Money screen already gets close to this; extend it app-wide.

---

## 8. Bottom Navigation — functional vs. crafted

**Gap:** Reference bottom nav has a soft pill background that highlights only the active tab (Home), floating slightly above a plain background, plus a detached circular FAB (+) that breaks the bar — this is a deliberately crafted nav, not a default tab bar. ORTHO-PAY's bottom nav is a flat row with a simple color change on the active label/icon — functionally identical, visually generic.

**Fix:** Give the active tab a soft pill background (matches filter-pill treatment for consistency), and consider whether ORTHO-PAY needs its own FAB-equivalent (e.g., a floating "+ New Transaction" action) if a primary action doesn't already live in the tab bar.

---

## 9. Whitespace Discipline — reference "breathes," ORTHO-PAY is denser

**Gap:** The reference has generous negative space around each card and section even on a single mobile viewport — nothing touches the edges tightly, every card has visible air above/below it. ORTHO-PAY's cards and stat tiles sit closer to their neighbors and to the screen edges, giving a slightly more "cramped, form-like" impression versus "curated, editorial" impression.

**Fix:** Increase page-edge margin to 20-24px minimum (check current — if it's 16px, bump it), and ensure vertical rhythm between major sections uses the largest spacing token (32px) rather than the mid one (24px), reserving 24px for within-section gaps only.

---

## Priority Order to Close the Gap Fastest

| Priority | Fix | Why first |
|---|---|---|
| 1 | Layered card construction (balance card, activity rows) | Single highest visual-quality signal, affects every screen |
| 2 | Locked spacing scale (4/8/12/16/24/32/48) | Fixes the "almost consistent but not quite" feeling everywhere at once |
| 3 | 3-token radius system | Second-highest "cohesion" signal, cheap to implement |
| 4 | Minimum viable motion system (Section 4) | This is what "static design, no transition" is specifically penalizing |
| 5 | Icon treatment standardization | Removes the double-container "assembled" tell |
| 6 | Gradient/depth on active pills | Smaller visual lift, but closes the gap to the reference's tactile feel |
| 7 | Typography scale lock | Refinement pass once structure is fixed |
| 8 | Bottom nav pill + whitespace pass | Final polish layer |

Implementing 1–4 alone should move the score from 5.3 into the 8+ range, since those are structural/systemic issues affecting every screen simultaneously rather than isolated component fixes. 5–8 are what close the remaining gap to 9.9.
