# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: Next.js version

This project runs Next.js **16.2.6** with React 19 and Turbopack. APIs and conventions may differ from training-data-era Next.js. Before writing routing, caching, server-component, or config code, consult `node_modules/next/dist/docs/` (the version-locked docs shipped with the installed Next.js).

## Commands

Package manager is **pnpm** (lockfile + `pnpm-workspace.yaml` present).

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run built app
- `pnpm lint` — ESLint (`eslint-config-next`)
- `npx tsc --noEmit` — type check (no dedicated script)

There is no test runner configured.

## Architecture

### App Router with route groups

Routes live under `src/app/`. The `(dashboard)` segment is a **route group** (parentheses → no URL segment) that wraps the dashboard pages with a shared layout in `src/app/(dashboard)/layout.tsx`. The layout mounts the shadcn `SidebarProvider` + `TooltipProvider` and the feature sidebar; pages inside the group render into `SidebarInset`.

The marketing/landing route is `src/app/page.tsx` (separate from the dashboard group).

### Layered structure

The codebase enforces a strict separation:

- `src/types/` — TypeScript interfaces and types per feature (e.g. `dashboard.ts`).
- `src/validations/` — Zod schemas mirroring the types; runtime validation lives here, not in components.
- `src/lib/<feature>/` — pure helpers and domain logic (e.g. `lib/dashboard/data.ts` synthesizes the demand series, computes metrics, holds region constants).
- `src/hooks/` — reusable React hooks (`use-dashboard-series`, `use-tweaks`, `use-live-clock`, `use-element-size`, `use-mobile`).
- `src/components/ui/` — shadcn primitives (do not edit casually; regenerate via shadcn CLI).
- `src/components/features/<feature>/` — feature components composed from `ui/` primitives plus feature-specific helpers. Each feature directory is self-contained, with chart utilities and a top-level `*-view.tsx` orchestrator that the route page renders. Avoid feature-local CSS files — extend `globals.css` instead so tokens stay in one place.

When adding a feature, follow the same split: types → validations → lib/data → hooks → feature components → page.

### Dashboard feature (`src/components/features/dashboard/`)

`dashboard-view.tsx` is the orchestrator: owns top-level state (region, history window, forecast horizon, brush, explainer point, tweaks) and composes `DashboardTopbar`, `HeroMetrics`, `AnomalyStrip`, `ValidationCard`, `ForecastCard`, `Explainer`. The sidebar is mounted by the layout, not by the view.

Charts (`validation-chart.tsx`, `forecast-chart.tsx`) are hand-rolled SVG with shared scale helpers in `chart-utils.ts` and sizing via `useElementSize`. They are not Recharts despite Recharts being in `dependencies`.

### Theming

A single dark "control-room" palette is defined as the app-wide default in `src/app/globals.css`. All shadcn tokens (`--background`, `--card`, `--primary`, `--sidebar-*`, etc.) plus custom tokens (`--accent-cyan`, `--accent-green`, `--accent-orange`, `--accent-red`, `--accent-purple`, `--text-secondary`, `--text-muted`, `--text-faint`) are declared on `:root` and exposed as Tailwind utilities through the `@theme inline` block — so prefer `text-accent-cyan`, `bg-accent-red/15`, `text-text-muted` over inline hex values. The body element draws the grid + scanline + radial-gradient background; nothing should reapply that wrapper.

The `.mono`, `.pulse-dot`, and `.pulse-dot-red` helpers also live in `globals.css` (`@layer components`).

### Path aliases

`@/*` → `src/*` (see `tsconfig.json` and `components.json`). Use `@/components/ui/...`, `@/components/features/...`, `@/hooks/...`, `@/lib/...`, `@/types/...`, `@/validations/...`.

## Code style

- React Compiler is enabled (`babel-plugin-react-compiler`); avoid manual `useMemo`/`useCallback` micro-optimizations unless profiling shows a need.
- `"use client"` is required at the top of any file using hooks, browser APIs, or event handlers — most feature components are client components.
- Tailwind v4 with `tw-animate-css` and `shadcn/tailwind.css` imported in `globals.css`. Prefer Tailwind utilities; arbitrary CSS-var classes use Tailwind v4 syntax `text-(--my-var)` rather than `text-[var(--my-var)]`.
