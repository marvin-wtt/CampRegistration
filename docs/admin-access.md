# Administrator Access — Design & Plan

**Status:** planned, not implemented.

**A system administrator acts on someone else's event, newsletter or organization only through an explicit, logged,
time-limited grant.** Their own manager or member roles keep working as for any user; the administrator role only
fills the gap above them, and only once they've asked for it with a reason. Every administrator must have two-factor
authentication enabled for the role to grant anything.

Modifications are already covered by the audit log, with the administrator as actor. This design adds what the audit
log can't show: _that_ an administrator looked at data they don't manage, _when_, and _why_.

## Why this design

- **Fallback, not bypass.** Today `guard()` evaluates `or(admin, guardFn)`, so an administrator's real role is never
  consulted. Reversing it to `or(guardFn, adminWithGrant)` means the guard itself tells us, per request, whether the
  administrator role was needed. That removes the question of which resources an administrator "manages": a viewer
  passes viewer-level requests on their own role and needs a grant only for the rest.
- **One grant per resource, not a global mode.** A global "act as admin" switch would make the log say "was admin from
  14:00 to 15:00" without saying what was accessed, would change what the administrator sees in every other event they
  manage, and would stay on until switched off. A grant names exactly one event, newsletter or organization and expires
  by itself.
- **Log the grant, not each request.** One entry with the reason covers reads; changes are audited as today. A per-read
  log would be noise nobody reviews.
- **No cascade.** An organization grant covers the organization's own pages only. A system administrator gets no
  implicit event or newsletter rights from it, because `getOrganizationEventPermissions` /
  `getOrganizationNewsletterPermissions` derive those from real memberships, not from the guard.
- **Moderation needs no grant.** Admin-only routes (`guard()` without a guard function — organization verification, the
  administration area, queues) are unchanged. Routine moderation does not open personal data of a resource.
- **2FA is enforced at use, not at assignment.** The `admin` check fails without 2FA, so an administrator without it is
  effectively a normal user. Nobody is locked out on deploy, and disabling 2FA needs no special handling.

## Permissions model

For a system administrator on a resource, the effective permission set is:

| State                | Effective permissions                     |
| -------------------- | ----------------------------------------- |
| No 2FA               | own manager/member role only              |
| 2FA, no active grant | own manager/member role only              |
| 2FA, active grant    | everything (today's administrator access) |

The frontend shows exactly this set, so an administrator never sees an action they can't perform. There is no
per-action decision about which role was used: outside a grant it is always the own role, inside it is the grant.

## Backend

### Guard

`#core/guard`:

- `admin` passes only when `req.user.role === 'ADMIN'` **and** 2FA is confirmed. Otherwise it fails with code
  `ADMIN_2FA_REQUIRED`. This also applies to admin-only routes.
- `guard(guardFn)` becomes `or(guardFn, adminWithGrant)`. `adminWithGrant` passes when `admin` passes and the user holds
  an active grant for the subject resolved by the scope (`event`, `newsletter`, `organization`); otherwise it fails with
  `ADMIN_ACCESS_REQUIRED`, which the frontend turns into the request dialog.
- `guard()` without a function stays admin-only (with the 2FA requirement).
- The grant lookup is cached for the request.

Guards that aren't scoped (state rules like `registrationOpen`, file guards) need no grant; only the subject's scope
matters.

### Grants

```prisma
model AdminAccessGrant {
  id        String   @id @default(ulid()) @db.Char(26)
  userId    String   @db.Char(26)
  scope     String   @db.VarChar(32)  // 'event' | 'newsletter' | 'organization'
  scopeId   String   @db.Char(26)
  reason    String   @db.VarChar(500)
  expiresAt DateTime
  endedAt   DateTime?
  createdAt DateTime @default(now())

  @@index([userId, scope, scopeId, expiresAt])
}
```

- `POST /admin/access-grants` `{ scope, scopeId, reason, otp }`. Requires the administrator role with 2FA and a current
  TOTP code (step-up). Grants 60 minutes. Fails if the subject doesn't exist.
- `DELETE /admin/access-grants/:id` ends a grant early (`endedAt`).
- Active grants are part of the profile response, like manager roles, so the frontend needs no extra request.
- A scheduler job prunes expired grants after the audit retention window; the audit entry is the durable record.

### Audit

- Starting a grant writes `admin_access_granted` with `reason`, `expiresAt` and the scope. Event grants are filed under
  the event's `eventId`, so they appear in the event's audit log next to the changes made during the grant.
- Ending a grant early writes `admin_access_ended`.
- Newsletter and organization grants use `entityType: 'newsletter' | 'organization'`. Whether those have an audit view
  yet must be checked during implementation; if not, they need one, or the entries are unreadable by the people they
  concern.

### Realtime

`EventManagerService.getAdminAuthorization()` is only used when the administrator has 2FA and an active grant for the
event; otherwise the subscriber resolves like any manager. A grant expiring mid-stream must revalidate, like
organization-derived access does (`revalidate`).

### Code that checks the admin role outside `guard()`

Each must follow the same rule (own role, or grant), or be confirmed to expose no personal data:

- `buildEventWhere` and other listing filters
- `file.guard.ts`
- `profile.resource.ts` (permission calculation)
- `user.resource.ts`
- admin listings that link into resources

## Reviewing access

Two places, for two audiences:

- **Per resource, for the people it concerns.** The grant entries sit in the resource's audit log, so directors,
  newsletter owners and organization admins see who accessed their resource, when, and why, next to the changes made
  during the grant. The audit log page gets an "Administrator access" action filter.
- **Central, for administrators.** A read-only "Administrator access" page in the administration area lists every grant:
  administrator, resource (linked), reason, start, expiry, ended early. Filters: administrator, scope, date range,
  active only. Administrators see each other's grants, which is the point: access is reviewed by peers, not only by the
  one who took it. Each row links to the audit entries of that resource filtered to that administrator and the grant's
  time window, which is what they changed during it.

Rules:

- `GET /admin/access-grants` (filters as above, paginated) is an admin-only route. It shows metadata about access, not
  the resources' data, so it needs no grant itself.
- Grants can't be edited or deleted through the API. They're pruned only after the audit retention window, like audit
  entries.

## Frontend

### Permissions

`composables/scopePermissions.ts` currently returns every permission when `isAdmin()`. That becomes
`isAdmin() && has2fa() && hasActiveGrant(scope, id)`; otherwise the own role applies.

### The admin access control

One component, rendered by `GeneralLayout`. `EventManagementLayout`, `NewsletterLayout` and `OrganizationLayout` pass
the subject `{ scope, id }`. It is shown only to administrators with 2FA, and only when their own role leaves a gap (never
to a director with full rights).

- **Desktop:** a shield icon button in the rail footer, directly above the profile menu.
- **Mobile:** a shield icon button in the top bar, directly left of the profile menu.
- **Inactive:** outlined shield. Tapping opens the request dialog: reason (required) and TOTP code.
- **Active:** filled shield in an MD3 error/tertiary container role, plus a bar across the top of the page container on
  every subpage: `Administrator access · 42 min left · [End]`. Tapping the shield also offers "End access".
- **No role at all:** instead of a 403 page, the resource shows "You don't manage this event" with the same request
  button.

A small indicator in the app header shows the count of active grants, listing each with a link and "End". It only shows
status; access is requested inside the resource.

### 2FA

- `ADMIN_2FA_REQUIRED`, or a profile showing an administrator without 2FA, sends them to 2FA setup with an explanation.
  Administration navigation is hidden until it's enabled.
- The disable dialog warns administrators that their administrator rights pause until 2FA is set up again.

## 2FA requirement

- Required for the administrator role to grant anything, enforced by the `admin` guard (see above).
- **Disabling stays allowed.** It already needs password and a current code. While disabled, administrator rights and
  open grants stop working, because both go through the same check. Changing devices is disable → set up → enable.
- **Lost device:** recovery codes. Without them, another administrator demotes and re-promotes, or an operator resets
  2FA in the database.
- **Deploy:** existing administrators without 2FA lose administrator rights until they set it up. Tell them beforehand.

Possible later addition: an atomic "change authenticator" flow (password + current code, store the new secret as
pending, switch after confirming a code from the new app), so rights never pause. Only worth it if device changes are
common.

## Implementation order

1. **2FA requirement** — `admin` guard check, frontend redirect to setup, disable warning. Independent of the rest.
2. **Guard reorder and grants** — migration, grant module (service, routes, profile field), `adminWithGrant`, audit
   entries, realtime.
3. **Non-guard admin checks** — review and adapt the list above.
4. **Review** — `GET /admin/access-grants`, the administration page, the audit log action filter.
5. **Frontend** — `scopePermissions`, access control component in `GeneralLayout`, request dialog, active bar, no-role
   page, header indicator; strings in all 5 locales.

## Tests

- Administrator without 2FA: admin-only routes and resources return `ADMIN_2FA_REQUIRED`.
- Pure administrator with 2FA, no grant: `ADMIN_ACCESS_REQUIRED` on an event, newsletter and organization.
- Administrator who is a viewer: viewer requests pass without a grant; edit passes only with one.
- Expired and ended grants are refused; a grant for one event doesn't open another.
- An organization grant opens no event or newsletter of that organization.
- Granting without a valid TOTP code fails; a granted request writes `admin_access_granted`.
- SSE: an administrator without a grant receives only what their own role allows.

- The review listing is admin-only, filters correctly, and has no write or delete route.

## Open questions

- **Notify managers when a grant starts?** Directors (events), owners (newsletters) and organization admins could get
  an email. Stronger for privacy, possibly awkward during support cases. Without it, they see the grant in the audit
  log.
- **Grant duration:** fixed 60 minutes, or chosen in the dialog (e.g. 15 / 60 / 240)?
