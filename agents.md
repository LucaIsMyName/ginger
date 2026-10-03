# agents.md

> Reusable project instructions for AI agents and developers in a **single-app repository**.
> Keep this file practical, clear, and language-agnostic.

---

## Purpose

Use this document to keep coding decisions consistent across sessions and contributors.

- Define how code should be structured and changed.
- Reduce back-and-forth by documenting defaults.
- Optimize for maintainability, readability, and safe iteration.

---

## Table of Contents

1. [Project Metadata](#project-metadata)
2. [Core Principles](#core-principles)
3. [Definition of Done](#definition-of-done)
4. [Single-App Folder Structure](#single-app-folder-structure)
5. [Project Context AI Should Know](#project-context-ai-should-know)
6. [Coding Standards (Language-Agnostic)](#coding-standards-language-agnostic)
7. [Architecture and Separation of Concerns](#architecture-and-separation-of-concerns)
8. [Dependencies and Tooling](#dependencies-and-tooling)
9. [Error Handling and Observability](#error-handling-and-observability)
10. [Security and Privacy Defaults](#security-and-privacy-defaults)
11. [Testing Strategy](#testing-strategy)
12. [Git and Change Management](#git-and-change-management)
13. [Documentation Requirements](#documentation-requirements)
14. [React App Scaffolding](#react-app-scaffolding)
15. [UI Design Principles](#ui-design-principles)

---

## Project Metadata

- App name: `@lucaismyname/ginger` — headless React audio player primitive
- Primary runtime: Browser (ESM + CJS dual build via Vite lib mode)
- Deployment target: npm registry (`npm publish` from `packages/ginger/`)
- Package manager: NPM (workspaces: `packages/*`, `apps/*`)
- Main data sources: `<audio>` element events, Web Audio API, BroadcastChannel (remote), Chromecast SDK (cast)

### Critical Flows

- User signup/login: N/A (library, no auth)
- Payment/billing: N/A
- Core CRUD flow: `GingerProvider` reducer → `GingerPlayer` `<audio>` sync → subpath hooks (EQ, spatial, crossfade, waveform, transcript, remote, cast)

### Non-Negotiables

- Performance budget: bundle size CI gate enforced in `packages/ginger/scripts/check-bundle-size.mjs`; all subpaths are tree-shakeable via `sideEffects: false`
- Security constraints: no secrets or credentials; audio src URLs are user-supplied; CORS handling delegated to consumer
- Browser/platform support: evergreen browsers with Web Audio API; graceful SSR (no `window` access at module level)

---

## Core Principles

- Prefer simple solutions over clever ones.
- Write code for future maintainers, not just for today.
- Minimize unnecessary complexity and avoid premature abstractions.
- Reuse existing patterns before inventing new ones.
- Make small, reversible changes that are easy to review.

### Decision priorities

When multiple approaches are valid, prioritize in this order:

1. Correctness
2. Security
3. Clarity
4. Developer experience
5. Performance optimization

---

## Definition of Done

A task is done when:

- Requirements are implemented correctly.
- Code follows structure and conventions in this file.
- Relevant tests pass (or test gaps are clearly documented).
- Lint/format/type checks pass where applicable.
- Security/privacy impact is reviewed for sensitive changes.
- Documentation is updated for meaningful behavior changes.

---

## Single-App Folder Structure

Use this as the default structure for non-monorepo projects:

```
/
├── src/                    # Application source code
│   ├── app/                # App bootstrap / main wiring (routing, providers, entry setup)
│   ├── modules/            # Feature modules grouped by business domain
│   │   └── <feature>/      # Feature-local components, logic, tests
│   ├── components/         # Reusable UI/presentation components
│   ├── services/           # External integrations (APIs, storage, third-party services)
│   ├── lib/                # Shared utilities/helpers (pure, reusable)
│   ├── config/             # Runtime config parsing, env mapping, constants
│   ├── styles/             # Global styles/design tokens
│   ├── assets/             # Static assets imported by code
│   └── types/              # Shared type/domain definitions when needed
│
├── tests/                  # Integration/e2e/high-level test suites (if separate from src)
├── scripts/                # Build/release/maintenance scripts
├── public/                 # Static public files
├── docs/                   # Architecture notes, ADRs, runbooks
├── .env.example            # Required environment variables (no secrets)
├── README.md               # Setup, commands, architecture, conventions
└── agents.md               # This file
```

### Folder rules

- Keep feature-specific code inside `src/modules/<feature>/`.
- Keep shared code in shared folders only when used by multiple features.
- Avoid dumping unrelated helpers into one generic file.
- Co-locate tests with code unless there is a clear reason for separate test directories.

---

## Project Context AI Should Know

Before writing code, AI should align with the following:

### Product context

- What problem this app solves.
- Who the primary users are.
- What the critical user flows are (for regression awareness).

### Technical context

- Runtime(s): browser, server, CLI, worker, or mixed.
- Environment stages: local, staging, production.
- Data sources and external dependencies.
- Performance-sensitive paths and known constraints.

### Team context

- Review expectations (small PRs, explicit trade-offs).
- Backward compatibility requirements.
- Stability vs speed priorities for the project.

If any of these are unknown, AI should ask or document assumptions clearly.

---

## Coding Standards (Language-Agnostic)

### Readability and maintainability

- Use clear names that communicate intent.
- Keep functions/classes/modules focused on one responsibility.
- Avoid deep nesting; prefer guard clauses and early returns.
- Remove dead code instead of commenting it out.
- Keep files reasonably scoped; split when a file becomes hard to navigate.

### Reuse and abstraction

- Duplicate once if needed; abstract only after patterns are stable.
- Prefer composition over inheritance where both are possible.
- Keep shared abstractions minimal and purpose-driven.

### Side effects and state

- Isolate side effects at boundaries (I/O, network, filesystem, global state).
- Keep core business logic as pure as possible.
- Make state transitions explicit and predictable.

### Consistency

- Follow existing project naming, layout, and style conventions.
- Do not introduce a second pattern for the same problem without strong reason.

---

## Architecture and Separation of Concerns

- `modules` contain domain behavior and feature workflows.
- `services` handle external communication and integrations.
- `lib` contains generic, framework-agnostic helpers.
- `app` wires things together (composition root), not business logic.

### Suggested module shape

Each feature module should generally include:

- `domain` (core business rules)
- `application` (use cases/workflows)
- `infrastructure` (adapters/services)
- `ui` (if applicable)
- tests close to the layer they validate

Keep this pragmatic: adapt depth to project size.

---

## Dependencies and Tooling

- Use the project's chosen package manager consistently.
- Add dependencies only for concrete, active use cases.
- Prefer well-maintained, widely adopted libraries.
- Avoid dependency overlap (multiple libs solving the same problem).
- Re-evaluate large dependencies before adding them.

### Dependency policy

Before adding a package, check:

1. Is native/platform code sufficient?
2. Is this dependency actively maintained?
3. Is the API stable and well documented?
4. Does it increase bundle/runtime cost significantly?

---

## Error Handling and Observability

- Fail fast on invalid inputs at boundaries.
- Return actionable error messages (for developers and, when applicable, users).
- Never swallow errors silently.
- Use structured logging where available.
- Include contextual metadata in logs (operation, entity id, environment).

### Operational visibility

- Add tracing/logging around critical flows.
- Ensure async/background failures are observable.
- Prefer deterministic error handling over generic catch-all blocks.

---

## Security and Privacy Defaults

- Never hardcode secrets, tokens, or credentials.
- Keep secrets in environment variables or secret managers.
- Validate and sanitize all untrusted input.
- Apply least-privilege principles for data access and integrations.
- Avoid logging sensitive data (PII, credentials, tokens).

### Security checks for changes

For auth, billing, data access, uploads, or external callbacks:

- Explicitly assess security impact.
- Document assumptions and edge cases.
- Add or update tests for permission boundaries.

---

## Testing Strategy

Prefer a balanced test pyramid:

- Unit tests for isolated logic.
- Integration tests for module/service interaction.
- End-to-end tests for critical user workflows.

### Testing rules

- Test behavior, not implementation details.
- Add regression tests for bug fixes.
- Keep tests deterministic and independent.
- Avoid brittle snapshot-heavy test suites without purpose.

When changing code, update affected tests in the same PR.

---

## Git and Change Management

- Keep commits focused and atomic.
- Keep pull requests small enough for efficient review.
- Do not mix refactors with feature work unless necessary.
- Document high-risk changes and rollout concerns.
- Prefer reversible migrations and incremental rollout paths.

### AI change behavior

When implementing changes, AI should:

1. Inspect existing patterns first.
2. State assumptions when requirements are unclear.
3. Make minimal safe changes.
4. Verify with tests/lint/checks where available.
5. Summarize impact, risks, and follow-up actions.

---

## Documentation Requirements

Update documentation whenever behavior or workflow changes.

- `README.md`: setup, run commands, architecture overview.
- `docs/`: deeper design notes, runbooks, ADRs.
- `agents.md`: update conventions when team standards evolve.

### Documentation quality

- Write for someone new to the project.
- Prefer concrete examples over vague statements.
- Keep command examples copy-paste ready.

---

## React App Scaffolding

Scaffold in this order. All tools are required unless marked optional.

### Setup

```bash
npm create vite@latest my-app -- --template react-ts
npm install -D tailwindcss @tailwindcss/vite
npm install clsx tailwind-merge
npm install react-router
npx shadcn@latest init
```

### Vite + TypeScript

- Use `@/` as a path alias mapped to `src/` in both `vite.config.ts` and `tsconfig.json`.
- `tsconfig.json` must have `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`.
- Never use `any`. Use `unknown` and narrow it explicitly.
- Avoid non-null assertions (`!`) — use optional chaining or guards.

### Tailwind

- Import via `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css`.
- Always compose classes with `cn()` from `@/lib/utils` (clsx + tailwind-merge).
- Never use inline `style={{}}` for values that Tailwind covers.
- Design mobile-first: base classes for mobile, `sm:` / `md:` / `lg:` for larger screens.

### ShadCN + Base-UI

- `components.json` lives in the project root — never inside `src/`.
- Add components with `npx shadcn@latest add <name>`. Generated files land in `src/components/ui/`.
- Never recreate what ShadCN already provides.
- Use Base-UI (`npm install @base-ui-components/react`) only for unstyled primitives ShadCN doesn't cover.

### React Router

- Define all routes in `src/app/router.tsx` using `createBrowserRouter`.
- Use layout routes with `<Outlet />` — never nest `<Route>` components ad-hoc across the tree.
- Use URL/search params for filters and pagination before reaching for global state.
- Lazy-load heavy pages: `React.lazy(() => import("@/modules/..."))`.

### TanStack Query *(optional — add when async server data is needed)*

```bash
npm install @tanstack/react-query
```

- Wrap the app in `<QueryClientProvider>` in `src/main.tsx`.
- `queryKey` must always be a descriptive array, never a plain string.
- Never use `useEffect` + `useState` for remote data — use `useQuery`.
- Use `useMutation` for writes; invalidate related queries in `onSuccess`.

### TanStack Virtual *(optional — add for lists with 100+ items)*

```bash
npm install @tanstack/react-virtual
```

- Use `useVirtualizer`. The scroll container must have a fixed height and `overflow: auto`.
- Do not add preemptively.

### TanStack Table *(optional — add for sortable/filterable/paginated tables)*

```bash
npm install @tanstack/react-table
```

- Define `columns` outside the component to avoid re-creation on every render.
- Only add row models you actually use (`getSortedRowModel`, `getPaginationRowModel`, etc.).

### React Helmet Async *(optional — add only for public SEO pages)*

```bash
npm install react-helmet-async
```

- Wrap the app in `<HelmetProvider>` above `<RouterProvider>`.
- Every public page needs a `<title>` and `<meta name="description">`.
- Skip for internal tools, dashboards, or apps not indexed by search engines.

### Provider order in `src/main.tsx`

```
StrictMode > HelmetProvider > QueryClientProvider > RouterProvider
```

---

## UI Design Principles

Good UI reduces cognitive load and makes the next action obvious. Apply these to every screen.

### Hierarchy
- Every screen has one primary action — make it the most prominent element.
- Use size, weight, and contrast to rank content importance, not color alone.

### Spacing
- Use the spacing scale consistently (4, 8, 12, 16, 24, 32, 48px). Tailwind's scale covers this.
- More space between unrelated sections, less between related items.
- White space is not wasted space — it creates clarity.

### Color
- One primary action color. One neutral scale. Semantic colors for state (green = success, red = error, amber = warning).
- Never rely on color alone to convey meaning — pair with text or icons.
- Body text contrast must be ≥ 4.5:1.

### Typography
- Max 2–3 font sizes per screen.
- Body text: 14–16px. Minimum readable: 12px.
- Line length: 55–80 characters for readable body copy.

### Feedback and state
- Every async action needs a visible loading state (spinner, disabled button, skeleton).
- Errors appear inline near the problem — not only as a toast.
- Empty states explain why and suggest a next action.
- Destructive actions require confirmation before executing.

### Mobile-first
- Base layout at 375px wide. Scale up with `sm:` / `md:` / `lg:`.
- Tap targets minimum 44×44px.
- No hover-only interactions — they don't exist on touch.

### Consistency
- All buttons, inputs, and spacing patterns look and behave the same across the app.
- Before adding a new pattern, check if one already exists.

### Reduce friction
- Remove fields that aren't required. Pre-fill what can be inferred.
- One clear primary action per screen.
- If something needs a lot of explanation, simplify the design.

---
