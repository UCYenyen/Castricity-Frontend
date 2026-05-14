# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: Next.js version

This project runs Next.js **16.2.6** with React 19 and Turbopack. APIs and conventions may differ from training-data-era Next.js. Before writing routing, caching, server-component, or config code, consult `node_modules/next/dist/docs/` (the version-locked docs shipped with the installed Next.js).

Notable Next 16 specifics in this repo:
- Middleware file is named `src/proxy.ts` (not `middleware.ts`), exporting `proxy(request)` plus a `config.matcher`.

## Commands

Package manager is **pnpm** (lockfile + `pnpm-workspace.yaml` present).

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run built app
- `pnpm lint` — ESLint (`eslint-config-next`)
- `npx tsc --noEmit` — type check (no dedicated script)
- `pnpm db:generate` — regenerate Prisma client (run after editing `prisma/schema.prisma`)
- `pnpm db:push` — sync schema to DB without a migration (dev)
- `pnpm db:migrate` — create + apply a named migration (prod path)

There is no test runner configured.

## Architecture

### App Router with route groups

Routes live under `src/app/`. The `(dashboard)` segment is a **route group** (parentheses → no URL segment) that wraps the dashboard pages with a shared layout in `src/app/(dashboard)/layout.tsx`. The layout mounts the shadcn `SidebarProvider` + `TooltipProvider` and the feature sidebar; pages inside the group render into `SidebarInset`.

The marketing/landing route is `src/app/page.tsx` (separate from the dashboard group). Auth pages live at `src/app/sign-in/` and `src/app/sign-up/`.

### Layered structure

The codebase enforces a strict separation:

- `src/types/` — TypeScript interfaces and types per feature (e.g. `dashboard.ts`, `api.ts`).
- `src/validations/` — Zod schemas mirroring the types; runtime validation lives here, not in components. Schemas validate the **backend response shape**, then the adapter in `lib/api.ts` maps to domain types.
- `src/lib/<feature>/` — pure helpers and domain logic (e.g. `lib/dashboard/data.ts` for region constants and metric helpers, `lib/dashboard/format.ts` for fmt helpers).
- `src/hooks/` — `use-dashboard-data` (orchestrate parallel API calls + abort), `use-tweaks` (UI prefs), `use-live-clock`, `use-element-size`, `use-mobile`. The old `use-live-stream` and the SSE live feature are removed.
- `src/components/ui/` — shadcn primitives (do not edit casually; regenerate via shadcn CLI). Includes `wireframe-dotted-globe.tsx` (d3-canvas globe for the landing hero).
- `src/components/features/<feature>/` — feature components composed from `ui/` primitives plus feature-specific helpers. Each feature directory is self-contained, with chart utilities and a top-level `*-view.tsx` orchestrator that the route page renders. Avoid feature-local CSS files — extend `globals.css` instead so tokens stay in one place.

When adding a feature, follow the same split: types → validations → lib/data → hooks → feature components → page.

### Dashboard feature (`src/components/features/dashboard/`)

`dashboard-view.tsx` is the orchestrator: owns top-level state (history date range, brush, forecast horizon, explainer point, tweaks) and composes `DashboardTopbar`, `HeroMetrics`, `AnomalyStrip`, `ValidationCard`, `Explainer`. `ForecastCard` is intentionally commented out — multi-horizon forecast moved to the `/forecast` route (`ForecastView` + `MultiHorizonChart`). The sidebar is mounted by the layout, not by the view.

Charts are hand-rolled SVG (`validation-chart.tsx`, `forecast/multi-horizon-chart.tsx`, `anomaly-center/anomaly-chart.tsx`) with shared scale helpers in `dashboard/chart-utils.ts` and sizing via `useElementSize`. They are not Recharts despite Recharts being in `dependencies`.

A reusable date range picker lives in `dashboard/date-range-picker.tsx` (shadcn Calendar `mode="range"` + Popover) — used by the validation card to filter the window.

### Forecast feature (`src/components/features/forecast/`)

`forecast-view.tsx` is the orchestrator for `/forecast`: horizon presets (7/30/90/180/365/730) + custom day count, single-date start picker (defaults to today), confidence-band toggle, and the `WhatIfPanel` below. Clicking a day on `MultiHorizonChart` pre-fills the what-if target date.

### Anomaly Center (`src/components/features/anomaly-center/`)

`anomaly-center-view.tsx` orchestrates summary tiles, severity filter, paginated table (10/page), and a detail Dialog with SHAP-style factor bars. Reuses `useDashboardData`.

### Authentication & persistence

**Auth:** Better Auth (`src/lib/auth.ts`) configured with `prismaAdapter` + `emailAndPassword`. Browser client at `src/lib/auth-client.ts` exposes `signIn`, `signUp`, `signOut`, `useSession`. The catch-all handler in `src/app/api/auth/[...all]/route.ts` mounts every Better Auth endpoint at `/api/auth/*`.

**DB:** PostgreSQL via Prisma. Singleton client at `src/lib/prisma.ts` (HMR-safe; uses `@prisma/adapter-pg` + `@prisma/extension-accelerate`). Schema at `prisma/schema.prisma` has the four Better Auth models: `user`, `session`, `account`, `verification`. After editing the schema → `pnpm db:generate` then `pnpm db:push`.

**Route protection:** `src/proxy.ts` (Next 16 middleware naming) checks the `better-auth.session_token` cookie and redirects to `/sign-in?redirect=<original>` when absent. Protected prefixes: `/dashboard`, `/predict`. Already-authed users hitting `/sign-in` etc. are bounced to `/dashboard`. The cookie check is **presence-only** — pages that need the actual user object must call `auth.api.getSession({ headers: await headers() })` server-side.

### Backend integration (server-side proxy)

Frontend never calls FastAPI directly from the browser. Every API call goes through a **server-side proxy**:

```
Browser → /api/{metrics, forecast/*, anomalies, features/*}  (Next route handlers)
       → BACKEND_URL                                          (FastAPI :8000)
```

Helper at `src/lib/backend-proxy.ts`. Each Next route handler is a thin pass-through that forwards the query string. **Important:** `BACKEND_URL` already includes the `/api` prefix (e.g. `http://localhost:8000/api`), so handlers call `proxyToBackend("/metrics?...")` — *not* `/api/metrics`, which would double-prefix.

Adapter layer in `src/lib/api.ts` maps backend response shape (e.g. `{date, predicted, lower_bound, upper_bound}`) to the internal domain (`{t, predicted, p10, p90}`). Zod schemas in `src/validations/api.ts` validate the **backend** shape, not the internal one. When the backend changes a field name, update Zod + mapper in one place; UI consumers don't change.

Metric tiles always source `/api/metrics?split=test` — never recompute from a sliced history window. Test-set MAPE is a fixed model-quality stat that only changes after retraining, not when the user moves the brush.

### Environment

Required in `.env`:
- `BACKEND_URL` — server-only FastAPI base (e.g. `http://localhost:8000/api`)
- `NEXT_PUBLIC_API_URL='/api'` — same-origin path used by the client-side fetcher
- `DATABASE_URL` — Postgres connection string for Prisma
- `BETTER_AUTH_SECRET` — server secret (`openssl rand -base64 32`)
- `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` — base URL Better Auth issues cookies and redirects against

### Theming

A single dark "control-room" palette is defined as the app-wide default in `src/app/globals.css`. All shadcn tokens (`--background`, `--card`, `--primary`, `--sidebar-*`, etc.) plus custom tokens (`--accent-cyan`, `--accent-green`, `--accent-orange`, `--accent-red`, `--accent-purple`, `--text-secondary`, `--text-muted`, `--text-faint`) are declared on `:root` and exposed as Tailwind utilities through the `@theme inline` block — so prefer `text-accent-cyan`, `bg-accent-red/15`, `text-text-muted` over inline hex values. The body element draws the grid + scanline + radial-gradient background; nothing should reapply that wrapper.

The `.mono`, `.pulse-dot`, and `.pulse-dot-red` helpers also live in `globals.css` (`@layer components`).

### Path aliases

`@/*` → `src/*` (see `tsconfig.json` and `components.json`). Use `@/components/ui/...`, `@/components/features/...`, `@/hooks/...`, `@/lib/...`, `@/types/...`, `@/validations/...`.

## Code style

- React Compiler is enabled (`babel-plugin-react-compiler`); avoid manual `useMemo`/`useCallback` micro-optimizations unless profiling shows a need.
- `"use client"` is required at the top of any file using hooks, browser APIs, or event handlers — most feature components are client components.
- Tailwind v4 with `tw-animate-css` imported in `globals.css`. Prefer Tailwind utilities; arbitrary CSS-var classes use Tailwind v4 syntax `text-(--my-var)` rather than `text-[var(--my-var)]`.

## Conventions across features

- New features follow: types → validations → lib/data → hooks → feature components → page. See `anomaly-center/`, `forecast/` as references.
- Each `*-view.tsx` is the container; sibling components in the same folder are dumb presenters. State and fetching stay in the view.
- Backend response shape may drift; don't leak it into the UI — adapt in `lib/api.ts` and update the Zod schema in the same change.
- Anything stateful that crosses the server/client boundary (random IDs, dates, locale formatting) must be initialized in `useEffect` or it will hydration-mismatch. The landing hero particles are a worked example.
