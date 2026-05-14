# Castricity — Use Case Specifications (Detailed)

Format per use case: Goal, Primary actor, Secondary actors, Preconditions, Postcondition, Main flow, Alternate flows.

---

## UC-AUTH-1 — Sign Up

**Goal:** Create a new operator account so the user can access the protected dashboard.
**Primary actor:** New User (prospective Operator)
**Secondary actors:** Better Auth service, Prisma ORM, PostgreSQL, Browser cookie store
**Preconditions:**
- App is reachable and `/sign-up` route is rendered
- `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` env vars are set
- Postgres has `user`, `account`, `session` tables (migrated)
- Email is not already registered

**Postcondition:** A `user` row, an `account` row (with hashed password), and an active `session` row exist; a `better-auth.session_token` cookie is set on the browser; user is redirected to `/dashboard`.

**Main flow:**
1. User navigates to `/sign-up`.
2. `sign-up/page.tsx` renders the form (name, email, password).
3. User submits valid credentials.
4. Component calls `authClient.signUp.email({ name, email, password })` from `src/lib/auth-client.ts`.
5. Client POSTs `/api/auth/sign-up/email`.
6. Catch-all handler `src/app/api/auth/[...all]/route.ts` forwards the request to `auth.handler`.
7. Better Auth validates payload, hashes the password, and via `prismaAdapter` creates a `user` row.
8. `prismaAdapter` creates an `account` row linking the user to the email-password provider with the hash.
9. Better Auth creates a `session` row and emits a `Set-Cookie: better-auth.session_token=...` header.
10. Response 200 returns to the browser; cookie is stored.
11. `auth-client` resolves; the form calls `router.push("/dashboard")`.
12. `src/proxy.ts` sees the cookie and lets the navigation through.

**Alternate flows:**
- **A1 — Email already taken:** Better Auth returns 4xx with error message. Form displays "Email already registered." User edits or switches to Sign In.
- **A2 — Weak password / invalid email:** Client-side Zod validation rejects before submit; field-level error shown.
- **A3 — DB unreachable:** Prisma throws; handler returns 500. Form shows generic "Sign up failed, try again."
- **A4 — Cookie blocked (3rd-party / Safari ITP):** Subsequent middleware check fails; user is redirected to `/sign-in?redirect=/dashboard` even though account exists.

---

## UC-AUTH-2 — Sign In

**Goal:** Authenticate an existing user and start a session.
**Primary actor:** Returning User
**Secondary actors:** Better Auth, Prisma, Postgres
**Preconditions:**
- User has an existing `account` row (signed up previously)
- `/sign-in` route accessible
- No valid session cookie (or expired)

**Postcondition:** New `session` row; valid `better-auth.session_token` cookie; user lands on `/dashboard` (or the `redirect` query target).

**Main flow:**
1. User opens `/sign-in?redirect=/dashboard` (redirect query optional).
2. `sign-in/page.tsx` renders the form.
3. User submits email + password.
4. Component calls `authClient.signIn.email({ email, password })`.
5. POST `/api/auth/sign-in/email` hits the catch-all handler.
6. Better Auth looks up the `account` via Prisma, verifies the hashed password.
7. Creates a `session` row and sets the cookie.
8. Response 200; client resolves.
9. Form reads `redirect` from URL (defaults to `/dashboard`) and calls `router.push(redirect)`.
10. Proxy middleware allows it through.

**Alternate flows:**
- **A1 — Wrong password:** Better Auth returns 401. Form shows "Invalid credentials."
- **A2 — Unknown email:** Same 401 (no user enumeration). Same message.
- **A3 — Account locked / disabled:** (Future) Returns 403; form shows status message.
- **A4 — Already authenticated:** Middleware bounces hits on `/sign-in` to `/dashboard` before the form renders.

---

## UC-AUTH-3 — Sign Out

**Goal:** End the current session and return to the public landing.
**Primary actor:** Authenticated User
**Secondary actors:** Better Auth, Prisma, Browser cookie store
**Preconditions:**
- User is signed in (valid cookie + `session` row)
- Sidebar is rendered (i.e., user is inside the `(dashboard)` route group)

**Postcondition:** Session row invalidated; cookie cleared; user lands on `/sign-in`; `useSession` consumers re-render to the unauthenticated state.

**Main flow:**
1. User clicks "Keluar" in `DashboardSidebar`.
2. Handler calls `authClient.signOut()` from `auth-client.ts`.
3. Client POSTs `/api/auth/sign-out`.
4. Better Auth invalidates the session row and emits a `Set-Cookie` that clears the token.
5. Promise resolves on the client.
6. Sidebar calls `router.push("/sign-in")` then `router.refresh()` to drop cached server-component state.
7. Any active `useSession` subscribers receive `null` and re-render (e.g., landing Navbar switches buttons).

**Alternate flows:**
- **A1 — Network failure:** `signOut()` rejects. Show toast "Logout failed, try again." Session remains valid.
- **A2 — Stale tab after logout in another tab:** Next protected action 401s; user is bounced to `/sign-in` by the middleware on the next navigation.

---

## UC-AUTH-4 — Resolve Session (`useSession`)

**Goal:** Let any component conditionally render based on whether a user is signed in, without prop-drilling.
**Primary actor:** Any React component (Navbar, Sidebar, gated CTAs)
**Secondary actors:** Better Auth client cache, `/api/auth/get-session` endpoint
**Preconditions:**
- Component is a client component (`"use client"`)
- `auth-client.ts` is configured with the correct base URL

**Postcondition:** Component renders the correct branch (loading / signed-in / signed-out) and stays in sync with future auth changes (sign-in/out in another tab via cookie change).

**Main flow:**
1. Component calls `const { data, isPending } = useSession()`.
2. Hook checks its in-memory cache; on first call, fires `GET /api/auth/get-session`.
3. Handler reads the cookie, validates the session in DB, returns `{ user, session }` or `null`.
4. Hook stores the result; subscribers re-render.
5. Component reads `isPending` → render skeleton; `data` → render authed UI; `!data` → render unauthed UI.
6. Hook re-validates on focus / interval (Better Auth default) and pushes updates to subscribers.

**Alternate flows:**
- **A1 — Endpoint 401:** `data === null`. Component renders the unauthed branch.
- **A2 — Network error:** `data === undefined`, `error` set. Component keeps last-known data or skeleton; non-critical UI.
- **A3 — SSR boundary:** Hook returns `{ data: undefined, isPending: true }` on first server render; client hydrates with the real value (acceptable; not a hydration mismatch because both render the skeleton).

---

## UC-AUTH-5 — Route Protection (Middleware)

**Goal:** Prevent unauthenticated users from reaching protected pages and bounce authed users away from auth pages.
**Primary actor:** Browser (any navigation event)
**Secondary actors:** Next.js Edge runtime, `src/proxy.ts`
**Preconditions:**
- `proxy.ts` is registered with a `config.matcher` that covers `/dashboard/*`, `/predict/*`, `/sign-in`, `/sign-up`
- Better Auth cookie name is `better-auth.session_token`

**Postcondition:** Request either continues (`NextResponse.next()`) or is rewritten to the correct destination (`/sign-in?redirect=...` or `/dashboard`).

**Main flow:**
1. Browser issues a navigation (e.g., `GET /dashboard`).
2. Edge runtime invokes `proxy(request)`.
3. Middleware reads `request.cookies.get("better-auth.session_token")`.
4. If protected prefix and cookie missing → `NextResponse.redirect("/sign-in?redirect=/dashboard")` (307).
5. If auth route and cookie present → `NextResponse.redirect("/dashboard")`.
6. Otherwise → `NextResponse.next()`.
7. Page renders; server components that need the actual user call `auth.api.getSession({ headers })`.

**Alternate flows:**
- **A1 — Expired session, cookie still present:** Middleware lets request through (cookie check is presence-only). The server component's `getSession` returns `null` → page handles it explicitly (e.g., re-redirect or empty state).
- **A2 — User has stale cookie name (after auth rotation):** Treated as missing; redirected to sign-in.
- **A3 — Public asset under protected prefix:** Matcher excludes `_next/static`, images, etc.

---

## UC-LAND-1 — View Hero (Rotating Globe)

**Goal:** Show a visually-engaging globe centered on Indonesia to communicate the product's grid-monitoring scope to first-time visitors.
**Primary actor:** Visitor (anonymous)
**Secondary actors:** Natural Earth GeoJSON CDN, d3-geo, browser canvas
**Preconditions:**
- `/` page renders, `Hero` mounts `RotatingEarth`
- Browser supports Canvas 2D
- Network can reach the GeoJSON URLs

**Postcondition:** A dotted globe is drawn on the hero canvas, centered on Indonesia; user can drag to rotate; releasing drag animates back to the home rotation.

**Main flow:**
1. Visitor opens `/`.
2. `src/app/page.tsx` renders `Hero`, which mounts `RotatingEarth` (a `<canvas>` wrapper).
3. `useEffect` initializes the d3 orthographic projection sized to the canvas via `useElementSize`.
4. Component `fetch`es `ne_110m_land.json` and `ne_110m_admin_0_countries.json` in parallel.
5. On load, the component generates dot samples within land polygons (point-in-polygon).
6. d3 path renders the dotted globe once (no auto-rotate by default).
7. Mouse listeners are attached: `mousedown` records start; `mousemove` updates rotation; `mouseup` triggers a tweened return (`d3.timer`, ease-out cubic) to the HOME rotation centered on Indonesia.

**Alternate flows:**
- **A1 — GeoJSON fetch fails:** Component renders a fallback solid-fill globe outline (or an empty canvas). Page still usable.
- **A2 — Touch device:** `touchstart/move/end` handlers mirror mouse events; rotation feels identical.
- **A3 — Reduced-motion preference:** Skip the tween; snap directly to HOME.
- **A4 — Canvas resized (window resize):** `useElementSize` triggers re-projection; dots are re-sampled.

---

## UC-LAND-2 — Auth-aware Navbar

**Goal:** Show the right CTA on the marketing nav based on auth state, without flicker.
**Primary actor:** Visitor
**Secondary actors:** `useSession`, Next router
**Preconditions:** Page is `/` (or any public marketing route); Navbar is mounted.

**Postcondition:** Navbar renders one of three states: skeleton (loading), "Go to Dashboard" (authed), or "Sign In" + "Sign Up" (unauthed).

**Main flow:**
1. Navbar component mounts and calls `useSession()`.
2. While `isPending` → render skeleton (avoids flicker between authed/unauthed).
3. When `data` is `{ user, session }` → render a single "Go to Dashboard" button linking `/dashboard`.
4. When `data` is `null` → render "Sign In" (→ `/sign-in`) and "Sign Up" (→ `/sign-up`) buttons.
5. If the visitor signs in/out in another tab, `useSession` updates and the nav re-renders without reload.

**Alternate flows:**
- **A1 — Session check errors:** Render the unauthed state (graceful default).
- **A2 — Visitor opens `/` already authed:** Skeleton flashes briefly, then "Go to Dashboard" appears. Visitor clicks → routed to dashboard.

---

## UC-DASH-1 — Load Dashboard

**Goal:** Hydrate the dashboard with the four data sources it needs (history, forecast, anomalies, metrics) as fast as possible.
**Primary actor:** Operator
**Secondary actors:** `useDashboardData`, Next route handlers, FastAPI backend, `AbortController`
**Preconditions:**
- User passed `UC-AUTH-5` (cookie present)
- `BACKEND_URL` env is correct
- FastAPI is healthy on the four endpoints

**Postcondition:** `DashboardView` has populated `history`, `future`, `anomalies`, `metrics`; HeroMetrics, ValidationCard, AnomalyStrip render real data; no in-flight fetches remain after unmount.

**Main flow:**
1. User navigates to `/dashboard`.
2. `(dashboard)/layout.tsx` wraps the page with `SidebarProvider` + `TooltipProvider` + sidebar.
3. `dashboard/page.tsx` renders `<DashboardView />`.
4. `DashboardView` calls `useDashboardData({ futureDays })`.
5. Hook creates an `AbortController` and fires 4 fetches in `Promise.all`:
   - `getHistorical()` → `/api/forecast/historical`
   - `getFuture({ days, startDate: today })` → `/api/forecast/future`
   - `getAnomalies()` → `/api/anomalies`
   - `getMetrics({ split: "test" })` → `/api/metrics?split=test`
6. Each Next route handler proxies to `BACKEND_URL/...` via `backend-proxy.ts`.
7. FastAPI responds; Zod schemas in `validations/api.ts` validate the backend shape.
8. Adapter in `lib/api.ts` maps backend shape → internal domain (`{date, predicted}` → `{t, predicted, p10, p90}`).
9. Hook sets state in one batch; `isLoading` flips to `false`.
10. `DashboardView` renders `HeroMetrics` (uses `metrics`), `AnomalyStrip` (uses `anomalies` + `history`), `ValidationCard` (uses `history`).

**Alternate flows:**
- **A1 — One endpoint fails (e.g., anomalies 500):** `Promise.allSettled` semantics; that slice falls back to `[]` and a non-blocking error banner appears. Other tiles render normally.
- **A2 — All endpoints fail:** Hook surfaces an `error`; view renders a retry button (`refresh()`).
- **A3 — User navigates away mid-fetch:** Cleanup function calls `controller.abort()`; no state set on unmounted component.
- **A4 — Backend returns shape that fails Zod:** Adapter throws, surfaced as error; we log raw payload server-side for debugging.

---

## UC-DASH-2 — View Hero Metrics

**Goal:** Give the operator an at-a-glance summary of grid health and model accuracy at the top of the dashboard.
**Primary actor:** Operator
**Secondary actors:** `HeroMetrics`, `MetricTile`
**Preconditions:** `useDashboardData` has resolved with `metrics` and `future`.

**Postcondition:** A row of tiles is visible: peak demand (with 24h sparkline), MAPE, MAE, RMSE, R², bias, hit-rate.

**Main flow:**
1. `DashboardView` passes `history`, `future`, `peak`, and `metrics` to `HeroMetrics`.
2. Component computes `peakHourSpark = future.slice(0, 24).map(p => p.predicted)`.
3. Renders a `MetricTile` for peak demand (cyan accent, sparkline-enabled).
4. Renders `MetricTile`s for MAPE, MAE, RMSE, R², bias, hit-rate (no sparklines — these are static quality stats).
5. Each tile shows label, value, unit, optional delta vs. yesterday.

**Alternate flows:**
- **A1 — `metrics` is null:** Tiles show "—" placeholders; tooltip notes "metrics endpoint unavailable."
- **A2 — `future` empty:** Sparkline omitted; peak tile shows the value only.
- **A3 — MAPE > threshold (e.g., > 15%):** Tile turns amber to nudge investigation (visual only, no action).

---

## UC-DASH-3 — Filter Validation by Date Range

**Goal:** Let the operator inspect model performance over a custom window without affecting global metrics.
**Primary actor:** Operator
**Secondary actors:** `DateRangePicker`, `ValidationCard`, `niceBounds` scale helper
**Preconditions:** History data loaded; `DateRangePicker` rendered above the validation card.

**Postcondition:** `ValidationCard` re-renders with `history` sliced to `[from, to]`; brush resets to `[0, 1]`; metric tiles do NOT change (they remain test-set).

**Main flow:**
1. Operator opens the date range popover.
2. Picks a `from` and `to` date via shadcn Calendar (`mode="range"`).
3. `DateRangePicker.onChange(range)` fires.
4. `DashboardView` runs `setRange(range)` and `setBrush([0, 1])` (reset zoom).
5. A `useMemo` recomputes `filteredHistory = history.filter(p => p.t in range)`.
6. `ValidationCard` receives the filtered slice + the bounds.
7. `niceBounds` recomputes Y-scale; chart re-renders.

**Alternate flows:**
- **A1 — Range outside available history:** `filteredHistory` is empty; chart shows "No data in range."
- **A2 — `from > to`:** Picker normalizes (swaps); single click sets `from`, second click sets `to`.
- **A3 — Operator clears the range:** Returns to full history.

---

## UC-DASH-4 — Inspect Historical Point (Explainer)

**Goal:** When a point looks unusual, let the operator click it and get an explanation of actual vs predicted plus driving factors.
**Primary actor:** Operator
**Secondary actors:** `ValidationChart`, `Explainer`, `pointExplainer` heuristic
**Preconditions:** `ValidationCard` rendered with history data; chart hit-testing is live.

**Postcondition:** `Explainer` displays actual MWh, predicted MWh, delta, and a list of contributing factors for the selected point.

**Main flow:**
1. Operator hovers `ValidationChart`; nearest-point highlight follows the cursor.
2. Operator clicks a point.
3. `ValidationChart.onPointClick(p)` bubbles up.
4. `DashboardView` runs `setExplainPt({ t, actual, predicted, anomalyKey: null })`.
5. `Explainer` mounts/updates with the new point.
6. Explainer first tries `point.data.factors` (server-attached SHAP) → renders directly.
7. Else falls back to `lib/dashboard/data.ts:ANOMALY_DETAILS[anomalyKey]` for hardcoded narratives.
8. Else calls `pointExplainer(point)` to infer factors from hour-of-day, day-of-week, weather, residual.
9. Renders the headline (delta vs predicted), the factor bars, and a short description.

**Alternate flows:**
- **A1 — Point has no SHAP and no key:** Heuristic path used; UI labels it "inferred."
- **A2 — Operator clicks another point quickly:** Latest selection wins; previous Explainer unmounted.
- **A3 — Point is in the future range:** Explainer disabled or shows "Predicted only — no actual yet."

---

## UC-DASH-5 — Refresh Data

**Goal:** Pull fresh data without a full page reload (e.g., after a known backend update).
**Primary actor:** Operator
**Secondary actors:** `DashboardTopbar`, `useDashboardData.refresh`
**Preconditions:** Dashboard already loaded once.

**Postcondition:** All four datasets are re-fetched; spinner indicates progress; existing data stays visible until the new payload arrives (stale-while-revalidate feel).

**Main flow:**
1. Operator clicks the refresh button in `DashboardTopbar`.
2. Topbar calls `refresh()` from the hook.
3. Hook flips `isRefreshing = true` and starts a new `fetchAll(signal, isRefresh=true)`.
4. The spinner replaces the icon on the button.
5. On success, state is replaced atomically; `isRefreshing = false`.

**Alternate flows:**
- **A1 — Refresh while initial fetch still in flight:** Earlier controller is aborted; new fetch supersedes.
- **A2 — Refresh fails:** Toast "Refresh failed"; previous data remains.

---

## UC-FCST-1 — Load Multi-Horizon Forecast

**Goal:** Show the operator predicted demand for the chosen horizon, with confidence bands.
**Primary actor:** Operator
**Secondary actors:** `ForecastView`, `lib/api.getFuture`, FastAPI (Prophet + LightGBM)
**Preconditions:** User on `/forecast`; horizon and start date set in state (defaults: 30 days, today).

**Postcondition:** `MultiHorizonChart` renders the predicted line and (if enabled) the confidence band.

**Main flow:**
1. Operator navigates to `/forecast`.
2. `forecast/page.tsx` renders `ForecastView`.
3. `useEffect` watches `{ horizon, startDate }` and calls `getFuture({ days: horizon, startDate })`.
4. Adapter requests `/api/forecast/future?days=N&start_date=YYYY-MM-DD`.
5. Backend produces Prophet baseline + LightGBM residual; sums for `predicted`; emits `lower_bound`/`upper_bound`.
6. Adapter maps `{date, predicted, lower_bound, upper_bound}` → `{t, predicted, p10, p90}`.
7. Chart renders.

**Alternate flows:**
- **A1 — Horizon too large (e.g., > 730):** UI clamps and shows hint.
- **A2 — Backend returns fewer rows than requested:** Chart renders what's available; subtitle notes partial coverage.
- **A3 — Network error:** Loading skeleton → error message with retry.

---

## UC-FCST-2 — Pick Forecast Start Date

**Goal:** Re-anchor the forecast window to a chosen start date.
**Primary actor:** Operator
**Secondary actors:** shadcn `Calendar`, `ForecastView`
**Preconditions:** Forecast view mounted; start date defaults to today.

**Postcondition:** Forecast re-fetched starting at the chosen date; chart re-rendered.

**Main flow:**
1. Operator clicks the start date control.
2. Calendar popover opens; operator picks a date.
3. `setStartDate(d)` fires.
4. `useEffect` re-runs and re-fetches `getFuture({ days, startDate: d })`.
5. Chart updates.

**Alternate flows:**
- **A1 — Past date chosen:** Allowed; backend returns hindsight predictions if available; otherwise an empty/short series.
- **A2 — Far-future date past model horizon:** Backend caps; UI surfaces the actual range used.

---

## UC-FCST-3 — Change Horizon

**Goal:** Switch between preset planning windows or specify a custom horizon.
**Primary actor:** Operator
**Secondary actors:** `Select` (presets), `Input` (custom), `ForecastView`
**Preconditions:** Forecast view mounted.

**Postcondition:** New horizon applied; forecast re-fetched.

**Main flow:**
1. Operator opens the horizon `Select` and picks 7/30/90/180/365/730 — OR — chooses "Custom" and types a positive integer.
2. `setHorizon(n)` fires.
3. `useEffect` triggers `getFuture({ days: n, startDate })`.
4. Chart re-renders.

**Alternate flows:**
- **A1 — Non-numeric custom input:** Field shows validation error; fetch not triggered.
- **A2 — Zero / negative input:** Same — rejected client-side.

---

## UC-FCST-4 — Toggle Confidence Band

**Goal:** Let the operator declutter the chart when only the central forecast is needed.
**Primary actor:** Operator
**Secondary actors:** `Switch`, `MultiHorizonChart`
**Preconditions:** Forecast loaded; band data (`p10`/`p90`) present.

**Postcondition:** Band path is shown/hidden; nothing else changes.

**Main flow:**
1. Operator toggles the "Confidence band" switch.
2. `setShowBand(b)` fires.
3. Chart receives `showBand={b}` and conditionally renders the band SVG path.

**Alternate flows:**
- **A1 — Band data missing:** Switch is disabled with tooltip "Band unavailable for this horizon."

---

## UC-FCST-5 — Click Day → Lock for What-if

**Goal:** Pre-fill the what-if panel with a date selected directly from the chart.
**Primary actor:** Operator
**Secondary actors:** `MultiHorizonChart`, `WhatIfPanel`
**Preconditions:** Forecast loaded; chart rendered.

**Postcondition:** `WhatIfPanel.selectedDate` reflects the clicked day; operator can now adjust scenario inputs against it.

**Main flow:**
1. Operator hovers a point and clicks.
2. Chart fires `onSelect(point)`.
3. `ForecastView` runs `setSelected(point)`.
4. `WhatIfPanel` re-renders with `selectedDate={point.t}` as a controlled prop.

**Alternate flows:**
- **A1 — Operator clicks the same point twice:** No state change.
- **A2 — Operator changes horizon while a point is locked:** Locked date persists if still within range; otherwise cleared.

---

## UC-FCST-6 — Hover Day → Tooltip

**Goal:** Surface the predicted value (and bounds) on hover.
**Primary actor:** Operator
**Secondary actors:** `MultiHorizonChart`
**Preconditions:** Chart rendered.

**Postcondition:** Tooltip displays date, predicted, p10, p90 near the cursor.

**Main flow:**
1. Operator moves mouse over the chart.
2. Component runs a linear scan to find the nearest point in pixel space.
3. `setHover(nearest)`.
4. A `<foreignObject>` tooltip is positioned next to the cursor.

**Alternate flows:**
- **A1 — Cursor leaves chart:** `setHover(null)`; tooltip hidden.
- **A2 — Touch device:** Tap shows tooltip; second tap clears.

---

## UC-WI-1 — Run What-if Scenario

**Goal:** Estimate demand under a hypothetical weather/holiday scenario and show how each input contributed.
**Primary actor:** Operator (planner)
**Secondary actors:** `WhatIfPanel`, `lib/api.runWhatIf`, FastAPI (Prophet + LightGBM + SHAP TreeExplainer)
**Preconditions:**
- Forecast view loaded
- A target date is selected (manually or via UC-FCST-5)
- SHAP TreeExplainer is available on the backend

**Postcondition:** Three result tiles (predicted MWh, baseline, delta) and a SHAP factor bar chart are displayed.

**Main flow:**
1. Operator enters `avg_temp`, `rainfall`, toggles `is_holiday`, confirms `target_date`.
2. Clicks "Run".
3. `runWhatIf` slices the date to `YYYY-MM-DD` and POSTs `/api/forecast/whatif`.
4. Backend computes Prophet baseline, LightGBM residual, sums them for `predicted_mwh`.
5. SHAP TreeExplainer computes per-feature contributions.
6. Response: `{ predicted_mwh, prophet_baseline, lgbm_residual, base_value, shap_contributions }`.
7. Adapter maps to `{ predicted, baseline, delta, factors[] }`.
8. Panel renders three tiles plus the factor bars (positive right, negative left).

**Alternate flows:**
- **A1 — Inputs out of plausible range:** Client-side Zod validation rejects (e.g., temp > 45°C); error shown.
- **A2 — SHAP unavailable:** Backend returns the prediction without contributions; panel shows tiles only with a note.
- **A3 — Target date past model horizon:** Backend clamps and notes in response; UI surfaces the warning.

---

## UC-ANO-1 — List Anomalies

**Goal:** Surface the anomalies detected by the backend in a scannable table.
**Primary actor:** Operator
**Secondary actors:** `AnomalyCenterView`, `useDashboardData`, FastAPI
**Preconditions:** User on `/anomaly-center`.

**Postcondition:** Summary tiles + paginated table populated.

**Main flow:**
1. Operator opens `/anomaly-center`.
2. View calls `useDashboardData({ historyHours, futureDays: 1 })`.
3. Hook fetches `/api/anomalies`.
4. Adapter maps raw rows (`{date, value, severity, score, deviation_pct}`) → `AnomalyEntry` (synthesizes title, asset, factors).
5. View renders tiles (total, critical, last 24h) + table.

**Alternate flows:**
- **A1 — No anomalies in window:** Table shows empty state; tiles all read 0.
- **A2 — Backend down:** Error banner + retry.

---

## UC-ANO-2 — Filter by Severity

**Goal:** Narrow the table to a single severity to focus triage.
**Primary actor:** Operator
**Secondary actors:** `Select`, `AnomalyCenterView`
**Preconditions:** Anomalies loaded.

**Postcondition:** Table and tiles reflect only the chosen severity; pagination resets to page 1.

**Main flow:**
1. Operator picks a severity in the `Select`.
2. `setSev(s)` fires.
3. `useEffect` runs `setPage(1)`.
4. Memoized `filtered = anomalies.filter(...)` recomputes.
5. Tiles + table re-render.

**Alternate flows:**
- **A1 — Severity yields zero rows:** Empty state with a clear filter button.

---

## UC-ANO-3 — Change Time Window

**Goal:** Re-scope the view to a different recent window (24h, 3d, 7d, 30d).
**Primary actor:** Operator
**Secondary actors:** `useDashboardData`
**Preconditions:** Anomaly center mounted.

**Postcondition:** Anomalies re-fetched for the new window; tiles and table reflect the new data.

**Main flow:**
1. Operator picks a window preset.
2. `setHistoryHours(h)`.
3. `useDashboardData` re-runs (`historyHours` in deps).
4. Hook fetches a fresh slice; view updates.

**Alternate flows:**
- **A1 — Backend slow:** Skeleton/spinner shows while previous data stays visible.

---

## UC-ANO-4 — Paginate Table

**Goal:** Browse a large list of anomalies 10 rows at a time.
**Primary actor:** Operator
**Secondary actors:** `AnomalyCenterView`
**Preconditions:** > 10 anomalies after filters.

**Postcondition:** Table shows the requested page.

**Main flow:**
1. Operator clicks next/prev.
2. `setPage(p)`.
3. `paginated = filtered.slice((p-1)*10, p*10)`.
4. Table renders the slice.

**Alternate flows:**
- **A1 — Filter change shrinks list:** Page resets to 1 (see UC-ANO-2).
- **A2 — Last page partial:** Renders remaining < 10 rows.

---

## UC-ANO-5 — View Anomaly Detail

**Goal:** Drill into a single anomaly to see severity, deviation, and SHAP-style factors.
**Primary actor:** Operator
**Secondary actors:** `Dialog`, factor bars
**Preconditions:** Anomalies loaded.

**Postcondition:** Modal dialog open with detail content for the selected row.

**Main flow:**
1. Operator clicks a row.
2. `setSelected(anomaly)`.
3. `Dialog` opens with the anomaly: severity badge, delta, factor bars, description.
4. Operator closes the dialog (Esc, overlay click, or button).

**Alternate flows:**
- **A1 — Anomaly lacks factors:** Dialog shows "factors unavailable" but still displays severity and delta.
- **A2 — Operator opens another anomaly:** Replaces the dialog content; no flicker.

---

## UC-FEAT-* — Feature Metadata Endpoints

**Goal:** Expose the canonical 18-feature schema (names, required-ness, importance) to the frontend.
**Primary actor:** Frontend developer / advanced UI (feature inspector)
**Secondary actors:** Next proxy, FastAPI
**Preconditions:** Backend has the feature registry loaded.

**Postcondition:** Caller has a typed list of features + metadata.

**Main flow:**
1. UI (or tooling) calls `getFeatures()`, `getRequiredFeatures()`, or `getFeatureImportance()`.
2. Each helper hits `/api/features`, `/api/features/required`, `/api/features/importance`.
3. Proxy forwards to FastAPI.
4. Backend reads the canonical schema and returns it.

**Alternate flows:**
- **A1 — Schema mismatch:** Adapter logs raw payload; Zod throws.

---

## UC-METR-1/2 — Metrics with Split

**Goal:** Provide a fixed, honest test-set quality metric (MAPE, MAE, RMSE, R²) for HeroMetrics.
**Primary actor:** Operator (indirectly; consumed by HeroMetrics)
**Secondary actors:** FastAPI, predictions CSV
**Preconditions:** `dataset_daily_with_predictions.csv` has a `Split` column (UC-ADM-4).

**Postcondition:** Caller gets `{mae, rmse, mape, r2, n_samples}` for the requested split.

**Main flow:**
1. UI calls `getMetrics({ split: "test" })`.
2. Proxy forwards `/api/metrics?split=test`.
3. Backend loads the CSV, filters by `Split == "test"`, computes metrics, returns JSON.

**Alternate flows:**
- **A1 — Split missing or empty:** Backend returns 4xx with reason; UI shows "—".
- **A2 — `split=val` or `split=train` requested:** Same path; returns metrics for that slice.

---

## UC-ADM-1 — Retrain Hybrid Pipeline (offline)

**Goal:** Produce a fresh set of model artifacts (Prophet, LightGBM, Isolation Forest) optimized by Optuna.
**Primary actor:** Data Scientist / Trainer
**Secondary actors:** Optuna, Prophet, LightGBM, Isolation Forest, KNNImputer
**Preconditions:**
- `train_data/` and `test_data/` are up-to-date (UC-ADM-2, UC-ADM-3)
- Python env has all libs; `OPTUNA_TRIALS` env set
- Sufficient disk for `Models/*.joblib` and `Outputs/*.csv`

**Postcondition:** New joblib artifacts in `Models/`; predictions CSV in `Outputs/`; `best_hybrid_params.json` updated.

**Main flow:**
1. Admin runs `python Scripts/hybrid_model.py`.
2. Script loads train + test CSVs.
3. Fits `KNNImputer` on train only.
4. Runs a joint Optuna study over `(contamination, prophet_priors, lgbm_params)`.
5. Each trial: Isolation Forest filters anomalies, Prophet fits baseline on cleaned train, LightGBM fits residual.
6. Best params written to `best_hybrid_params.json`.
7. Champion models refit on full train using best params.
8. Predictions for train/val/test written to a single CSV; joblibs persisted.

**Alternate flows:**
- **A1 — Trial exception:** Optuna logs and skips; study continues.
- **A2 — Out-of-memory:** Reduce `OPTUNA_TRIALS` or sample frequency; rerun.
- **A3 — Champion worse than previous:** Admin keeps previous artifacts (manual gate).

---

## UC-ADM-2 — Rebuild Datasets

**Goal:** Regenerate canonical daily train/val/test datasets from raw sources.
**Primary actor:** Trainer
**Secondary actors:** `build_real_datasets.py`, raw CSVs
**Preconditions:** Raw CSVs are present and well-formed.

**Postcondition:** `train_data/`, `test_data/` populated with chronological 70/15/15 splits (30-row warmup dropped per split).

**Main flow:**
1. Admin runs `python build_real_datasets.py`.
2. Script reads raw CSVs, cleans, aligns to daily granularity.
3. Splits chronologically 70/15/15.
4. Drops 30 warmup rows per split.
5. Writes final daily CSVs.

**Alternate flows:**
- **A1 — Missing dates / gaps:** Script logs gaps; fails fast if gaps exceed a threshold.
- **A2 — Schema drift in raw CSV:** Script errors with the offending column.

---

## UC-ADM-3 — Integrate BMKG Weather

**Goal:** Join daily BMKG weather observations into the canonical datasets.
**Primary actor:** Trainer
**Secondary actors:** `integrate_bmkg.py`, raw BMKG CSV
**Preconditions:** Train/test CSVs exist; BMKG CSV has overlapping date coverage.

**Postcondition:** Train/test CSVs now include `Avg_Temp` and `Rainfall` columns.

**Main flow:**
1. Admin runs `python integrate_bmkg.py`.
2. Script loads BMKG daily weather.
3. Joins on `Date` against train and test CSVs.
4. Writes enriched CSVs in place.

**Alternate flows:**
- **A1 — Date gaps in BMKG:** Missing days are forward-filled (or flagged) per a documented policy.
- **A2 — BMKG columns renamed:** Adapter inside the script needs an update.

---

## UC-ADM-4 — Tag Train/Val/Test in CSV (proposed)

**Goal:** Make the train/val/test split a first-class column so `/api/metrics?split=...` is honest.
**Primary actor:** Trainer
**Secondary actors:** `hybrid_model.py` (post-update)
**Preconditions:** Hybrid pipeline produces train/val/test predictions.

**Postcondition:** `dataset_daily_with_predictions.csv` has a `Split` column (`train`/`val`/`test`) and is sorted by Date.

**Main flow:**
1. After refit, script tags each subset's DataFrame: `train_df["Split"] = "train"` etc.
2. Concatenates and sorts by Date.
3. Writes the CSV.
4. Backend `/api/metrics?split=test` now filters on this column.

**Alternate flows:**
- **A1 — Overlapping dates between splits:** Sanity check raises; script aborts.
- **A2 — Legacy consumers expect no Split column:** Add the column at the end of the schema to preserve column-order assumptions.

---
