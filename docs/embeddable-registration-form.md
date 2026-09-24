# Embeddable registration form (iframe)

## Context

Camps can already be viewed and registered for anonymously — `GET /camps/:campId`
and `POST /camps/:campId/registrations` carry no `auth()` guard
(`backend/src/app/camp/camp.routes.ts:33-37`,
`backend/src/app/registration/registration.routes.ts:43-52`). The goal is to let
an organization embed a single camp's registration page (`CampPage.vue`) in an
`<iframe>` on their own website, showing only the camp + form, with no login and
no app chrome.

Two things currently make that impossible:

1. **Framing is blocked.** `helmet()` is mounted with defaults in
   `backend/src/app.ts:22`, which send `X-Frame-Options: SAMEORIGIN` and a CSP
   `frame-ancestors 'self'` on every response — browsers refuse to render the
   page in a third-party frame at all.
2. **The CSRF cookie can't survive being framed.** `secureCookieOptions()`
   (`backend/src/utils/cookie.ts:26`) hardcodes `sameSite: 'strict'` for the
   double-submit CSRF cookie (`backend/src/middlewares/csrf.middleware.ts`),
   which is applied globally to every `/api/v1` route including the anonymous
   registration POST (`backend/src/routes/api.ts:37`). Inside a cross-site
   iframe, the browser treats the iframe's own requests as cross-site (it
   compares against the *top-level* site, not the iframe's own origin), so a
   `SameSite=Strict` cookie is dropped and every registration POST would 403.

This plan fixes both, scoped per-camp (not a blanket relaxation), and reuses the
existing anonymous-registration flow, the `X-Client-Type` CSRF-exemption
pattern, and the settings-page pattern already in the codebase.

## 1. Data model — per-camp allowed embedding origins

- `backend/prisma/schema.prisma`: add `embedAllowedOrigins Json @default("[]")`
  (`/// ![string[]]` comment, matching the `countries` field convention) to
  `model Camp`. Create the migration with `prisma migrate dev` (additive,
  nullable-safe default, no backfill needed).
- `common/src/entities/Camp.ts`: add `embedAllowedOrigins: string[]` to the
  `Camp` interface (it flows automatically into `CampCreateData`/`CampUpdateData`
  via the existing `Omit`/`Partial` derivations).
- `backend/src/app/camp/camp.resource.ts`: add `embedAllowedOrigins:
  this.data.embedAllowedOrigins` to `CampResource.transform()`. It's not
  sensitive (just hostnames) so it can ride the existing single resource used
  for both public and manager views — no new field-visibility mechanism needed.
- `backend/src/app/camp/camp.validation.ts`: add
  `embedAllowedOrigins: z.array(z.url()).optional()` to both `store` and
  `update` schemas (validate each entry parses as an absolute URL/origin).
- Empty array = embedding disabled (safe default); the camp manager must
  explicitly opt in by adding at least one origin.

## 2. Backend — per-camp `frame-ancestors`, no blanket CSP change

Disable helmet's own framing header and drive `frame-ancestors` explicitly so
the default (non-embed) behavior is preserved everywhere except the one new
route:

- `backend/src/app.ts`: change `app.use(helmet())` to
  `app.use(helmet({ frameguard: false }))`, and add a small middleware mounted
  right after it that sets `Content-Security-Policy: frame-ancestors 'self'` by
  default for every response (replicates today's effective behavior once
  `frameguard` is off).
- Add a new route, e.g. `GET /embed/camps/:campId`, mounted in
  `backend/src/routes/static.ts` **before** the generic `express.static`/catch-all
  handlers. Handler:
  1. Parse `campId` (400 on invalid ULID).
  2. Look up the camp via the existing `CampService.getCampById` (already
     injected/used in `camp.routes.ts`); 404 if missing.
  3. If `camp.embedAllowedOrigins` is empty, respond
     `Content-Security-Policy: frame-ancestors 'none'` (embedding not enabled —
     fails closed) and still serve the SPA shell so the frontend can render a
     "this camp is not available for embedding" state, matching the existing
     `registrationFormVisible`/unavailable pattern in `CampPage.vue`.
  4. Otherwise overwrite the CSP header for this response only:
     `Content-Security-Policy: frame-ancestors 'self' <origin1> <origin2> ...`.
  5. `res.sendFile(path.resolve(spaPath, 'index.html'))` — same SPA bundle as
     every other route; only the header differs.
- No CORS change: the iframe's `src` always points at the app's own origin
  (`APP_URL`), so API calls made by the embedded page are same-origin from the
  browser's perspective — `cors({ origin: config.origin })` in `app.ts:41-45`
  is untouched.

## 3. Backend — CSRF exemption for the embed client

`isCsrfExempt` (`backend/src/middlewares/csrf.middleware.ts:58-65`) already
exempts any request whose `X-Client-Type` header is present and not `'web'`,
specifically because a cross-site attacker cannot attach a custom header to a
credentialed cross-origin request without triggering a CORS preflight that the
server's single-origin allowlist rejects — the same reasoning applies to embed
traffic, since the embedded page is served from the app's own origin regardless
of which site frames it.

- Add an explicit `EMBED_CLIENT_TYPE = 'embed'` constant next to
  `WEB_CLIENT_TYPE` for clarity/observability (logs, future auditing), but keep
  the existing "anything not `web`" branch — no functional change required
  beyond the frontend sending the new header value.
- No per-camp origin check is needed at the CSRF layer: the `frame-ancestors`
  allowlist from step 2 is what gates *where* the page can be framed; CSRF
  exemption only concerns whether this same-origin script can call its own API.

## 4. Frontend — embed route + minimal layout

`CampPage.vue` (`frontend/src/pages/camps/CampPage.vue`) already contains no
chrome itself — the header/footer/brand/profile-menu/back-button live entirely
in `CampLayout.vue`. So the embed just needs a different layout wrapping the
same page component:

- `frontend/src/router/routes.ts`: add
  ```ts
  {
    path: '/embed/camps/:campId',
    component: () => import('@/layouts/EmbedLayout.vue'),
    children: [
      { path: '', name: 'embed.camp', component: () => import('@/pages/camps/CampPage.vue') },
    ],
  }
  ```
- New `frontend/src/layouts/EmbedLayout.vue`: bare `q-layout` with just a
  `<router-view>` — no header, footer, brand, locale switch, or profile menu.
  Also owns:
  - **Locale override**: read `route.query.locale` once on mount and apply it
    via the existing i18n locale mechanism (there's no `LocaleSwitch` button in
    this layout, so the host page must be able to set the language via the
    iframe URL).
  - **Auto-resize**: a `ResizeObserver` on the root element that posts
    `window.parent.postMessage({ source: 'camp-registration-embed', height }, '*')`
    on size changes, so host pages can size the `<iframe>` to fit content
    instead of showing internal scrollbars. Ship a short host-side snippet
    (e.g. `backend/public/embed.js`, served as static content) that listens for
    this message and resizes the matching `<iframe>` — document the snippet
    here for organizations to copy into their site once written.
- `PrivacyNoticeDisclosure.vue` already opens both the platform-privacy-policy
  and permanent-camp-privacy-link with `target="_blank"`
  (`frontend/src/components/privacy/PrivacyNoticeDisclosure.vue:64,83`), so
  those links break out of the iframe safely as-is — no change needed there.

## 5. Frontend — API client sends the embed client type

- `frontend/src/services/api.ts`: instead of the hardcoded
  `api.defaults.headers.common['X-Client-Type'] = 'web'`, detect embed context
  (e.g. `window.location.pathname.startsWith('/embed/')`) at module init and
  set `'embed'` instead.
- `frontend/src/services/csrfTokenRetry.ts`: the priming interceptor
  (lines 60-82) tries to fetch a CSRF token before the first mutating request.
  For embed traffic this is pointless (exempted server-side) and the token
  bootstrap call itself sets a `SameSite=Strict` cookie that won't round-trip
  in a framed context anyway. Skip priming when the client type is `'embed'`
  (short-circuit at the top of the interceptor, same place `SAFE_METHODS` is
  checked).

## 6. Frontend — settings UI to manage allowed origins

Follow the existing settings-page pattern
(`frontend/src/pages/campManagement/settings/SettingsPage.vue`):

- Add a new item to `SettingsPage.vue`'s `items` list (permission: `camp.edit`,
  matching `edit`/`privacy`), e.g. name `embedding`, routing to
  `management.camp.settings.embedding`.
- Add the route in `router/routes.ts` under the existing
  `management.camp.settings` children, alongside `edit`/`privacy`/etc.
- New `frontend/src/pages/campManagement/settings/EmbedSettingsPage.vue`: a
  simple form (list of origin strings, add/remove) that calls the existing camp
  update endpoint (`PATCH /camps/:campId`) with `embedAllowedOrigins`, plus a
  read-only snippet showing the ready-to-paste `<iframe src="…/embed/camps/:id">`
  tag for convenience once at least one origin is saved.
- Add i18n keys to all 5 locale files, matching the block style already used in
  `SettingsPage.vue` / `CampEditPage.vue`.

## Verification

- Unit: extend `backend/tests/unit` coverage for `camp.validation.ts` (origin
  array validation) and the new embed route handler (empty vs. populated
  allowlist → correct `Content-Security-Policy` header, 404 for unknown camp).
- Integration: a registration POST with `X-Client-Type: embed` and no CSRF
  cookie should succeed against an open camp — extend the existing
  registration integration tests.
- Manual/E2E: build the app, open `/embed/camps/:id` directly in a browser to
  confirm the chrome-less layout renders; then embed it via a throwaway local
  HTML file with an `<iframe>` pointing at it — confirm the page loads only
  when the file's origin is in `embedAllowedOrigins`, submitting a registration
  succeeds, and the empty-allowlist case reports "not available" instead of a
  blank frame.
