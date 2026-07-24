---
description: Frontend code review protocol for blthr. Run after every build phase before advancing to the next.
---

# Frontend Code Review Protocol (FCRP)

Run after every build phase. No phase advances until this gate is PASS.

## Sources

This protocol synthesizes rules from:
- [Front-End Checklist](https://github.com/thedaviddias/Front-End-Checklist) (73k stars, 385 rules, 11 categories)
- [Dify Accessibility And UI Rules](https://github.com/langgenius/dify/blob/main/.agents/skills/frontend-code-review/references/accessibility-ui.md)
- [sapegin/frontend-pull-request-checklist](https://github.com/sapegin/frontend-pull-request-checklist)
- [React Doctor](https://github.com/millionco/react-doctor) (14k stars, deterministic React scanner)
- [Feature-Sliced Design code review](https://feature-sliced.design/uz/blog/code-review-best-practices)
- [Firefox Frontend Code Review Best Practices](https://github.com/spsforks/mozilla-firefox-firefox/blob/main/browser/docs/FrontendCodeReviewBestPractices.md)

## Phase Gate Rule

After completing a build phase, run all 8 sections below. Each section produces a PASS or FAIL. All sections must PASS to advance.

---

## Section 1: Layout And Alignment

Review every new page and component for visual correctness.

### Checklist

- [ ] **Container widths:** Every container has explicit width constraints (max-width or parent flex/grid). No unconstrained divs that expand to fill viewport unexpectedly.
- [ ] **Center alignment:** Centered divs use `flex items-center justify-center` or `mx-auto` with a max-width. No manual `margin-left`/`margin-right` hacks.
- [ ] **Flex children overflow:** Text in flex children has `min-w-0` when it can overflow. Long text uses `truncate`, `line-clamp`, or `break-words`.
- [ ] **Adornment shrink:** Right-side icons, badges, and action buttons use `shrink-0` so they do not collapse before the text area.
- [ ] **Grid alignment:** Grid items align consistently. No items that break out of their grid cell.
- [ ] **Spacing consistency:** All spacing uses design tokens (CSS variables or Tailwind classes). No hardcoded pixel values.
- [ ] **Empty states:** Empty arrays or empty strings render a proper empty state component, not a broken layout.
- [ ] **Overlap check:** No element overlaps another at any breakpoint (375px, 768px, 1024px, 1440px). Verify with browser preview at each width.
- [ ] **Z-index discipline:** Z-index values use defined tokens (e.g., `z-nav`, `z-modal`, `z-dropdown`). No magic numbers like `z-index: 9999`.

### Verification

Open the page in browser preview. Resize through all 4 breakpoints. Screenshot each. Confirm no overlap, no overflow, no broken layout.

---

## Section 2: Button And Interactive Element Audit

Every button must have an action. Every interactive element must be accessible.

### Checklist

- [ ] **No dead buttons:** Every button routes to a page, opens a modal, toggles a state, or triggers an action. No "coming soon" or disabled-without-reason buttons.
- [ ] **Button placement:** Buttons are placed where users expect them. Primary action is bottom-right on mobile, top-right on desktop. Secondary actions are to the left or below.
- [ ] **Collapsible/accordion:** Expand/collapse buttons are placed at the top-left of the section they control. Chevron rotates on expand. Content below pushes down, does not overlap.
- [ ] **Dropdown menus:** Dropdown triggers have a visible chevron. Dropdown content appears below the trigger, not on top of it. Clicking outside closes the dropdown.
- [ ] **Modal triggers:** Buttons that open modals are clearly labeled. Modal close button (X) is top-right. Clicking backdrop closes modal. Escape key closes modal.
- [ ] **Icon-only buttons:** Every icon-only button has `aria-label` or `title` attribute. No icon-only buttons without accessible names.
- [ ] **Button vs link:** Navigation actions use `<Link>` or `<a>`. State changes use `<button>`. No `<div onClick>` for interactive elements.
- [ ] **Button text:** Button text is actionable and specific ("Export Report", not "Click Here" or "Submit").
- [ ] **Disabled state:** Disabled buttons have `opacity-50 cursor-not-allowed` and a tooltip explaining why they are disabled.
- [ ] **Loading state:** Buttons in loading state show a spinner and are disabled. Text changes to "Loading..." or similar.

### Verification

Click every button on every new page. Confirm each one does something. Tab through all interactive elements with keyboard. Confirm focus order is logical.

---

## Section 3: Accessibility (WCAG 2.1 AA)

Accessibility issues are functional bugs, not polish.

### Checklist

- [ ] **Semantic HTML:** Use `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`, `<aside>` instead of `<div>` where appropriate.
- [ ] **Heading hierarchy:** Headings follow a logical hierarchy (h1 > h2 > h3). No skipped levels (h2 to h4).
- [ ] **Keyboard navigation:** All interactive elements are keyboard accessible. Tab order follows visual order. Enter activates buttons, links. Space activates checkboxes, buttons.
- [ ] **Focus visible:** All interactive elements have visible `focus-visible` styling. No `outline-none` without a replacement focus ring.
- [ ] **Form labels:** Every input has a `<label>` with `htmlFor` matching the input `id`. Or `aria-label` if label is visually hidden.
- [ ] **Input types:** Use correct `type` (email, password, number, search, url). Set `autoComplete`, `inputMode`, `spellCheck` appropriately.
- [ ] **Alt text:** All non-decorative images have `alt` text. Decorative images use `alt=""` or `aria-hidden="true"`.
- [ ] **Color contrast:** Text contrast is at least 4.5:1 (normal text) or 3:1 (large text). Verify against both dark and light themes.
- [ ] **ARIA minimal:** Do not use ARIA when semantic HTML suffices. First rule of ARIA: do not use ARIA.
- [ ] **Reduced motion:** Animations respect `@media (prefers-reduced-motion: reduce)`. Glassmorphism falls back to solid surface.
- [ ] **Screen reader announcements:** Loading states use `aria-busy` or `role="status"`. Error messages are associated with their fields.

### Verification

Run keyboard-only navigation on every new page. Tab through all elements. Confirm every interactive element is reachable and operable without a mouse.

---

## Section 4: CSS And Styling

### Checklist

- [ ] **Design tokens:** No hardcoded colors, font sizes, spacing, or z-indices. All values come from CSS variables or Tailwind tokens.
- [ ] **No style overrides:** No `!important` unless documented as a necessary exception. No overriding component library internals.
- [ ] **Theme variables:** Dark and light theme variables are defined for every new color, surface, and glass surface.
- [ ] **Glassmorphism rules:** Glass surfaces follow the plan: max 3 per view, 12px blur, `contain: layout style paint`, `@supports` fallback, `prefers-reduced-motion` fallback.
- [ ] **Responsive:** All new pages are tested at 375px, 768px, 1024px, and 1440px. No horizontal scroll at any breakpoint.
- [ ] **No `transition-all`:** Use specific transition properties (`transition-colors`, `transition-opacity`, `transition-transform`). `transition-all` causes unnecessary repaints.
- [ ] **RTL support:** Use logical properties (`margin-inline-start`, `padding-inline-end`) where possible, not physical (`margin-left`).

### Verification

Toggle dark/light theme on every new page. Confirm no flash, no broken colors, no unreadable text. Check browser console for CSS warnings.

---

## Section 5: React And TypeScript Quality

### Checklist

- [ ] **No `any`:** All types are explicit. No `any` type. Use `unknown` and narrow if needed.
- [ ] **Component single responsibility:** Each component does one thing. If a component exceeds 200 lines, consider splitting.
- [ ] **File size:** No file exceeds 1000 lines. Split into smaller modules.
- [ ] **Effect cleanup:** Every `useEffect` with a subscription, timer, or event listener has a cleanup function.
- [ ] **No stale closures:** `useEffect` dependency arrays are complete. No missing dependencies that capture stale state.
- [ ] **No direct state mutation:** State updates use immutable patterns. No direct mutation of state objects.
- [ ] **Key props:** List items have stable, unique `key` props. No array index as key for dynamic lists.
- [ ] **No `dangerouslySetInnerHTML`:** Unless explicitly required and sanitized. Flag for review.
- [ ] **Error boundaries:** Route-level components are wrapped in error boundaries. No unhandled render crashes.
- [ ] **Memoization:** Expensive computations use `useMemo`. Expensive components use `React.memo` when re-renders are costly.
- [ ] **Import order:** Imports are organized: React, third-party, internal aliases, relative. Consistent across all files.

### Verification

Run `tsc --noEmit`. Zero errors. Run ESLint. Zero warnings (or documented exceptions).

---

## Section 6: Performance

### Checklist

- [ ] **No unnecessary re-renders:** Components do not re-render when parent state changes do not affect them. Verify with React DevTools profiler.
- [ ] **Image optimization:** Images use `loading="lazy"` for below-the-fold. Width and height attributes set to prevent layout shift.
- [ ] **Bundle size:** No new dependency adds more than 50KB gzipped without justification. Check bundle with `vite build` output.
- [ ] **CSS patterns over images:** Background patterns are CSS-generated, not image files. Zero HTTP requests for backgrounds.
- [ ] **Glass surface count:** No more than 3 glass surfaces per view. Verify by counting `backdrop-filter` instances in the rendered DOM.
- [ ] **No layout thrashing:** No forced synchronous layout in scroll handlers or animation frames. Use `transform` and `opacity` for animations, not `top`/`left`/`width`/`height`.
- [ ] **Code splitting:** Route-level components are lazy-loaded with `React.lazy` and `Suspense`.

### Verification

Run `vite build`. Check bundle size. Open browser preview. Run Performance tab in DevTools. Record a 10-second scroll interaction. No long tasks over 50ms.

---

## Section 7: Self Review

### Checklist

- [ ] **Read all code:** Read every file changed in this phase. Look at it with fresh eyes. What would a reviewer find?
- [ ] **Browser console:** No new errors or warnings in the browser console on any new page.
- [ ] **Screenshot every page:** Take screenshots at 375px and 1440px for every new page. Confirm visual quality.
- [ ] **Click every button:** Click every button on every new page. Confirm each one does what the plan says it should do.
- [ ] **Check against plan:** Compare the built page against the frontend plan. Are all listed buttons present? Are all routes correct? Are all modals wired?
- [ ] **No leftover placeholders:** No `{{PLACEHOLDER}}` text visible in the UI (except the 5 documented branding placeholders). No `TODO` comments in shipped code.
- [ ] **No emojis:** No emoji characters anywhere in the UI. All icons are Lucide. All brand logos are SVG from svgl.app.

### Verification

This is the final gate. If any item fails, go back and fix before declaring the phase complete.

---

## Section 8: Route And Backend Cross-Verification

Every button, link, and form must connect to a real route and a real backend endpoint. No orphan routes, no dead endpoints, no mismatched names.

### Checklist

- [ ] **Route existence:** Every `href` in `<Link>` and `<a>` points to a route that exists in the `app/` directory. List all `href` values and verify each has a corresponding `page.tsx` or route handler.
- [ ] **Route naming:** Route names follow the project convention (kebab-case, no trailing slashes unless root). No typos in route paths. Cross-check `href` strings against actual folder names in `app/`.
- [ ] **Button-to-route mapping:** For each button on every page, document: button label → target route → expected backend action. Verify the route exists and the backend action (API endpoint, server action, or Supabase call) is wired or has a documented stub.
- [ ] **Form actions:** Every `<form>` has an `onSubmit` or `action` handler. The handler calls a real function (not empty). If the backend is not yet implemented, the handler must show a loading state and have a documented TODO with a clear plan — no silent no-ops.
- [ ] **API route verification:** If the page calls an API route (`/api/...`), verify the route handler file exists in `app/api/`. Check the HTTP method matches (GET vs POST). Check request/response types align.
- [ ] **Auth guard consistency:** Protected routes (e.g., `/dashboard`, `/profile`, `/billing`) are listed in `middleware.ts` matcher. Public routes (e.g., `/login`, `/signup`) are excluded. No protected route is accessible without auth. No public route is accidentally protected.
- [ ] **OAuth redirect URLs:** OAuth provider redirect URLs match the callback route (`/auth/callback`). The callback route exists and handles the code exchange.
- [ ] **Navigation consistency:** Footer links, nav links, and CTA buttons all point to existing routes. No link goes to a 404. Verify by hitting each URL with `curl` or `Invoke-WebRequest` and checking for 200 status.
- [ ] **Cross-page navigation flow:** Walk through every user journey (e.g., landing → signup → verify-email → login → dashboard). Confirm each step's link leads to the correct next page. No broken transitions.
- [ ] **Backend stub documentation:** Any button or form that triggers a backend action not yet implemented must have a clear inline comment (`// TODO: wire to Supabase auth`) and the UI must handle the missing backend gracefully (loading state, error message, or redirect — never a silent failure or crash).

### Verification

1. Extract all `href` values from every page and component. Hit each URL with `Invoke-WebRequest` (or `curl`). All must return 200.
2. Extract all `onClick` handlers and `onSubmit` handlers. Read each handler function. Confirm it calls a real function or has a documented stub.
3. List all routes in `app/`. Compare against middleware matcher. Confirm protected vs public split is correct.
4. Walk through each user journey manually in the browser preview. Click every button. Confirm no 404s, no silent failures, no crashes.

---

## Phase Gate Decision

After all 8 sections are reviewed:

- **ALL PASS:** Phase is complete. Advance to the next phase.
- **ANY FAIL:** Fix all failures before advancing. Re-run the failed sections after fixes.
- **BLOCKER:** A layout overlap, a dead button, a console error, an accessibility violation, a 404 route, or a missing backend connection is a blocker. No advancement until resolved.

## Output Format

After each phase review, produce a summary:

```
Phase [N] Code Review Summary
=============================
Section 1 (Layout): PASS / FAIL [details]
Section 2 (Buttons): PASS / FAIL [details]
Section 3 (Accessibility): PASS / FAIL [details]
Section 4 (CSS): PASS / FAIL [details]
Section 5 (React/TS): PASS / FAIL [details]
Section 6 (Performance): PASS / FAIL [details]
Section 7 (Self Review): PASS / FAIL [details]
Section 8 (Routes & Backend): PASS / FAIL [details]

Gate: PASS / FAIL
Next: Phase [N+1] description
```
