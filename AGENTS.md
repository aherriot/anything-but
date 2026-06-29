# AGENTS.md

Guidance for AI agents and contributors working in this repo. Keep changes
consistent with the conventions below.

## What this is

**Anything, but…** is a real-time collaborative restaurant picker. Instead of
asking a group where they want to eat, everyone vetoes options (by restaurant or
cuisine) until one remains. Built on Next.js (App Router) + React, with InstantDB
for real-time sync and Google Places for restaurant data.

## Stack

- **Next.js 16** (App Router) + **React 19**, **TypeScript** in `strict` mode
- **InstantDB** for real-time data (`@instantdb/react` client, `@instantdb/admin` server)
- **Google Places API (New)** for autocomplete, geocoding, details, photos
- **Tailwind CSS 4** + **class-variance-authority (CVA)** for styling
- **Headless UI** for accessible Combobox/Dialog/Listbox primitives
- **Jest** + **React Testing Library** (unit), **Playwright** (e2e)
- Node **22** (see `.node-version`); hosted on **Vercel**

## Commands

| Command | Use |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest unit tests |
| `npm run test:coverage` | Jest with coverage report |
| `npm run test:e2e` | Playwright e2e |

Before committing, expect `lint` + `typecheck` to run via the Husky pre-commit
hook. Keep both green; CI (`.github/workflows/ci.yml`) also runs lint, typecheck,
test, build, and the e2e job.

## Project layout

```
src/
  app/                      App Router routes
    page.tsx                Landing page
    start/                  Name + location setup flow
    groups/[groupId]/       Collaborative voting UI
    api/                    Route handlers (server-only)
      places/*              Google Places proxies
      groups/[id]/prefetch  Warms a group's restaurant list
      cron/cleanup          Vercel cron — deletes old groups
    error.tsx               Route-tree error boundary
    global-error.tsx        Root-layout error boundary
  components/               Reusable UI (Button, Input, ErrorState, …)
  hooks/                    Custom hooks (useLocationSearch)
  utils/                    db clients, constants, pure logic (voting, places)
  lib/                      Low-level helpers (cn)
  instant.schema.ts         InstantDB schema (typed)
  instant.perms.ts          InstantDB permissions
  types.ts                  Shared domain types
```

## Conventions

### TypeScript & imports
- `strict` mode; avoid `any`. Prefer precise domain types from `src/types.ts`.
- Import via the `@/*` alias (maps to `src/*`), e.g. `import db from "@/utils/db"`.
  - Exception: `jest.mock()` does **not** honor the alias — use a relative path
    there (Jest still intercepts the aliased import by resolved path).

### Components & styling
- Tailwind utility classes; brand tokens (colors, `heading-*`, `body-*`,
  `text-gradient-*`) live in `src/app/globals.css` and `BRAND_GUIDE.md`.
- Use **CVA** for component variants — see `src/components/Button.tsx` as the
  pattern. Merge classes with `cn` from `src/lib/utils.ts`.
- Reach for **Headless UI** before hand-rolling dropdowns/dialogs (accessibility).
- Dark theme by default (`bg-neutral-900`). Keep new UI consistent.

### Logging
- `console.log` is a **lint error**. Only `console.error` is allowed (enforced by
  ESLint `no-console`). Don't add `console.log`.

### Pure logic
- Extract non-trivial logic out of components/routes into `src/utils/*` pure
  functions and unit-test them. Examples: `src/utils/voting.ts` (vote reduction),
  `src/utils/places.ts` (Google → domain mapping). Prefer this over testing big
  components that are wired directly to InstantDB hooks.

## Data layer (InstantDB)

- **Client**: `src/utils/db.ts` (`@instantdb/react`) — used in client components
  via `db.useQuery` / `db.useAuth` / `db.transact`. Real-time and reactive.
- **Server/admin**: `src/utils/db-admin.ts` (`@instantdb/admin`) — used only in
  API routes for privileged reads/writes.
- Both are env-guarded singletons that **throw at module load** if their env vars
  are missing. Schema and permissions are the source of truth — update
  `instant.schema.ts` / `instant.perms.ts` when the data model changes.

## API route conventions

Route handlers in `src/app/api/**/route.ts`:
- Keep secrets server-side (Google key, Instant admin token). Never expose them
  to the client; proxy through a route instead.
- Validate inputs and return a consistent JSON shape:
  `{ success: boolean, data, error? }` with appropriate status codes
  (400 bad input, 404 not found, 500 server error).
- Wrap external calls in `try/catch`, add `AbortSignal.timeout(...)`, and
  `console.error` failures.
- The API key is read at **module load** (`const KEY = process.env...`) — keep
  this in mind when testing (see below).

## Testing

### Unit (Jest)
- Co-locate tests as `*.test.ts(x)` next to the code.
- **Component/DOM tests** run in the default **jsdom** env with RTL.
- **API route tests** must declare the node env at the top of the file:
  ```ts
  /** @jest-environment node */
  ```
  Because routes capture env vars at import, load them with a fresh import per
  test to toggle config:
  ```ts
  async function loadRoute(key?: string) {
    jest.resetModules();
    if (key === undefined) delete process.env.GOOGLE_PLACES_API_KEY;
    else process.env.GOOGLE_PLACES_API_KEY = key;
    return import("./route");
  }
  ```
  Mock `global.fetch` for Google calls; mock `@/utils/db-admin` (via relative
  path) for InstantDB. See existing route tests for the patterns.
- `collectCoverageFrom` reports across the whole `src` tree so the number is
  honest — don't scope it to only tested files. Pure-type files are excluded.

### E2E (Playwright)
- Specs live in `e2e/*.spec.ts`; config in `playwright.config.ts` (auto-starts
  the dev server). Jest ignores `e2e/`.
- `/start` and `/groups/*` mount the InstantDB client and need a **live backend**
  — they can't render against a placeholder app id. Deterministic e2e is limited
  to the public landing page; the full collaborative-voting flow is scaffolded in
  `e2e/voting.spec.ts` and gated on a seeded test app
  (`E2E_INSTANT_APP_ID` / `E2E_INSTANT_ADMIN_TOKEN`).

## Error handling

The product has one consistent, on-brand error screen: `ErrorState`
(`src/components/ErrorState.tsx`), rendered by both `app/error.tsx`
(route-tree errors) and `app/global-error.tsx` (root-layout errors). Reuse
`ErrorState` for new error UI rather than building bespoke error pages.

## Git & commits

- **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`),
  one logical change per commit, with a clear imperative summary.
- The pre-commit hook runs lint + typecheck; CI must stay green.
- Branch is `main`. The repo was renamed to `anything-but`.

## Environment

Copy `.env.example` to `.env.local` and fill in:
`GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_INSTANT_APP_ID`, `INSTANT_APP_ADMIN_TOKEN`,
`CRON_SECRET` (and optional `PHOTO_CACHE_MAX_BYTES`). `.env.local` is gitignored —
never commit secrets.
