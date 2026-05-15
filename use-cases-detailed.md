# Castricity — Spesifikasi Use Case (Detail)

Format per use case: Goal, Primary actor, Secondary actors, Preconditions, Postcondition, Main flow, Alternate flows.

---

## UC-AUTH-1 — Sign Up

**Goal:** Membuat akun operator baru agar user bisa mengakses dashboard yang terproteksi.
**Primary actor:** User baru (calon Operator)
**Secondary actors:** Layanan Better Auth, Prisma ORM, PostgreSQL, cookie store browser
**Preconditions:**
- Aplikasi bisa diakses dan route `/sign-up` ter-render
- Env var `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` sudah di-set
- Postgres punya tabel `user`, `account`, `session` (sudah di-migrate)
- Email belum pernah terdaftar

**Postcondition:** Row `user`, row `account` (dengan password ter-hash), dan row `session` aktif sudah ada; cookie `better-auth.session_token` di-set di browser; user di-redirect ke `/dashboard`.

**Main flow:**
1. User membuka `/sign-up`.
2. `sign-up/page.tsx` merender form (name, email, password).
3. User mensubmit kredensial yang valid.
4. Komponen memanggil `authClient.signUp.email({ name, email, password })` dari `src/lib/auth-client.ts`.
5. Client melakukan POST ke `/api/auth/sign-up/email`.
6. Catch-all handler `src/app/api/auth/[...all]/route.ts` meneruskan request ke `auth.handler`.
7. Better Auth memvalidasi payload, melakukan hash password, dan via `prismaAdapter` membuat row `user`.
8. `prismaAdapter` membuat row `account` yang menghubungkan user ke provider email-password dengan hash-nya.
9. Better Auth membuat row `session` dan mengirim header `Set-Cookie: better-auth.session_token=...`.
10. Response 200 kembali ke browser; cookie tersimpan.
11. `auth-client` resolve; form memanggil `router.push("/dashboard")`.
12. `src/proxy.ts` melihat cookie tersebut dan meloloskan navigasi.

**Alternate flows:**
- **A1 — Email sudah dipakai:** Better Auth mengembalikan 4xx dengan pesan error. Form menampilkan "Email already registered." User mengedit atau beralih ke Sign In.
- **A2 — Password lemah / email tidak valid:** Validasi Zod sisi-client menolak sebelum submit; error per-field ditampilkan.
- **A3 — DB tidak bisa dihubungi:** Prisma throw; handler mengembalikan 500. Form menampilkan pesan generik "Sign up failed, try again."
- **A4 — Cookie diblokir (3rd-party / Safari ITP):** Pengecekan middleware berikutnya gagal; user di-redirect ke `/sign-in?redirect=/dashboard` walaupun akun sudah ada.

---

## UC-AUTH-2 — Sign In

**Goal:** Mengautentikasi user yang sudah terdaftar dan memulai session.
**Primary actor:** User lama
**Secondary actors:** Better Auth, Prisma, Postgres
**Preconditions:**
- User punya row `account` yang sudah ada (sudah pernah sign up)
- Route `/sign-in` bisa diakses
- Belum ada cookie session yang valid (atau sudah expired)

**Postcondition:** Row `session` baru; cookie `better-auth.session_token` valid; user mendarat di `/dashboard` (atau tujuan query `redirect`).

**Main flow:**
1. User membuka `/sign-in?redirect=/dashboard` (query redirect bersifat opsional).
2. `sign-in/page.tsx` merender form.
3. User mensubmit email + password.
4. Komponen memanggil `authClient.signIn.email({ email, password })`.
5. POST `/api/auth/sign-in/email` masuk ke catch-all handler.
6. Better Auth mencari `account` via Prisma, memverifikasi password yang ter-hash.
7. Membuat row `session` dan men-set cookie.
8. Response 200; client resolve.
9. Form membaca `redirect` dari URL (default ke `/dashboard`) dan memanggil `router.push(redirect)`.
10. Proxy middleware meloloskannya.

**Alternate flows:**
- **A1 — Password salah:** Better Auth mengembalikan 401. Form menampilkan "Invalid credentials."
- **A2 — Email tidak dikenal:** 401 yang sama (tidak ada user enumeration). Pesan sama.
- **A3 — Akun di-lock / disabled:** (Future) Mengembalikan 403; form menampilkan pesan status.
- **A4 — Sudah terautentikasi:** Middleware memantulkan hit ke `/sign-in` menuju `/dashboard` sebelum form ter-render.

---

## UC-AUTH-3 — Sign Out

**Goal:** Mengakhiri session saat ini dan kembali ke landing publik.
**Primary actor:** User yang sudah login
**Secondary actors:** Better Auth, Prisma, cookie store browser
**Preconditions:**
- User sedang login (cookie valid + row `session`)
- Sidebar ter-render (mis. user berada di route group `(dashboard)`)

**Postcondition:** Row session di-invalidate; cookie dihapus; user mendarat di `/sign-in`; konsumen `useSession` re-render ke state unauthenticated.

**Main flow:**
1. User klik "Keluar" di `DashboardSidebar`.
2. Handler memanggil `authClient.signOut()` dari `auth-client.ts`.
3. Client melakukan POST ke `/api/auth/sign-out`.
4. Better Auth menginvalidate row session dan mengirim `Set-Cookie` yang menghapus token.
5. Promise resolve di client.
6. Sidebar memanggil `router.push("/sign-in")` lalu `router.refresh()` untuk membuang state server-component yang ter-cache.
7. Subscriber `useSession` yang aktif menerima `null` dan re-render (mis. Navbar landing berganti tombol).

**Alternate flows:**
- **A1 — Network failure:** `signOut()` reject. Tampilkan toast "Logout failed, try again." Session tetap valid.
- **A2 — Tab basi setelah logout di tab lain:** Aksi protected berikutnya 401; user dipantulkan ke `/sign-in` oleh middleware pada navigasi berikutnya.

---

## UC-AUTH-4 — Resolve Session (`useSession`)

**Goal:** Mengizinkan komponen apa pun melakukan conditional render berdasarkan status login, tanpa prop-drilling.
**Primary actor:** Komponen React mana pun (Navbar, Sidebar, CTA yang di-gate)
**Secondary actors:** Cache client Better Auth, endpoint `/api/auth/get-session`
**Preconditions:**
- Komponen adalah client component (`"use client"`)
- `auth-client.ts` dikonfigurasi dengan base URL yang benar

**Postcondition:** Komponen merender cabang yang benar (loading / signed-in / signed-out) dan tetap sinkron dengan perubahan auth ke depan (sign-in/out di tab lain via perubahan cookie).

**Main flow:**
1. Komponen memanggil `const { data, isPending } = useSession()`.
2. Hook mengecek cache in-memory-nya; pada panggilan pertama, men-fire `GET /api/auth/get-session`.
3. Handler membaca cookie, memvalidasi session di DB, mengembalikan `{ user, session }` atau `null`.
4. Hook menyimpan hasilnya; subscriber re-render.
5. Komponen membaca `isPending` → render skeleton; `data` → render UI authed; `!data` → render UI unauthed.
6. Hook melakukan re-validate saat fokus / interval (default Better Auth) dan men-push update ke subscriber.

**Alternate flows:**
- **A1 — Endpoint 401:** `data === null`. Komponen merender cabang unauthed.
- **A2 — Network error:** `data === undefined`, `error` di-set. Komponen mempertahankan data terakhir yang diketahui atau skeleton; UI non-critical.
- **A3 — Batas SSR:** Hook mengembalikan `{ data: undefined, isPending: true }` pada render server pertama; client meng-hydrate dengan value sebenarnya (dapat diterima; bukan hydration mismatch karena keduanya merender skeleton).

---

## UC-AUTH-5 — Route Protection (Middleware)

**Goal:** Mencegah user yang belum login mengakses halaman protected dan memantulkan user yang sudah login dari halaman auth.
**Primary actor:** Browser (event navigasi apa pun)
**Secondary actors:** Next.js Edge runtime, `src/proxy.ts`
**Preconditions:**
- `proxy.ts` terdaftar dengan `config.matcher` yang mencakup `/dashboard/*`, `/predict/*`, `/sign-in`, `/sign-up`
- Nama cookie Better Auth adalah `better-auth.session_token`

**Postcondition:** Request entah dilanjutkan (`NextResponse.next()`) atau di-rewrite ke tujuan yang benar (`/sign-in?redirect=...` atau `/dashboard`).

**Main flow:**
1. Browser melakukan navigasi (mis. `GET /dashboard`).
2. Edge runtime meng-invoke `proxy(request)`.
3. Middleware membaca `request.cookies.get("better-auth.session_token")`.
4. Jika prefix protected dan cookie tidak ada → `NextResponse.redirect("/sign-in?redirect=/dashboard")` (307).
5. Jika route auth dan cookie ada → `NextResponse.redirect("/dashboard")`.
6. Selain itu → `NextResponse.next()`.
7. Page ter-render; server component yang butuh user asli memanggil `auth.api.getSession({ headers })`.

**Alternate flows:**
- **A1 — Session expired, cookie masih ada:** Middleware meloloskan request (pengecekan cookie hanya berdasarkan kehadiran). `getSession` di server component mengembalikan `null` → page menanganinya secara eksplisit (mis. re-redirect atau empty state).
- **A2 — User punya nama cookie lama (setelah rotasi auth):** Diperlakukan sebagai tidak ada; di-redirect ke sign-in.
- **A3 — Aset publik di bawah prefix protected:** Matcher mengecualikan `_next/static`, gambar, dll.

---

## UC-LAND-1 — View Hero (Rotating Globe)

**Goal:** Menampilkan globe yang menarik secara visual berpusat di Indonesia untuk mengomunikasikan cakupan grid-monitoring produk ke pengunjung baru.
**Primary actor:** Pengunjung (anonim)
**Secondary actors:** CDN Natural Earth GeoJSON, d3-geo, canvas browser
**Preconditions:**
- Page `/` ter-render, `Hero` me-mount `RotatingEarth`
- Browser mendukung Canvas 2D
- Jaringan bisa menjangkau URL GeoJSON

**Postcondition:** Globe titik-titik tergambar di canvas hero, berpusat di Indonesia; user bisa drag untuk memutar; melepas drag menganimasikan kembali ke rotasi home.

**Main flow:**
1. Pengunjung membuka `/`.
2. `src/app/page.tsx` merender `Hero`, yang me-mount `RotatingEarth` (sebuah wrapper `<canvas>`).
3. `useEffect` menginisialisasi projeksi orthographic d3 sesuai ukuran canvas via `useElementSize`.
4. Komponen melakukan `fetch` `ne_110m_land.json` dan `ne_110m_admin_0_countries.json` secara paralel.
5. Saat data dimuat, komponen menghasilkan sampel titik di dalam polygon daratan (point-in-polygon).
6. Path d3 merender globe titik-titik satu kali (tanpa auto-rotate by default).
7. Listener mouse di-attach: `mousedown` mencatat awal; `mousemove` meng-update rotasi; `mouseup` memicu return ter-tween (`d3.timer`, ease-out cubic) ke rotasi HOME yang berpusat di Indonesia.

**Alternate flows:**
- **A1 — Fetch GeoJSON gagal:** Komponen merender fallback outline globe solid (atau canvas kosong). Page tetap bisa dipakai.
- **A2 — Perangkat touch:** Handler `touchstart/move/end` mencerminkan event mouse; rotasi terasa identik.
- **A3 — Preferensi reduced-motion:** Lewati tween; snap langsung ke HOME.
- **A4 — Canvas di-resize (window resize):** `useElementSize` memicu re-projeksi; titik di-resample.

---

## UC-LAND-2 — Auth-aware Navbar

**Goal:** Menampilkan CTA yang tepat pada nav marketing berdasarkan status auth, tanpa flicker.
**Primary actor:** Pengunjung
**Secondary actors:** `useSession`, Next router
**Preconditions:** Halaman `/` (atau route marketing publik mana pun); Navbar di-mount.

**Postcondition:** Navbar merender salah satu dari tiga state: skeleton (loading), "Go to Dashboard" (authed), atau "Sign In" + "Sign Up" (unauthed).

**Main flow:**
1. Komponen Navbar di-mount dan memanggil `useSession()`.
2. Selama `isPending` → render skeleton (menghindari flicker antara authed/unauthed).
3. Saat `data` adalah `{ user, session }` → render satu tombol "Go to Dashboard" yang link ke `/dashboard`.
4. Saat `data` adalah `null` → render tombol "Sign In" (→ `/sign-in`) dan "Sign Up" (→ `/sign-up`).
5. Jika pengunjung sign in/out di tab lain, `useSession` ter-update dan nav re-render tanpa reload.

**Alternate flows:**
- **A1 — Pengecekan session error:** Render state unauthed (default yang graceful).
- **A2 — Pengunjung membuka `/` dalam keadaan sudah login:** Skeleton tampil sekejap, lalu "Go to Dashboard" muncul. Pengunjung klik → dirutekan ke dashboard.

---

## UC-DASH-1 — Load Dashboard

**Goal:** Menghidrasi dashboard dengan empat sumber data yang dibutuhkan (history, forecast, anomalies, metrics) secepat mungkin.
**Primary actor:** Operator
**Secondary actors:** `useDashboardData`, route handler Next, backend FastAPI, `AbortController`
**Preconditions:**
- User lolos `UC-AUTH-5` (cookie ada)
- Env `BACKEND_URL` benar
- FastAPI sehat di keempat endpoint

**Postcondition:** `DashboardView` sudah berisi `history`, `future`, `anomalies`, `metrics`; HeroMetrics, ValidationCard, AnomalyStrip merender data nyata; tidak ada fetch in-flight yang tersisa setelah unmount.

**Main flow:**
1. User menavigasi ke `/dashboard`.
2. `(dashboard)/layout.tsx` membungkus page dengan `SidebarProvider` + `TooltipProvider` + sidebar.
3. `dashboard/page.tsx` merender `<DashboardView />`.
4. `DashboardView` memanggil `useDashboardData({ futureDays })`.
5. Hook membuat `AbortController` dan men-fire 4 fetch dalam `Promise.all`:
   - `getHistorical()` → `/api/forecast/historical`
   - `getFuture({ days, startDate: today })` → `/api/forecast/future`
   - `getAnomalies()` → `/api/anomalies`
   - `getMetrics({ split: "test" })` → `/api/metrics?split=test`
6. Setiap route handler Next meneruskan ke `BACKEND_URL/...` via `backend-proxy.ts`.
7. FastAPI merespons; schema Zod di `validations/api.ts` memvalidasi shape backend.
8. Adapter di `lib/api.ts` memetakan shape backend → domain internal (`{date, predicted}` → `{t, predicted, p10, p90}`).
9. Hook men-set state dalam satu batch; `isLoading` flip ke `false`.
10. `DashboardView` merender `HeroMetrics` (memakai `metrics`), `AnomalyStrip` (memakai `anomalies` + `history`), `ValidationCard` (memakai `history`).

**Alternate flows:**
- **A1 — Satu endpoint gagal (mis. anomalies 500):** Semantik `Promise.allSettled`; slice tersebut fallback ke `[]` dan banner error non-blocking muncul. Tile lain tetap render normal.
- **A2 — Semua endpoint gagal:** Hook memunculkan `error`; view merender tombol retry (`refresh()`).
- **A3 — User berpindah halaman saat fetch berlangsung:** Cleanup function memanggil `controller.abort()`; tidak ada state yang di-set pada komponen yang sudah unmount.
- **A4 — Backend mengembalikan shape yang gagal Zod:** Adapter throw, dimunculkan sebagai error; payload mentah di-log di server untuk debugging.

---

## UC-DASH-2 — View Hero Metrics

**Goal:** Memberikan ringkasan sekilas kepada operator tentang kondisi grid dan akurasi model di atas dashboard.
**Primary actor:** Operator
**Secondary actors:** `HeroMetrics`, `MetricTile`
**Preconditions:** `useDashboardData` sudah resolve dengan `metrics` dan `future`.

**Postcondition:** Satu baris tile terlihat: peak demand (dengan sparkline 24 jam), MAPE, MAE, RMSE, R², bias, hit-rate.

**Main flow:**
1. `DashboardView` mengoper `history`, `future`, `peak`, dan `metrics` ke `HeroMetrics`.
2. Komponen menghitung `peakHourSpark = future.slice(0, 24).map(p => p.predicted)`.
3. Merender `MetricTile` untuk peak demand (aksen cyan, sparkline aktif).
4. Merender `MetricTile` untuk MAPE, MAE, RMSE, R², bias, hit-rate (tanpa sparkline — ini stat kualitas yang statis).
5. Setiap tile menampilkan label, value, unit, delta opsional dibandingkan kemarin.

**Alternate flows:**
- **A1 — `metrics` bernilai null:** Tile menampilkan placeholder "—"; tooltip menyebut "metrics endpoint unavailable."
- **A2 — `future` kosong:** Sparkline dihilangkan; tile peak hanya menampilkan value.
- **A3 — MAPE > threshold (mis. > 15%):** Tile berubah amber untuk mendorong investigasi (visual saja, tanpa aksi).

---

## UC-DASH-3 — Filter Validation by Date Range

**Goal:** Mengizinkan operator memeriksa performa model pada window kustom tanpa memengaruhi metrik global.
**Primary actor:** Operator
**Secondary actors:** `DateRangePicker`, `ValidationCard`, helper skala `niceBounds`
**Preconditions:** Data history sudah dimuat; `DateRangePicker` ter-render di atas validation card.

**Postcondition:** `ValidationCard` re-render dengan `history` ter-slice ke `[from, to]`; brush reset ke `[0, 1]`; tile metrik TIDAK berubah (tetap test-set).

**Main flow:**
1. Operator membuka popover date range.
2. Memilih tanggal `from` dan `to` via shadcn Calendar (`mode="range"`).
3. `DateRangePicker.onChange(range)` ter-fire.
4. `DashboardView` menjalankan `setRange(range)` dan `setBrush([0, 1])` (reset zoom).
5. Sebuah `useMemo` menghitung ulang `filteredHistory = history.filter(p => p.t in range)`.
6. `ValidationCard` menerima slice yang difilter + bounds-nya.
7. `niceBounds` menghitung ulang skala Y; chart re-render.

**Alternate flows:**
- **A1 — Range di luar history yang tersedia:** `filteredHistory` kosong; chart menampilkan "No data in range."
- **A2 — `from > to`:** Picker menormalkan (menukar); klik pertama menyetel `from`, klik kedua menyetel `to`.
- **A3 — Operator membersihkan range:** Kembali ke full history.

---

## UC-DASH-4 — Inspect Historical Point (Explainer)

**Goal:** Saat sebuah titik terlihat tidak biasa, mengizinkan operator mengkliknya dan mendapatkan penjelasan actual vs predicted plus faktor pendorongnya.
**Primary actor:** Operator
**Secondary actors:** `ValidationChart`, `Explainer`, heuristik `pointExplainer`
**Preconditions:** `ValidationCard` ter-render dengan data history; hit-testing chart aktif.

**Postcondition:** `Explainer` menampilkan MWh aktual, MWh predicted, delta, dan daftar faktor pendorong untuk titik yang dipilih.

**Main flow:**
1. Operator hover `ValidationChart`; sorotan titik terdekat mengikuti kursor.
2. Operator klik sebuah titik.
3. `ValidationChart.onPointClick(p)` bubbling ke atas.
4. `DashboardView` menjalankan `setExplainPt({ t, actual, predicted, anomalyKey: null })`.
5. `Explainer` mount/update dengan titik yang baru.
6. Explainer pertama mencoba `point.data.factors` (SHAP yang dilampirkan server) → langsung render.
7. Jika tidak ada, fallback ke `lib/dashboard/data.ts:ANOMALY_DETAILS[anomalyKey]` untuk narasi hardcoded.
8. Jika tetap tidak ada, memanggil `pointExplainer(point)` untuk menginferensi faktor dari hour-of-day, day-of-week, cuaca, residual.
9. Merender headline (delta vs predicted), bar faktor, dan deskripsi singkat.

**Alternate flows:**
- **A1 — Titik tidak punya SHAP dan tidak punya key:** Jalur heuristik digunakan; UI memberi label "inferred."
- **A2 — Operator mengklik titik lain dengan cepat:** Pemilihan terbaru menang; Explainer sebelumnya unmount.
- **A3 — Titik berada di range future:** Explainer di-disable atau menampilkan "Predicted only — no actual yet."

---

## UC-DASH-5 — Refresh Data

**Goal:** Menarik data segar tanpa full page reload (mis. setelah update backend yang diketahui).
**Primary actor:** Operator
**Secondary actors:** `DashboardTopbar`, `useDashboardData.refresh`
**Preconditions:** Dashboard sudah dimuat minimal sekali.

**Postcondition:** Keempat dataset di-fetch ulang; spinner menunjukkan progres; data lama tetap terlihat sampai payload baru tiba (rasa stale-while-revalidate).

**Main flow:**
1. Operator klik tombol refresh di `DashboardTopbar`.
2. Topbar memanggil `refresh()` dari hook.
3. Hook flip `isRefreshing = true` dan memulai `fetchAll(signal, isRefresh=true)` baru.
4. Spinner menggantikan ikon pada tombol.
5. Saat sukses, state di-replace secara atomik; `isRefreshing = false`.

**Alternate flows:**
- **A1 — Refresh saat fetch awal masih berjalan:** Controller sebelumnya di-abort; fetch baru menggantikan.
- **A2 — Refresh gagal:** Toast "Refresh failed"; data sebelumnya tetap.

---

## UC-FCST-1 — Load Multi-Horizon Forecast

**Goal:** Menampilkan demand prediksi kepada operator untuk horizon yang dipilih, dengan confidence band.
**Primary actor:** Operator
**Secondary actors:** `ForecastView`, `lib/api.getFuture`, FastAPI (Prophet + LightGBM)
**Preconditions:** User di `/forecast`; horizon dan start date sudah di-set di state (default: 30 hari, hari ini).

**Postcondition:** `MultiHorizonChart` merender garis predicted dan (jika diaktifkan) confidence band.

**Main flow:**
1. Operator menavigasi ke `/forecast`.
2. `forecast/page.tsx` merender `ForecastView`.
3. `useEffect` memantau `{ horizon, startDate }` dan memanggil `getFuture({ days: horizon, startDate })`.
4. Adapter melakukan request `/api/forecast/future?days=N&start_date=YYYY-MM-DD`.
5. Backend menghasilkan baseline Prophet + residual LightGBM; menjumlahkan untuk `predicted`; mengeluarkan `lower_bound`/`upper_bound`.
6. Adapter memetakan `{date, predicted, lower_bound, upper_bound}` → `{t, predicted, p10, p90}`.
7. Chart render.

**Alternate flows:**
- **A1 — Horizon terlalu besar (mis. > 730):** UI clamp dan menampilkan hint.
- **A2 — Backend mengembalikan baris lebih sedikit dari yang diminta:** Chart merender apa yang tersedia; subtitle mencatat partial coverage.
- **A3 — Network error:** Skeleton loading → pesan error dengan retry.

---

## UC-FCST-2 — Pick Forecast Start Date

**Goal:** Memindahkan anchor window forecast ke start date pilihan.
**Primary actor:** Operator
**Secondary actors:** shadcn `Calendar`, `ForecastView`
**Preconditions:** Forecast view di-mount; start date default ke hari ini.

**Postcondition:** Forecast di-fetch ulang mulai dari tanggal yang dipilih; chart re-render.

**Main flow:**
1. Operator klik kontrol start date.
2. Popover Calendar membuka; operator memilih tanggal.
3. `setStartDate(d)` ter-fire.
4. `useEffect` re-run dan re-fetch `getFuture({ days, startDate: d })`.
5. Chart update.

**Alternate flows:**
- **A1 — Tanggal lampau dipilih:** Diizinkan; backend mengembalikan prediksi hindsight jika tersedia; jika tidak, series kosong/pendek.
- **A2 — Tanggal jauh ke depan melampaui horizon model:** Backend cap; UI menampilkan range yang sebenarnya dipakai.

---

## UC-FCST-3 — Change Horizon

**Goal:** Berganti antara preset planning window atau menentukan horizon kustom.
**Primary actor:** Operator
**Secondary actors:** `Select` (preset), `Input` (kustom), `ForecastView`
**Preconditions:** Forecast view di-mount.

**Postcondition:** Horizon baru diterapkan; forecast di-fetch ulang.

**Main flow:**
1. Operator membuka `Select` horizon dan memilih 7/30/90/180/365/730 — ATAU — memilih "Custom" dan mengetik integer positif.
2. `setHorizon(n)` ter-fire.
3. `useEffect` memicu `getFuture({ days: n, startDate })`.
4. Chart re-render.

**Alternate flows:**
- **A1 — Input kustom non-numeric:** Field menampilkan error validasi; fetch tidak dipicu.
- **A2 — Input nol / negatif:** Sama — ditolak di sisi client.

---

## UC-FCST-4 — Toggle Confidence Band

**Goal:** Mengizinkan operator membersihkan tampilan chart saat hanya perlu forecast tengah.
**Primary actor:** Operator
**Secondary actors:** `Switch`, `MultiHorizonChart`
**Preconditions:** Forecast sudah dimuat; data band (`p10`/`p90`) tersedia.

**Postcondition:** Path band ditampilkan/disembunyikan; tidak ada yang lain berubah.

**Main flow:**
1. Operator men-toggle switch "Confidence band".
2. `setShowBand(b)` ter-fire.
3. Chart menerima `showBand={b}` dan conditional render path SVG band.

**Alternate flows:**
- **A1 — Data band tidak tersedia:** Switch disabled dengan tooltip "Band unavailable for this horizon."

---

## UC-FCST-5 — Click Day → Lock for What-if

**Goal:** Mengisi panel what-if dengan tanggal yang dipilih langsung dari chart.
**Primary actor:** Operator
**Secondary actors:** `MultiHorizonChart`, `WhatIfPanel`
**Preconditions:** Forecast sudah dimuat; chart ter-render.

**Postcondition:** `WhatIfPanel.selectedDate` mencerminkan hari yang diklik; operator sekarang bisa menyesuaikan input skenario terhadapnya.

**Main flow:**
1. Operator hover sebuah titik dan klik.
2. Chart men-fire `onSelect(point)`.
3. `ForecastView` menjalankan `setSelected(point)`.
4. `WhatIfPanel` re-render dengan `selectedDate={point.t}` sebagai controlled prop.

**Alternate flows:**
- **A1 — Operator mengklik titik yang sama dua kali:** Tidak ada perubahan state.
- **A2 — Operator mengubah horizon saat sebuah titik terkunci:** Tanggal terkunci tetap jika masih dalam range; jika tidak, dihapus.

---

## UC-FCST-6 — Hover Day → Tooltip

**Goal:** Menampilkan value predicted (dan bounds) saat hover.
**Primary actor:** Operator
**Secondary actors:** `MultiHorizonChart`
**Preconditions:** Chart ter-render.

**Postcondition:** Tooltip menampilkan date, predicted, p10, p90 di dekat kursor.

**Main flow:**
1. Operator menggerakkan mouse di atas chart.
2. Komponen menjalankan scan linier untuk menemukan titik terdekat di ruang pixel.
3. `setHover(nearest)`.
4. Sebuah tooltip `<foreignObject>` diposisikan di sebelah kursor.

**Alternate flows:**
- **A1 — Kursor keluar dari chart:** `setHover(null)`; tooltip disembunyikan.
- **A2 — Perangkat touch:** Tap menampilkan tooltip; tap kedua menghapus.

---

## UC-WI-1 — Run What-if Scenario

**Goal:** Mengestimasi demand di bawah skenario cuaca/holiday hipotetis dan menunjukkan kontribusi tiap input.
**Primary actor:** Operator (planner)
**Secondary actors:** `WhatIfPanel`, `lib/api.runWhatIf`, FastAPI (Prophet + LightGBM + SHAP TreeExplainer)
**Preconditions:**
- Forecast view sudah dimuat
- Target date sudah dipilih (manual atau via UC-FCST-5)
- SHAP TreeExplainer tersedia di backend

**Postcondition:** Tiga result tile (predicted MWh, baseline, delta) dan bar chart faktor SHAP ditampilkan.

**Main flow:**
1. Operator memasukkan `avg_temp`, `rainfall`, men-toggle `is_holiday`, mengonfirmasi `target_date`.
2. Klik "Run".
3. `runWhatIf` men-slice tanggal ke `YYYY-MM-DD` dan POST `/api/forecast/whatif`.
4. Backend menghitung baseline Prophet, residual LightGBM, menjumlahkan untuk `predicted_mwh`.
5. SHAP TreeExplainer menghitung kontribusi per-fitur.
6. Response: `{ predicted_mwh, prophet_baseline, lgbm_residual, base_value, shap_contributions }`.
7. Adapter memetakan ke `{ predicted, baseline, delta, factors[] }`.
8. Panel merender tiga tile plus bar faktor (positif ke kanan, negatif ke kiri).

**Alternate flows:**
- **A1 — Input di luar range yang masuk akal:** Validasi Zod sisi-client menolak (mis. temp > 45°C); error ditampilkan.
- **A2 — SHAP tidak tersedia:** Backend mengembalikan prediksi tanpa kontribusi; panel menampilkan tile saja dengan catatan.
- **A3 — Target date melampaui horizon model:** Backend clamp dan mencatat di response; UI menampilkan warning.

---

## UC-ANO-1 — List Anomalies

**Goal:** Menampilkan anomali yang dideteksi backend dalam tabel yang mudah di-scan.
**Primary actor:** Operator
**Secondary actors:** `AnomalyCenterView`, `useDashboardData`, FastAPI
**Preconditions:** User di `/anomaly-center`.

**Postcondition:** Tile ringkasan + tabel ter-paginate terisi.

**Main flow:**
1. Operator membuka `/anomaly-center`.
2. View memanggil `useDashboardData({ historyHours, futureDays: 1 })`.
3. Hook men-fetch `/api/anomalies`.
4. Adapter memetakan baris mentah (`{date, value, severity, score, deviation_pct}`) → `AnomalyEntry` (mensintesis title, asset, factors).
5. View merender tile (total, critical, last 24h) + tabel.

**Alternate flows:**
- **A1 — Tidak ada anomali pada window:** Tabel menampilkan empty state; semua tile membaca 0.
- **A2 — Backend mati:** Banner error + retry.

---

## UC-ANO-2 — Filter by Severity

**Goal:** Mempersempit tabel ke satu severity untuk fokus triage.
**Primary actor:** Operator
**Secondary actors:** `Select`, `AnomalyCenterView`
**Preconditions:** Anomali sudah dimuat.

**Postcondition:** Tabel dan tile hanya mencerminkan severity yang dipilih; pagination reset ke page 1.

**Main flow:**
1. Operator memilih severity di `Select`.
2. `setSev(s)` ter-fire.
3. `useEffect` menjalankan `setPage(1)`.
4. `filtered = anomalies.filter(...)` yang ter-memo dihitung ulang.
5. Tile + tabel re-render.

**Alternate flows:**
- **A1 — Severity menghasilkan nol baris:** Empty state dengan tombol clear filter.

---

## UC-ANO-3 — Change Time Window

**Goal:** Mengubah cakupan view ke window terbaru yang berbeda (24h, 3d, 7d, 30d).
**Primary actor:** Operator
**Secondary actors:** `useDashboardData`
**Preconditions:** Anomaly center di-mount.

**Postcondition:** Anomali di-fetch ulang untuk window baru; tile dan tabel mencerminkan data baru.

**Main flow:**
1. Operator memilih preset window.
2. `setHistoryHours(h)`.
3. `useDashboardData` re-run (`historyHours` ada di deps).
4. Hook men-fetch slice baru; view update.

**Alternate flows:**
- **A1 — Backend lambat:** Skeleton/spinner muncul sementara data lama tetap terlihat.

---

## UC-ANO-4 — Paginate Table

**Goal:** Menelusuri daftar anomali yang panjang 10 baris per halaman.
**Primary actor:** Operator
**Secondary actors:** `AnomalyCenterView`
**Preconditions:** > 10 anomali setelah filter.

**Postcondition:** Tabel menampilkan halaman yang diminta.

**Main flow:**
1. Operator klik next/prev.
2. `setPage(p)`.
3. `paginated = filtered.slice((p-1)*10, p*10)`.
4. Tabel merender slice.

**Alternate flows:**
- **A1 — Perubahan filter mengecilkan list:** Page reset ke 1 (lihat UC-ANO-2).
- **A2 — Halaman terakhir tidak penuh:** Merender sisa < 10 baris.

---

## UC-ANO-5 — View Anomaly Detail

**Goal:** Mendalami satu anomali untuk melihat severity, deviation, dan faktor gaya SHAP.
**Primary actor:** Operator
**Secondary actors:** `Dialog`, bar faktor
**Preconditions:** Anomali sudah dimuat.

**Postcondition:** Modal dialog terbuka dengan konten detail untuk baris yang dipilih.

**Main flow:**
1. Operator klik sebuah baris.
2. `setSelected(anomaly)`.
3. `Dialog` membuka dengan anomali: badge severity, delta, bar faktor, deskripsi.
4. Operator menutup dialog (Esc, klik overlay, atau tombol).

**Alternate flows:**
- **A1 — Anomali tidak punya factors:** Dialog menampilkan "factors unavailable" tapi tetap menampilkan severity dan delta.
- **A2 — Operator membuka anomali lain:** Mengganti konten dialog; tanpa flicker.

---

## UC-FEAT-* — Feature Metadata Endpoints

**Goal:** Mengekspos schema 18 fitur kanonikal (nama, required-ness, importance) ke frontend.
**Primary actor:** Frontend developer / UI lanjutan (feature inspector)
**Secondary actors:** Next proxy, FastAPI
**Preconditions:** Backend sudah memuat feature registry.

**Postcondition:** Caller memiliki list fitur yang ter-typed + metadata.

**Main flow:**
1. UI (atau tooling) memanggil `getFeatures()`, `getRequiredFeatures()`, atau `getFeatureImportance()`.
2. Tiap helper hit `/api/features`, `/api/features/required`, `/api/features/importance`.
3. Proxy meneruskan ke FastAPI.
4. Backend membaca schema kanonikal dan mengembalikannya.

**Alternate flows:**
- **A1 — Schema mismatch:** Adapter mencatat payload mentah; Zod throw.

---

## UC-METR-1/2 — Metrics with Split

**Goal:** Menyediakan metrik kualitas test-set yang tetap dan jujur (MAPE, MAE, RMSE, R²) untuk HeroMetrics.
**Primary actor:** Operator (tidak langsung; dikonsumsi oleh HeroMetrics)
**Secondary actors:** FastAPI, CSV prediksi
**Preconditions:** `dataset_daily_with_predictions.csv` punya kolom `Split` (UC-ADM-4).

**Postcondition:** Caller mendapat `{mae, rmse, mape, r2, n_samples}` untuk split yang diminta.

**Main flow:**
1. UI memanggil `getMetrics({ split: "test" })`.
2. Proxy meneruskan `/api/metrics?split=test`.
3. Backend memuat CSV, memfilter dengan `Split == "test"`, menghitung metrik, mengembalikan JSON.

**Alternate flows:**
- **A1 — Split tidak ada atau kosong:** Backend mengembalikan 4xx dengan alasan; UI menampilkan "—".
- **A2 — `split=val` atau `split=train` diminta:** Jalur yang sama; mengembalikan metrik untuk slice tersebut.

---

## UC-ADM-1 — Retrain Hybrid Pipeline (offline)

**Goal:** Menghasilkan set artefak model baru (Prophet, LightGBM, Isolation Forest) yang dioptimasi Optuna.
**Primary actor:** Data Scientist / Trainer
**Secondary actors:** Optuna, Prophet, LightGBM, Isolation Forest, KNNImputer
**Preconditions:**
- `train_data/` dan `test_data/` sudah up-to-date (UC-ADM-2, UC-ADM-3)
- Env Python punya semua lib; env `OPTUNA_TRIALS` di-set
- Disk cukup untuk `Models/*.joblib` dan `Outputs/*.csv`

**Postcondition:** Artefak joblib baru di `Models/`; CSV prediksi di `Outputs/`; `best_hybrid_params.json` ter-update.

**Main flow:**
1. Admin menjalankan `python Scripts/hybrid_model.py`.
2. Script memuat CSV train + test.
3. Fit `KNNImputer` hanya pada train.
4. Menjalankan joint Optuna study atas `(contamination, prophet_priors, lgbm_params)`.
5. Tiap trial: Isolation Forest memfilter anomali, Prophet fit baseline pada train yang sudah dibersihkan, LightGBM fit residual.
6. Best params ditulis ke `best_hybrid_params.json`.
7. Model champion di-refit pada full train menggunakan best params.
8. Prediksi untuk train/val/test ditulis ke satu CSV; joblib dipersist.

**Alternate flows:**
- **A1 — Trial exception:** Optuna mencatat dan skip; study lanjut.
- **A2 — Out-of-memory:** Kurangi `OPTUNA_TRIALS` atau sample frequency; rerun.
- **A3 — Champion lebih buruk dari sebelumnya:** Admin mempertahankan artefak lama (gate manual).

---

## UC-ADM-2 — Rebuild Datasets

**Goal:** Meregenerasi dataset harian train/val/test kanonikal dari sumber mentah.
**Primary actor:** Trainer
**Secondary actors:** `build_real_datasets.py`, CSV mentah
**Preconditions:** CSV mentah tersedia dan well-formed.

**Postcondition:** `train_data/`, `test_data/` terisi dengan split kronologis 70/15/15 (30 baris warmup di-drop per split).

**Main flow:**
1. Admin menjalankan `python build_real_datasets.py`.
2. Script membaca CSV mentah, membersihkan, menyelaraskan ke granularitas harian.
3. Membagi secara kronologis 70/15/15.
4. Men-drop 30 baris warmup per split.
5. Menulis CSV harian final.

**Alternate flows:**
- **A1 — Tanggal hilang / ada gap:** Script mencatat gap; fail fast jika gap melampaui threshold.
- **A2 — Schema drift di CSV mentah:** Script error dengan kolom yang bermasalah.

---

## UC-ADM-3 — Integrate BMKG Weather

**Goal:** Menggabungkan observasi cuaca harian BMKG ke dalam dataset kanonikal.
**Primary actor:** Trainer
**Secondary actors:** `integrate_bmkg.py`, CSV BMKG mentah
**Preconditions:** CSV train/test sudah ada; CSV BMKG mencakup tanggal yang overlap.

**Postcondition:** CSV train/test sekarang punya kolom `Avg_Temp` dan `Rainfall`.

**Main flow:**
1. Admin menjalankan `python integrate_bmkg.py`.
2. Script memuat cuaca harian BMKG.
3. Join pada `Date` terhadap CSV train dan test.
4. Menulis CSV yang sudah diperkaya in-place.

**Alternate flows:**
- **A1 — Gap tanggal di BMKG:** Hari yang hilang di-forward-fill (atau diberi flag) sesuai policy yang didokumentasikan.
- **A2 — Kolom BMKG diganti nama:** Adapter di dalam script perlu update.

---

## UC-ADM-4 — Tag Train/Val/Test in CSV (proposed)

**Goal:** Membuat split train/val/test menjadi kolom first-class supaya `/api/metrics?split=...` jujur.
**Primary actor:** Trainer
**Secondary actors:** `hybrid_model.py` (post-update)
**Preconditions:** Pipeline hybrid menghasilkan prediksi train/val/test.

**Postcondition:** `dataset_daily_with_predictions.csv` punya kolom `Split` (`train`/`val`/`test`) dan ter-sort by Date.

**Main flow:**
1. Setelah refit, script menandai DataFrame tiap subset: `train_df["Split"] = "train"` dll.
2. Concat dan sort by Date.
3. Menulis CSV.
4. Backend `/api/metrics?split=test` sekarang memfilter pada kolom ini.

**Alternate flows:**
- **A1 — Tanggal overlap antar split:** Sanity check raise; script abort.
- **A2 — Konsumen lama mengharapkan tanpa kolom Split:** Tambahkan kolom di akhir schema untuk menjaga asumsi urutan kolom.

---
