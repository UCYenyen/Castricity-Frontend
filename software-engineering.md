Castricity — Use Cases Lengkap (Frontend + Backend)
Per use case: deskripsi singkat, sequence diagram, dan design pattern yang dipakai. Semua disusun berdasarkan kode aktual di repo.

0. Master Use Case Diagram
flowchart LR
    User([Operator / User])
    Admin([Data Scientist / Trainer])

    subgraph FE_Auth[Auth]
        UC1[Sign Up]
        UC2[Sign In]
        UC3[Sign Out]
        UC4[Resolve Session]
        UC5[Route Protection]
    end

    subgraph FE_Land[Landing]
        UC6[View Hero / Globe]
        UC7[Auth-aware Navbar]
    end

    subgraph FE_Dash[Dashboard]
        UC8[Load Dashboard]
        UC9[View Hero Metrics]
        UC10[Filter Validation by Date Range]
        UC11[Inspect Historical Point]
        UC12[Refresh Data]
    end

    subgraph FE_Fcst[Forecast]
        UC13[Load Multi-Horizon Forecast]
        UC14[Pick Start Date]
        UC15[Change Horizon]
        UC16[Toggle Confidence Band]
        UC17[Click Day → Lock What-if]
        UC18[Run What-if Scenario]
    end

    subgraph FE_Ano[Anomalies]
        UC19[List Anomalies]
        UC20[Filter Severity]
        UC21[Paginate]
        UC22[View Anomaly Detail]
    end

    subgraph BE_API[Backend API]
        UC23[GET /metrics?split=...]
        UC24[GET /forecast/historical]
        UC25[GET /forecast/future?days,start_date]
        UC26[POST /forecast/whatif]
        UC27[GET /anomalies]
        UC28[GET /features /required /importance]
    end

    subgraph BE_ML[Model Lifecycle]
        UC29[Retrain Hybrid Pipeline]
        UC30[Rebuild Datasets]
        UC31[Integrate BMKG Weather]
        UC32[Tag Train/Val/Test Split in CSV]
    end

    User --> UC1 & UC2 & UC3 & UC4 & UC6 & UC7
    User --> UC8 & UC9 & UC10 & UC11 & UC12
    User --> UC13 & UC14 & UC15 & UC16 & UC17 & UC18
    User --> UC19 & UC20 & UC21 & UC22
    UC8 -.calls.-> UC23 & UC24 & UC25 & UC27
    UC10 -.calls.-> UC24
    UC13 -.calls.-> UC25
    UC18 -.calls.-> UC26
    UC19 -.calls.-> UC27
    Admin --> UC29 & UC30 & UC31 & UC32
    UC5 -.guards.-> UC8 & UC13 & UC19



1. UC-AUTH-1 — Sign Up
- Goal: Create a new account so the user can access the protected dashboard.
- Primary actor: New User
- Secondary actors: Better Auth, Prisma, Postgres
- Preconditions: `/sign-up` reachable; email not already registered; auth env vars set.
- Postcondition: `user` + `account` + `session` rows created; session cookie set; user redirected to `/dashboard`.
- Main flow: The user opens `/sign-up`, submits name/email/password, and `authClient.signUp.email` posts `/api/auth/sign-up/email`; the catch-all route forwards to `auth.handler`, which hashes the password, asks `prismaAdapter` to insert `user` + `account` rows, then creates a `session` row and emits a `Set-Cookie`; the client resolves and `router.push("/dashboard")` lands the user inside the protected area.
- Alternative flow: If the email is already registered Better Auth returns 4xx and the form shows "Email already registered"; if Zod rejects a weak password or malformed email the submit is blocked client-side; if Prisma/Postgres is unreachable the handler 500s and the form shows a generic retry message; if the browser blocks third-party cookies the redirect succeeds but the next middleware check bounces the user back to `/sign-in`.

sequenceDiagram
    actor U as User
    participant Form as sign-up/page.tsx
    participant Cli as auth-client.ts
    participant Rt as /api/auth/[...all]
    participant BA as betterAuth (lib/auth.ts)
    participant Pr as Prisma
    participant DB as Postgres
    U->>Form: Submit {name,email,password}
    Form->>Cli: signUp.email(...)
    Cli->>Rt: POST /api/auth/sign-up/email
    Rt->>BA: auth.handler(req)
    BA->>Pr: prismaAdapter.createUser
    Pr->>DB: INSERT user
    BA->>Pr: prismaAdapter.createAccount(hashed pw)
    Pr->>DB: INSERT account
    BA->>Pr: createSession
    Pr->>DB: INSERT session
    BA-->>Cli: 200 + Set-Cookie
    Cli-->>U: redirect /dashboard


Pattern: Adapter (prismaAdapter ngeubah Better Auth's storage API ↔ Prisma), Facade (auth-client.ts ngebungkus Better Auth REST jadi function call), Singleton (prisma).

2. UC-AUTH-2 — Sign In
- Goal: Authenticate a returning user and start a session.
- Primary actor: Returning User
- Secondary actors: Better Auth, Prisma, Postgres
- Preconditions: User has an existing account; `/sign-in` reachable; no valid session yet.
- Postcondition: New `session` row + session cookie; user lands on `/dashboard` (or the `redirect` target).
- Main flow: User opens `/sign-in?redirect=...`, submits credentials, and `authClient.signIn.email` posts `/api/auth/sign-in/email`; Better Auth looks up the `account`, verifies the password hash, creates a `session` row, and returns a `Set-Cookie`; the form reads the `redirect` query (defaults to `/dashboard`) and routes the user there.
- Alternative flow: Wrong password or unknown email both return 401 with the same "Invalid credentials" message (no enumeration); a disabled account returns 403 with a status note; a user already holding a valid cookie is bounced off `/sign-in` to `/dashboard` by the middleware before the form ever renders.

sequenceDiagram
    actor U as User
    participant Form as sign-in/page.tsx
    participant Cli as auth-client.ts
    participant Rt as /api/auth/[...all]
    participant BA as betterAuth
    participant Pr as Prisma
    U->>Form: Submit {email,password}
    Form->>Cli: signIn.email
    Cli->>Rt: POST /api/auth/sign-in/email
    Rt->>BA: handler
    BA->>Pr: findUser + verify hash
    Pr-->>BA: ok
    BA->>Pr: createSession
    BA-->>Cli: Set-Cookie
    Cli-->>U: router.push("/dashboard")


Pattern: Strategy (multiple providers possible — kita pakai emailAndPassword), Adapter, Singleton.

3. UC-AUTH-3 — Sign Out
- Goal: End the current session and return to the public area.
- Primary actor: Authenticated User
- Secondary actors: Better Auth, Prisma, Browser cookie store
- Preconditions: User is signed in; sidebar is rendered.
- Postcondition: Session invalidated server-side; cookie cleared; UI re-renders unauthenticated; user lands on `/sign-in`.
- Main flow: User clicks "Keluar" in `DashboardSidebar`, which calls `authClient.signOut()`; the client posts `/api/auth/sign-out`, Better Auth invalidates the session row and emits a cookie-clearing `Set-Cookie`, then the sidebar runs `router.push("/sign-in")` followed by `router.refresh()` so server-component caches drop and any `useSession` subscribers flip to the unauthenticated branch.
- Alternative flow: A network failure leaves `signOut()` rejected; a toast appears and the session remains valid until retry; if the user already signed out in another tab, the next protected action 401s and the middleware bounces them to `/sign-in` on the following navigation.

sequenceDiagram
    actor U as User
    participant Sb as DashboardSidebar
    participant Cli as auth-client.ts
    participant Rt as /api/auth/sign-out
    U->>Sb: Click "Keluar"
    Sb->>Cli: signOut()
    Cli->>Rt: POST /api/auth/sign-out
    Rt->>Rt: invalidate session in DB + clear cookie
    Rt-->>Cli: 200
    Cli-->>Sb: resolve
    Sb->>Sb: router.push("/sign-in"); router.refresh()


Pattern: Command (signOut adalah encapsulated action), Observer (useSession listener auto-refresh).

4. UC-AUTH-4 — Resolve Session (useSession)
- Goal: Let any client component render the correct branch based on auth state.
- Primary actor: Any client React component (Navbar, Sidebar, gated CTAs)
- Secondary actors: Better Auth client cache, `/api/auth/get-session`
- Preconditions: Component is `"use client"`; auth client configured.
- Postcondition: Component renders loading / authed / unauthed correctly and stays in sync with future auth changes.
- Main flow: A client component calls `useSession()`, which on first invocation issues `GET /api/auth/get-session`; the route handler reads the cookie, validates the session in DB, and returns `{user, session}` or `null`; the hook stores the result and re-renders subscribers, then re-validates on focus and emits updates whenever the cookie changes in any tab.
- Alternative flow: A 401 response yields `data === null`, so the component renders the unauthed branch; on network error `data` stays `undefined` and the component keeps the last-known state or a skeleton; during SSR the hook starts in the pending state and the client hydrates with the real value (no mismatch because both initial renders are the skeleton).

sequenceDiagram
    participant Comp as Navbar / Sidebar
    participant Cli as auth-client.ts (useSession)
    participant Rt as /api/auth/get-session
    Comp->>Cli: useSession()
    Cli->>Rt: GET /api/auth/get-session
    Rt-->>Cli: {session, user} | null
    Cli-->>Comp: { data, isPending }
    Note over Comp: Conditional render (Sign In vs Go to Dashboard)


Pattern: Observer (React hook subscribes to session), Cache (Better Auth client memoizes).

5. UC-AUTH-5 — Route Protection
- Goal: Prevent unauthenticated access to protected routes and bounce authed users off auth pages.
- Primary actor: Browser (any navigation)
- Secondary actors: Next.js Edge runtime, `src/proxy.ts`
- Preconditions: `proxy.ts` matcher covers `/dashboard`, `/predict`, `/sign-in`, `/sign-up`.
- Postcondition: Request either continues, redirects to `/sign-in?redirect=...`, or redirects to `/dashboard`.
- Main flow: On every matched navigation the Edge runtime invokes `proxy(request)`; the middleware reads the `better-auth.session_token` cookie, and if the path is protected and the cookie is missing redirects 307 to `/sign-in?redirect=<path>`, or if the path is `/sign-in`/`/sign-up` and a cookie is present redirects to `/dashboard`, otherwise it calls `NextResponse.next()` and the page renders (server components that need the real user then call `auth.api.getSession`).
- Alternative flow: An expired cookie still satisfies the presence check, so the request passes middleware but the server-component `getSession` returns `null` and the page handles the empty state explicitly; a rotated/renamed cookie is treated as missing and triggers the redirect; matcher excludes static assets so images and `_next/*` paths bypass the check entirely.

sequenceDiagram
    actor U as Browser
    participant Mw as src/proxy.ts (Next middleware)
    U->>Mw: GET /dashboard
    Mw->>Mw: cookies.get("better-auth.session_token")
    alt has cookie
        Mw-->>U: NextResponse.next()
    else no cookie
        Mw-->>U: 307 /sign-in?redirect=/dashboard
    end
    Note over U: Already-authed user hitting /sign-in is bounced to /dashboard


Pattern: Middleware / Chain of Responsibility, Guard clause.

6. UC-LAND-1 — View Hero (Rotating Globe)
- Goal: Show a visually engaging Indonesia-centered globe on the landing page.
- Primary actor: Visitor (anonymous)
- Secondary actors: Natural Earth GeoJSON CDN, d3-geo, Canvas 2D
- Preconditions: Landing route renders; browser supports Canvas; GeoJSON URLs reachable.
- Postcondition: Dotted globe drawn; drag rotates; release tweens back to the HOME rotation.
- Main flow: The landing page renders `Hero`, which mounts `RotatingEarth`; `useEffect` initializes a d3 orthographic projection sized via `useElementSize`, fetches `ne_110m_land.json` and `ne_110m_admin_0_countries.json` in parallel, samples dots inside land polygons (point-in-polygon), and draws the globe once centered on Indonesia; mouse listeners update the rotation on drag and a `d3.timer` tween eases the rotation back to HOME on release.
- Alternative flow: If GeoJSON fetch fails, the component falls back to a plain outline globe; on touch devices `touchstart/move/end` mirror mouse events for identical behavior; when `prefers-reduced-motion` is set the snap-back skips the tween; on window resize `useElementSize` triggers re-projection and the dot grid is re-sampled.

sequenceDiagram
    participant Page as src/app/page.tsx
    participant Hero as Hero.tsx
    participant Globe as RotatingEarth
    participant CDN as Natural Earth GeoJSON
    Page->>Hero: render
    Hero->>Globe: mount(<canvas>)
    Globe->>Globe: useEffect → setup d3 orthographic projection
    Globe->>CDN: fetch ne_110m_land.json + ne_110m_admin_0_countries.json
    CDN-->>Globe: GeoJSON
    Globe->>Globe: generate dots inside land polygons
    Globe->>Globe: d3.timer not needed (no auto-rotate); render once
    Globe-->>Hero: canvas displayed (centered on Indonesia)
    Note over Hero: Drag handler animates back to Indonesia on mouseup


Pattern: Strategy (d3.geoOrthographic + geoPath projection), Observer (mouse event listeners), Memento (HOME rotation state restored on release), Tween (d3.timer with ease-out cubic).

7. UC-LAND-2 — Auth-aware Navbar
- Goal: Show the correct CTA on the marketing nav based on auth state, without flicker.
- Primary actor: Visitor
- Secondary actors: `useSession`, Next router
- Preconditions: Visitor is on a public route; Navbar mounted.
- Postcondition: Navbar shows skeleton, "Go to Dashboard", or "Sign In/Sign Up" depending on session.
- Main flow: Navbar mounts and calls `useSession()`; while `isPending` it renders a skeleton to avoid CTA flicker, and once the hook resolves it either renders a single "Go to Dashboard" button (when `data` exists) or a "Sign In" + "Sign Up" pair (when `data === null`); sign-in/out events from other tabs push updates and the nav re-renders without reload.
- Alternative flow: When the session endpoint errors the navbar defaults to the unauthed buttons as a graceful fallback; an already-authed visitor sees a brief skeleton flash followed by the dashboard CTA, never the sign-in buttons.

sequenceDiagram
    participant Nav as Navbar.tsx
    participant Cli as auth-client.useSession
    Nav->>Cli: useSession()
    Cli-->>Nav: {isPending,data}
    alt isPending
        Nav-->>Nav: render skeleton
    else data exists
        Nav-->>Nav: render "Go to Dashboard"
    else no data
        Nav-->>Nav: render "Sign In" + "Sign Up"
    end


Pattern: State pattern (3-state UI render: loading/auth/unauth).

8. UC-DASH-1 — Load Dashboard
- Goal: Hydrate the dashboard with history, forecast, anomalies, and metrics as fast as possible.
- Primary actor: Operator
- Secondary actors: `useDashboardData`, Next route handlers, FastAPI, `AbortController`
- Preconditions: User passed UC-AUTH-5; `BACKEND_URL` is set; FastAPI healthy.
- Postcondition: HeroMetrics, ValidationCard, and AnomalyStrip render real data; no in-flight fetches after unmount.
- Main flow: The user navigates to `/dashboard`, the route group layout mounts the sidebar, the page renders `<DashboardView />`, which calls `useDashboardData({futureDays})`; the hook spins up an `AbortController` and fires `getHistorical`, `getFuture`, `getAnomalies`, and `getMetrics({split:"test"})` in parallel through the Next route handlers; each response is Zod-validated, adapted to the internal domain shape, and committed in one state batch, after which the view renders `HeroMetrics`, `ValidationCard`, and `AnomalyStrip`.
- Alternative flow: If one endpoint fails the hook degrades that slice to an empty list and shows a non-blocking error banner while other tiles render normally; if all fail an error surface with a retry (calling `refresh()`) is shown; navigating away mid-fetch triggers `controller.abort()` so no state lands on an unmounted component; payloads that fail Zod throw in the adapter and the raw payload is logged server-side for debugging.

sequenceDiagram
    actor U as User
    participant Page as dashboard/page.tsx
    participant V as DashboardView
    participant H as useDashboardData
    participant API as lib/api.ts
    participant Proxy as Next /api/* handlers
    participant Be as FastAPI

    U->>Page: GET /dashboard
    Page->>V: render
    V->>H: useDashboardData({futureDays})
    par 4 parallel calls
        H->>API: getHistorical()
        API->>Proxy: GET /api/forecast/historical
        Proxy->>Be: /api/forecast/historical
        Be-->>API: rows[]
    and
        H->>API: getFuture({days, startDate: today})
        API->>Proxy: GET /api/forecast/future?...
        Proxy->>Be: /api/forecast/future
        Be-->>API: forecast[]
    and
        H->>API: getAnomalies()
        API->>Proxy: GET /api/anomalies
        Proxy->>Be: /api/anomalies
        Be-->>API: anomalies[]
    and
        H->>API: getMetrics({split:"test"})
        API->>Proxy: GET /api/metrics?split=test
        Proxy->>Be: /api/metrics?split=test
        Be-->>API: {mae,rmse,mape,r2,n_samples}
    end
    H-->>V: data
    V-->>U: HeroMetrics + AnomalyStrip + ValidationCard


Pattern: Facade (useDashboardData hides 4 endpoints), Proxy (Next.js /api), Adapter (api.ts shape mapping), Promise.all concurrency, AbortController for cleanup.

9. UC-DASH-2 — View Hero Metrics
- Goal: Give the operator an at-a-glance read of grid demand and model accuracy.
- Primary actor: Operator
- Secondary actors: `HeroMetrics`, `MetricTile`
- Preconditions: `useDashboardData` resolved with `metrics` and `future`.
- Postcondition: Tiles render peak (with 24h sparkline), MAPE, MAE, RMSE, R², bias, hit-rate.
- Main flow: `DashboardView` passes `history`, `future`, `peak`, and `metrics` into `HeroMetrics`; the component derives `peakHourSpark = future.slice(0, 24).map(p => p.predicted)`, renders a cyan `MetricTile` for peak with the sparkline, and a row of `MetricTile`s for MAPE, MAE, RMSE, R², bias, and hit-rate (no sparklines) — each tile showing label, value, unit, and an optional delta vs. yesterday.
- Alternative flow: When `metrics` is null the tiles show "—" with a tooltip noting "metrics endpoint unavailable"; when `future` is empty the peak tile drops the sparkline and shows only the scalar; when MAPE crosses a threshold (e.g. > 15%) the tile turns amber to draw attention without taking any action.

sequenceDiagram
    participant V as DashboardView
    participant HM as HeroMetrics
    participant MT as MetricTile
    V->>HM: history, future, peak, metrics={mae,rmse,mape,bias,hit}
    HM->>HM: peakHourSpark = future.slice(0,24).map(predicted)
    HM->>MT: peak demand tile (cyan, sparkline)
    HM->>MT: MAPE tile (no sparkline)
    MT-->>V: rendered tiles


Pattern: Composition (MetricTile is a presenter), Memoization (React Compiler), Container-Presenter.

10. UC-DASH-3 — Filter Validation by Date Range
- Goal: Inspect model performance over a custom window without affecting global metrics.
- Primary actor: Operator
- Secondary actors: `DateRangePicker`, `ValidationCard`, `niceBounds`
- Preconditions: History loaded; date range picker visible.
- Postcondition: `ValidationCard` re-renders with sliced history; brush resets; hero metric tiles unchanged.
- Main flow: The operator opens the `DateRangePicker` popover and picks a `from`/`to` via shadcn Calendar (`mode="range"`); the picker fires `onChange(range)` to the view, which runs `setRange(range)` and `setBrush([0, 1])` to reset the zoom; a memoized selector recomputes `filteredHistory = history.filter(p => p.t in range)`, `niceBounds` recomputes the Y-scale, and `ValidationCard` re-renders the sliced chart while the hero tiles (which always read the test-set metric) stay constant.
- Alternative flow: When the range contains no points the card shows an empty-state message; if `from > to` the picker normalizes the selection (swaps the bounds); clearing the range returns the chart to the full history window.

sequenceDiagram
    actor U as User
    participant V as DashboardView
    participant DRP as DateRangePicker
    participant VC as ValidationCard
    U->>DRP: Pick from/to
    DRP-->>V: onChange(range)
    V->>V: setRange(r); setBrush([0,1])
    V->>V: filteredHistory = history.filter(t in range)
    V->>VC: history=filteredHistory, range, rangeBounds
    VC-->>U: chart re-renders sliced data


Pattern: Controlled component (DateRangePicker), Memo selector (useMemo filter), Strategy (niceBounds recomputes scale).

11. UC-DASH-4 — Inspect Historical Point (Explainer)
- Goal: Explain actual vs predicted for a specific historical point the operator clicks.
- Primary actor: Operator
- Secondary actors: `ValidationChart`, `Explainer`, `pointExplainer` heuristic
- Preconditions: History rendered; chart hit-testing live.
- Postcondition: Explainer shows delta and driving factors for the selected point.
- Main flow: The operator hovers `ValidationChart`, the nearest-point highlight tracks the cursor, and a click bubbles `onPointClick(p)` to `DashboardView`, which calls `setExplainPt({t, actual, predicted, anomalyKey: null})`; the `Explainer` resolves factors in priority order — first `point.data.factors` from the server, then a hardcoded entry in `lib/dashboard/data.ts:ANOMALY_DETAILS[anomalyKey]`, and finally the `pointExplainer(point)` heuristic that infers contributions from hour-of-day, day-of-week, temperature, and residual patterns — then renders the headline, factor bars, and short description.
- Alternative flow: If no SHAP and no hardcoded entry exist the heuristic path is used and labeled "inferred"; clicking another point quickly replaces the selection and the previous Explainer unmounts; clicking a future-range point disables the Explainer or shows "Predicted only — no actual yet."

sequenceDiagram
    actor U as User
    participant Chart as ValidationChart
    participant V as DashboardView
    participant Ex as Explainer
    U->>Chart: Hover → click point
    Chart->>V: onPointClick(p)
    V->>V: setExplainPt({t, actual, predicted, anomalyKey: null})
    V->>Ex: render(point)
    Ex-->>U: actual vs predicted, delta, factors


Pattern: Mediator (DashboardView coordinates chart ↔ explainer), Observer (mouse events).

12. UC-DASH-5 — Refresh Data
- Goal: Re-pull all dashboard data without a full page reload.
- Primary actor: Operator
- Secondary actors: `DashboardTopbar`, `useDashboardData.refresh`
- Preconditions: Dashboard already loaded once.
- Postcondition: All four datasets re-fetched; spinner shown; previous data stays visible during refresh.
- Main flow: The operator clicks refresh in `DashboardTopbar`, which calls `refresh()` on `useDashboardData`; the hook flips `isRefreshing = true`, starts a new `fetchAll(controller.signal, isRefresh=true)`, the refresh icon becomes a spinner, and on success the new payloads atomically replace state and `isRefreshing` flips back to `false`.
- Alternative flow: A refresh started while the initial fetch is still in flight aborts the earlier controller and supersedes it; a failing refresh shows a "Refresh failed" toast and the previously loaded data remains on screen unchanged.

sequenceDiagram
    actor U as User
    participant TB as DashboardTopbar
    participant H as useDashboardData
    U->>TB: Click refresh
    TB->>H: refresh()
    H->>H: fetchAll(new AbortController().signal, isRefresh=true)
    Note over H: parallel re-fetch + isRefreshing flag flips spinner


Pattern: Command (refresh callback), Singleton hook instance.

13. UC-FCST-1 — Load Multi-Horizon Forecast
- Goal: Show predicted demand for the chosen horizon and start date, with confidence bands.
- Primary actor: Operator
- Secondary actors: `ForecastView`, `lib/api.getFuture`, FastAPI (Prophet + LightGBM)
- Preconditions: User on `/forecast`; horizon and start date in state.
- Postcondition: `MultiHorizonChart` renders the predicted line and (optionally) the band.
- Main flow: The user navigates to `/forecast` and `ForecastView` mounts; a `useEffect` watching `{horizon, startDate}` calls `getFuture({days: horizon, startDate})`, the adapter requests `/api/forecast/future?days=N&start_date=YYYY-MM-DD`, the proxy forwards to FastAPI where Prophet emits the baseline series and LightGBM emits the residual series; the backend sums them for `predicted` and attaches `lower_bound`/`upper_bound`, the adapter maps `{date, predicted, lower_bound, upper_bound}` to `{t, predicted, p10, p90}`, and the chart renders the line plus optional band.
- Alternative flow: A horizon exceeding the configured cap is clamped client-side with a hint; if the backend returns fewer rows than requested the chart renders what's available and the subtitle notes partial coverage; on network error a skeleton transitions to an error message with a retry button.

sequenceDiagram
    actor U as User
    participant V as ForecastView
    participant API as lib/api.getFuture
    participant Proxy as /api/forecast/future
    participant Be as FastAPI
    participant Pro as Prophet
    participant LGBM as LightGBM
    U->>V: GET /forecast
    V->>V: useEffect({horizon, startDate})
    V->>API: getFuture({days,startDate})
    API->>Proxy: GET /api/forecast/future?days=N&start_date=YYYY-MM-DD
    Proxy->>Be: GET /api/forecast/future
    Be->>Pro: predict baseline series
    Be->>LGBM: predict residual series
    Be->>Be: predicted = prophet + lgbm; band = ±p10/p90
    Be-->>API: [{date,predicted,lower_bound,upper_bound}]
    API->>API: map → ForecastPoint[]
    API-->>V: future
    V-->>U: MultiHorizonChart


Pattern: Composite (Prophet baseline + LGBM residual), Adapter (shape map), Pipeline (predict chain).

14. UC-FCST-2 — Pick Forecast Start Date
- Goal: Re-anchor the forecast window to a chosen start date.
- Primary actor: Operator
- Secondary actors: shadcn `Calendar`, `ForecastView`
- Preconditions: Forecast view mounted; start date defaults to today.
- Postcondition: Forecast re-fetched starting from the chosen date; chart updates.
- Main flow: The operator opens the start-date popover and picks a day in the shadcn Calendar; `onSelect(d)` fires `setStartDate(d)`, the dependency-watching `useEffect` re-runs and calls `getFuture({days, startDate: d})`, and the chart re-renders against the new anchor.
- Alternative flow: A past date is allowed and produces hindsight predictions if available, otherwise an empty/short series; a date past the model's horizon is clamped server-side and the UI surfaces the actual range used.

sequenceDiagram
    actor U as User
    participant V as ForecastView
    participant Cal as Calendar (shadcn)
    U->>Cal: select date
    Cal-->>V: onSelect(d)
    V->>V: setStartDate(d)
    Note over V: useEffect re-runs fetchFuture
    V->>V: getFuture({days,startDate:d})


Pattern: Controlled component, Effect-driven fetching (declarative re-fetch on dep change).

15. UC-FCST-3 — Change Horizon
- Goal: Switch between preset planning windows or specify a custom horizon.
- Primary actor: Operator
- Secondary actors: `Select`, custom `Input`, `ForecastView`
- Preconditions: Forecast view mounted.
- Postcondition: Forecast re-fetched for the new horizon.
- Main flow: The operator opens the horizon `Select` and picks 7/30/90/180/365/730, or chooses "Custom" and types a positive integer into the `Input`; `setHorizon(n)` fires, the dependency-watching `useEffect` re-runs `getFuture({days: n, startDate})`, and the chart re-renders.
- Alternative flow: A non-numeric or zero/negative custom value triggers Zod/HTML validation and the fetch is not initiated; switching between preset and custom preserves the last valid value so the chart never blanks unnecessarily.

sequenceDiagram
    actor U as User
    participant V as ForecastView
    participant Sel as Select
    participant Inp as Input (custom)
    U->>Sel: pick preset
    Sel-->>V: setHorizon(7|30|90|...)
    alt custom
        U->>Inp: type any positive integer
        Inp-->>V: setHorizon(n)
    end
    V->>V: re-fetch /forecast/future?days=horizon


Pattern: Strategy (preset vs custom horizon), Single source of truth (horizon state).

16. UC-FCST-4 — Toggle Confidence Band
- Goal: Declutter the chart when only the central forecast is needed.
- Primary actor: Operator
- Secondary actors: `Switch`, `MultiHorizonChart`
- Preconditions: Forecast loaded with band data.
- Postcondition: Band path shown/hidden.
- Main flow: The operator toggles the "Confidence band" `Switch`, which calls `setShowBand(b)`; the chart receives `showBand={b}` and conditionally renders the SVG band path while the predicted line stays unchanged.
- Alternative flow: When band data (`p10`/`p90`) is missing for the current series the switch is disabled with a tooltip explaining "Band unavailable for this horizon."

sequenceDiagram
    actor U as User
    participant V as ForecastView
    participant Sw as Switch
    participant Ch as MultiHorizonChart
    U->>Sw: toggle
    Sw-->>V: setShowBand(b)
    V->>Ch: showBand={b}
    Ch->>Ch: conditional draw bandPath


Pattern: Flag-driven render, declarative composition.

17. UC-FCST-5 — Click Day → Lock for What-if
- Goal: Pre-fill the what-if panel with a date picked from the chart.
- Primary actor: Operator
- Secondary actors: `MultiHorizonChart`, `WhatIfPanel`
- Preconditions: Forecast loaded; chart rendered.
- Postcondition: `WhatIfPanel.selectedDate` reflects the clicked day.
- Main flow: The operator hovers a forecast marker on `MultiHorizonChart` and clicks; the chart fires `onSelect(point)` to `ForecastView`, which runs `setSelected(point)`, and the controlled `WhatIfPanel.selectedDate={point.t}` pre-fills so scenario inputs can be applied against that exact day.
- Alternative flow: Re-clicking the same point is a no-op; if the operator changes the horizon while a date is locked, the lock persists when the date is still in range and is cleared otherwise so the panel doesn't reference an off-chart day.

sequenceDiagram
    actor U as User
    participant Ch as MultiHorizonChart
    participant V as ForecastView
    participant WI as WhatIfPanel
    U->>Ch: hover → click marker
    Ch->>V: onSelect(point)
    V->>V: setSelected(point)
    V->>WI: selectedDate={point.t}
    WI-->>U: date pre-filled


Pattern: Mediator (ForecastView shares state between chart + panel), Controlled prop (selectedDate).

18. UC-FCST-6 — Hover Day → Tooltip
- Goal: Surface predicted value and bounds on hover.
- Primary actor: Operator
- Secondary actors: `MultiHorizonChart`
- Preconditions: Chart rendered.
- Postcondition: Tooltip shows date, predicted, p10, p90 next to the cursor.
- Main flow: As the operator moves the mouse over `MultiHorizonChart`, a linear-scan hit-test finds the nearest point in pixel space, the component calls `setHover(nearest)`, and a `<foreignObject>` tooltip positioned next to the cursor displays the date, predicted MWh, and the p10/p90 bounds.
- Alternative flow: Moving the cursor off the chart triggers `setHover(null)` and hides the tooltip; on touch devices a tap shows the tooltip and a second tap clears it.

sequenceDiagram
    actor U as User
    participant Ch as MultiHorizonChart
    U->>Ch: mousemove
    Ch->>Ch: pixel-to-nearest-point search (linear scan)
    Ch->>Ch: setHover(nearest)
    Ch-->>U: <foreignObject> tooltip


Pattern: Hit-testing strategy, local state.

19. UC-WI-1 — Run What-if Scenario
- Goal: Estimate demand under hypothetical weather/holiday inputs and explain each driver.
- Primary actor: Operator / Planner
- Secondary actors: `WhatIfPanel`, `lib/api.runWhatIf`, FastAPI (Prophet + LightGBM + SHAP TreeExplainer)
- Preconditions: Forecast view loaded; target date selected; SHAP available.
- Postcondition: Three result tiles (predicted, baseline, delta) plus SHAP factor bars displayed.
- Main flow: The operator sets `avg_temp`, `rainfall`, `is_holiday`, and a `target_date`, then clicks "Run"; `runWhatIf` slices the date to `YYYY-MM-DD` and POSTs `/api/forecast/whatif`; FastAPI computes the Prophet baseline, LightGBM residual, and a SHAP TreeExplainer breakdown, returning `{predicted_mwh, prophet_baseline, lgbm_residual, base_value, shap_contributions}`; the adapter maps that to `{predicted, baseline, delta, factors[]}` and the panel renders the three result tiles plus a positive/negative SHAP bar chart.
- Alternative flow: Out-of-range inputs (e.g. temp > 45 °C) are rejected client-side by Zod with field-level errors; if SHAP is unavailable the backend returns the prediction without contributions and the panel shows the tiles plus a note; a target date past the model horizon is clamped server-side and the response warning is surfaced in the UI.

sequenceDiagram
    actor U as User
    participant WI as WhatIfPanel
    participant API as lib/api.runWhatIf
    participant Proxy as /api/forecast/whatif
    participant Be as FastAPI
    participant Pro as Prophet
    participant LGBM as LightGBM
    participant SHAP as TreeExplainer
    U->>WI: Set temp,rain,holiday + Click "Run"
    WI->>API: runWhatIf({target_date,avg_temp,rainfall,is_holiday})
    API->>API: payload.target_date.slice(0,10)
    API->>Proxy: POST /api/forecast/whatif
    Proxy->>Be: POST /api/forecast/whatif
    Be->>Pro: yhat baseline
    Be->>LGBM: predict residual
    Be->>SHAP: explain(features)
    SHAP-->>Be: contributions[]
    Be-->>API: {predicted_mwh,prophet_baseline,lgbm_residual,base_value,shap_contributions}
    API->>API: Adapter → {predicted,baseline,delta,factors[]}
    API-->>WI: result
    WI-->>U: 3 result tiles + SHAP bars


Pattern: Adapter (response shape), Strategy (linear SHAP additive model), Caching (TreeExplainer reused), Composite (Prophet + LGBM).

20. UC-ANO-1 — List Anomalies
- Goal: Surface backend-detected anomalies in a scannable table.
- Primary actor: Operator
- Secondary actors: `AnomalyCenterView`, `useDashboardData`, FastAPI
- Preconditions: User on `/anomaly-center`.
- Postcondition: Summary tiles and paginated table populated.
- Main flow: The operator navigates to `/anomaly-center`, the view calls `useDashboardData({historyHours, futureDays: 1})`, the hook fetches `/api/anomalies`, the adapter maps raw rows `{date, value, severity, score, deviation_pct}` to `AnomalyEntry` (synthesizing title, asset, and factor hints), and the view renders summary tiles (total / critical / last 24h) plus the paginated table.
- Alternative flow: When no anomalies fall inside the window the table shows an empty state and the tiles read 0; when the backend is down an error banner with a retry button replaces the table while the rest of the page remains usable.

sequenceDiagram
    actor U as User
    participant V as AnomalyCenterView
    participant H as useDashboardData
    participant API as lib/api.getAnomalies
    participant Be as FastAPI
    U->>V: GET /anomaly-center
    V->>H: useDashboardData({historyHours,futureDays:1})
    H->>API: getAnomalies()
    API->>Be: GET /api/anomalies
    Be-->>API: [{date,value,severity,score,deviation_pct}]
    API->>API: Map → AnomalyEntry (synth title/asset/factors)
    API-->>H: anomalies
    H-->>V: data
    V-->>U: Summary tiles + table


Pattern: Adapter (synthesize UI fields from raw), Composite (table rows = subcomponents).

21. UC-ANO-2 — Filter by Severity
- Goal: Narrow the table to one severity for focused triage.
- Primary actor: Operator
- Secondary actors: `Select`, `AnomalyCenterView`
- Preconditions: Anomalies loaded.
- Postcondition: Table and tiles reflect only the chosen severity; pagination resets to page 1.
- Main flow: The operator picks a severity in the `Select`, `setSev(s)` fires, an effect runs `setPage(1)` to avoid stranded pagination, the memoized `filtered = anomalies.filter(...)` recomputes, and tiles plus table re-render against the filtered slice.
- Alternative flow: If the chosen severity yields zero rows the table renders an empty state with a "Clear filter" link that resets `sev` back to "all" and returns the full list.

sequenceDiagram
    actor U as User
    participant V as AnomalyCenterView
    participant Sel as Select
    U->>Sel: pick severity
    Sel-->>V: setSev(s)
    V->>V: useEffect → setPage(1)
    V->>V: filtered = anomalies.filter(...)
    V-->>U: table + tiles re-render


Pattern: Strategy (filter predicate), Effect coordination.

22. UC-ANO-3 — Change Time Window
- Goal: Re-scope the anomaly view to a different recent window (24h/3d/7d/30d).
- Primary actor: Operator
- Secondary actors: `useDashboardData`
- Preconditions: Anomaly center mounted.
- Postcondition: Anomalies re-fetched; tiles and table reflect the new window.
- Main flow: The operator picks a window preset (24h/3d/7d/30d), `setHistoryHours(h)` updates state, `useDashboardData` re-runs because `historyHours` is in its dependency array, and the freshly fetched slice replaces the previous tiles and table.
- Alternative flow: While the backend is slow the previous data stays visible with a subtle loading indicator; if the fetch fails the prior slice remains and an error toast appears with a retry action.

sequenceDiagram
    actor U as User
    participant V as AnomalyCenterView
    participant H as useDashboardData
    U->>V: Pick 24h/3d/7d/30d
    V->>V: setHistoryHours(h)
    V->>H: useDashboardData re-runs (historyHours dep)
    H-->>V: refreshed anomalies window


Pattern: Dependency-driven fetch (hook deps array).

23. UC-ANO-4 — Paginate Table
- Goal: Browse a long list of anomalies 10 rows at a time.
- Primary actor: Operator
- Secondary actors: `AnomalyCenterView`
- Preconditions: More than 10 anomalies after filters.
- Postcondition: Table shows the requested page slice.
- Main flow: The operator clicks next/prev, `setPage(p)` updates state, the memoized selector computes `paginated = filtered.slice((p-1)*10, p*10)`, and the table renders the 10-row window.
- Alternative flow: Filter changes that shrink the list reset the page to 1 (see UC-ANO-2); the last page may render fewer than 10 rows; clicking past the bounds is disabled at the control level.

sequenceDiagram
    actor U as User
    participant V as AnomalyCenterView
    U->>V: Click next/prev
    V->>V: setPage(p)
    V->>V: paginated = filtered.slice((p-1)*10, p*10)
    V-->>U: 10 rows


Pattern: Iterator (slice window), Memo selector.

24. UC-ANO-5 — View Anomaly Detail
- Goal: Drill into one anomaly to see severity, delta, and contributing factors.
- Primary actor: Operator
- Secondary actors: `Dialog`, factor bars
- Preconditions: Anomalies loaded.
- Postcondition: Modal dialog shows detail content for the selected row.
- Main flow: The operator clicks a row, which sets `selected = anomaly` and opens the `Dialog`; the dialog renders the severity badge, delta vs. expected, factor bars from `selected.data.factors`, and a short description; closing with Esc, overlay click, or the close button returns focus to the table.
- Alternative flow: If the anomaly has no factors the dialog still renders severity and delta and shows "factors unavailable"; clicking another row replaces the dialog's content in place without flicker.

sequenceDiagram
    actor U as User
    participant Row as TableRow
    participant V as AnomalyCenterView
    participant D as Dialog
    U->>Row: click row
    Row->>V: setSelected(anomaly)
    V->>D: open with selected.data.factors
    D-->>U: severity, delta, factors bars, description


Pattern: Modal dialog (Dialog primitive), Observer (open state).

25. UC-FEAT-* — Feature Metadata Endpoints
- Goal: Expose the canonical 18-feature schema (names, required-ness, importance) to the frontend.
- Primary actor: Frontend developer / advanced UI (feature inspector)
- Secondary actors: Next proxy, FastAPI feature registry
- Preconditions: Backend feature registry loaded.
- Postcondition: Caller has a typed feature list with metadata.
- Main flow: A UI (or tooling) helper calls `getFeatures()`, `getRequiredFeatures()`, or `getFeatureImportance()`; each hits `/api/features`, `/api/features/required`, or `/api/features/importance`; the Next proxy forwards to FastAPI, which reads the canonical schema and returns `{features, total}`, `FeatureInfo[]`, or `FeatureImportance[]`.
- Alternative flow: If the backend response shape drifts the Zod schema throws in the adapter and the raw payload is logged server-side so the schema and mapper can be updated together; if the endpoint is unreachable the caller surfaces an error and the feature inspector renders an empty state.

sequenceDiagram
    participant Client as lib/api.getFeatures*
    participant Proxy as /api/features*
    participant Be as FastAPI
    Client->>Proxy: GET /api/features | /required | /importance
    Proxy->>Be: forward
    Be->>Be: read canonical 18-feature schema
    Be-->>Client: {features,total} | FeatureInfo[] | FeatureImportance[]


Pattern: Source-of-truth registry on backend, Pass-through proxy on frontend.

26. UC-METR-1/2 — Metrics with Split
- Goal: Provide a fixed, honest test-set quality metric (MAE, RMSE, MAPE, R²) for HeroMetrics.
- Primary actor: Operator (indirectly via HeroMetrics)
- Secondary actors: FastAPI, predictions CSV with `Split` column
- Preconditions: CSV has the `Split` column (UC-ADM-4).
- Postcondition: Caller gets `{mae, rmse, mape, r2, n_samples}` for the requested split.
- Main flow: The UI calls `getMetrics({split: "test"})`, the proxy forwards `/api/metrics?split=test`, the backend loads `dataset_daily_with_predictions.csv`, filters `Split == "test"`, computes MAE, RMSE, MAPE, R², and `n_samples`, and returns the metrics for the HeroMetrics tiles.
- Alternative flow: When the split is missing or empty the backend returns a 4xx with a reason and the UI shows "—" placeholders; requesting `split=val` or `split=train` follows the same path and returns metrics for that slice instead.

sequenceDiagram
    participant Client as lib/api.getMetrics
    participant Proxy as /api/metrics
    participant Be as FastAPI
    participant CSV as dataset_daily_with_predictions.csv
    Client->>Proxy: GET /api/metrics?split=test
    Proxy->>Be: GET /api/metrics?split=test
    Be->>CSV: load + filter Split == "test"
    Be->>Be: compute MAE,RMSE,MAPE,R²,n_samples
    Be-->>Client: metrics


Pattern: Filter strategy by query param, CSV-as-source (no DB), Computed-on-demand.

27. UC-ADM-1 — Retrain Hybrid Pipeline (offline)
- Goal: Produce fresh model artifacts (Prophet, LightGBM, Isolation Forest) tuned by Optuna.
- Primary actor: Data Scientist / Trainer
- Secondary actors: Optuna, Prophet, LightGBM, Isolation Forest, KNNImputer
- Preconditions: Train/test CSVs up-to-date; Python env ready; `OPTUNA_TRIALS` set.
- Postcondition: New joblibs in `Models/`; predictions CSV in `Outputs/`; `best_hybrid_params.json` updated.
- Main flow: The admin runs `python Scripts/hybrid_model.py`, the script loads train and test CSVs, fits `KNNImputer` on train only, and launches a joint Optuna study tuning Isolation Forest contamination, Prophet priors, and LightGBM params together; the best params are written to `best_hybrid_params.json`, the champion models are refit on the full training set (LightGBM targeting the Prophet residual), and the joblibs plus a predictions CSV are dumped to `Models/` and `Outputs/`.
- Alternative flow: Trial exceptions are caught by Optuna and skipped so the study can continue; an OOM failure prompts the admin to reduce `OPTUNA_TRIALS` and rerun; if the new champion underperforms the prior run the admin keeps the previous artifacts (manual quality gate).

sequenceDiagram
    actor Adm as Admin
    participant CLI as python Scripts/hybrid_model.py
    participant Opt as Optuna
    participant ISO as Isolation Forest
    participant Pro as Prophet
    participant LGBM as LightGBM
    participant Out as Models/*.joblib + Outputs/*.csv
    Adm->>CLI: run with OPTUNA_TRIALS
    CLI->>CLI: load train_data + test_data
    CLI->>CLI: KNNImputer fit on train
    CLI->>Opt: joint study (contamination, prophet priors, lgbm params)
    Opt->>ISO: trial run
    Opt->>Pro: trial run
    Opt->>LGBM: trial run
    Opt-->>CLI: best params (saved JSON)
    CLI->>ISO: refit champion
    CLI->>Pro: refit champion
    CLI->>LGBM: refit champion (target = residual)
    CLI->>Out: dump joblib + predictions CSV


Pattern: Joint Strategy (single Optuna study tunes 3 engines), Template Method (fit_on_train_only), Pipeline, Memento (params persisted to JSON).

28. UC-ADM-2 — Rebuild Datasets
- Goal: Regenerate canonical daily train/val/test datasets from raw sources.
- Primary actor: Trainer
- Secondary actors: `build_real_datasets.py`, raw CSVs
- Preconditions: Raw CSVs present and well-formed.
- Postcondition: `train_data/` and `test_data/` populated with 70/15/15 chronological splits (30-row warmup dropped per split).
- Main flow: The admin runs `python build_real_datasets.py`, the script reads raw CSVs, cleans and aligns them to a daily grain, splits chronologically 70/15/15, drops 30 warmup rows per split to avoid leakage, and writes the final canonical CSVs to `train_data/` and `test_data/`.
- Alternative flow: Missing-date gaps are logged and the build fails fast when gaps exceed a configured threshold; schema drift in a raw CSV (renamed/missing column) is surfaced with the offending column so the loader can be updated.

sequenceDiagram
    actor Adm
    participant Build as build_real_datasets.py
    participant Raw as Raw Data/
    participant Out as train_data/, test_data/
    Adm->>Build: run
    Build->>Raw: read CSVs
    Build->>Build: clean, splits 70/15/15 chronological, drop 30 warmup rows per split
    Build->>Out: write daily train/val/test CSVs


Pattern: ETL Pipeline, Builder (assembling final canonical dataset).

29. UC-ADM-3 — Integrate BMKG Weather
- Goal: Join daily BMKG weather observations into the canonical datasets.
- Primary actor: Trainer
- Secondary actors: `integrate_bmkg.py`, raw BMKG CSV
- Preconditions: Train/test CSVs exist; BMKG CSV covers overlapping dates.
- Postcondition: Train/test CSVs include `Avg_Temp` and `Rainfall` columns.
- Main flow: The admin runs `python integrate_bmkg.py`, the script loads daily BMKG weather observations, joins them onto the train and test CSVs on `Date`, and writes the enriched files back in place with `Avg_Temp` and `Rainfall` columns.
- Alternative flow: BMKG date gaps are filled per a documented policy (forward-fill or flagged); if BMKG renames columns the script's internal adapter must be updated to map the new names back to the canonical schema before the join.

sequenceDiagram
    actor Adm
    participant Itg as integrate_bmkg.py
    participant BMKG as Raw BMKG CSV
    participant Train as train_data/test_data
    Adm->>Itg: run
    Itg->>BMKG: load Avg_Temp, Rainfall daily
    Itg->>Train: join on Date
    Itg->>Train: write enriched CSVs


Pattern: Adapter (BMKG schema → canonical), ETL stage.

30. UC-ADM-4 — Tag Train/Val/Test in CSV (proposed)
- Goal: Make the train/val/test split a first-class column so `/api/metrics?split=...` is honest.
- Primary actor: Trainer
- Secondary actors: `hybrid_model.py` (post-update)
- Preconditions: Pipeline produces train/val/test predictions.
- Postcondition: `dataset_daily_with_predictions.csv` has a `Split` column, sorted by Date.
- Main flow: After the hybrid pipeline refit, the script tags each subset with `train_df["Split"] = "train"`, `val_df["Split"] = "val"`, and `test_df["Split"] = "test"`, concatenates them, sorts by `Date`, and writes the unified CSV so `/api/metrics?split=...` can filter the predictions slice honestly.
- Alternative flow: A sanity check that finds overlapping dates between splits aborts the write so downstream metrics aren't corrupted; legacy consumers that depend on column order continue to work because the new `Split` column is appended at the end of the schema.

sequenceDiagram
    actor Adm
    participant CLI as hybrid_model.py (post-update)
    participant Out as dataset_daily_with_predictions.csv
    Adm->>CLI: run
    CLI->>CLI: train_df["Split"]="train"; val_df["Split"]="val"; test_df["Split"]="test"
    CLI->>Out: concat + sort by Date + save with Split column
    Note over Out: Backend /api/metrics?split=test then filters honestly


Pattern: Tagging / Discriminator column, Source-of-truth at training time.

31. Summary — Pattern × Use Case Matrix
Pattern
Use Cases
Server-side Proxy
UC-DASH-1, UC-FCST-1, UC-WI-1, UC-ANO-1, UC-FEAT, UC-METR
Adapter
UC-DASH-1, UC-FCST-1, UC-WI-1, UC-ANO-1 (api.ts), UC-AUTH-1/2 (prismaAdapter), UC-ADM-3 (BMKG)
Singleton
UC-AUTH-* (Prisma client, Better Auth), UC-* (model_store at backend)
Facade
UC-DASH-1 (useDashboardData), UC-AUTH-* (auth-client), backend routes/ over services/
Composite
UC-FCST-1, UC-WI-1 (Prophet + LGBM residual + IsoForest)
Pipeline / Chain
UC-AUTH-5 (middleware), UC-ADM-1 (training), UC-ADM-2 (ETL)
Strategy
UC-FCST-3 (horizon preset/custom), UC-ANO-2 (severity filter), UC-ADM-1 (Optuna study), UC-METR (split filter)
Mediator
UC-FCST-5 (chart ↔ what-if via view), UC-DASH-4 (chart ↔ explainer)
Observer
UC-AUTH-4 (useSession), UC-LAND-2 (auth-aware navbar), UC-* (React state)
Template Method
UC-ADM-1 (fit-on-train, apply-on-val/test)
Memento
UC-LAND-1 (HOME rotation snap-back), UC-ADM-1 (best_hybrid_params.jsonx)
Caching / Flyweight
UC-WI-1 (TreeExplainer reused), UC-LAND-2 (useSession cached)
Container / Presenter
Hampir semua view (*-view.tsx vs feature components)
Controlled Component
UC-DASH-3, UC-FCST-2, UC-FCST-5
Command
UC-AUTH-3 (sign out), UC-DASH-5 (refresh), UC-WI-1 (run scenario)
Guard Clause
UC-AUTH-5 (proxy.ts), UC-FCST-2 (date bounds disabled state)


Mau dijadiin file docs/architecture.md di repo, atau diagram dipisah per file (.mmd) biar gampang di-edit?

