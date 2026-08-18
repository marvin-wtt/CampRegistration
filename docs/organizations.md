# Organizations — Design & Conventions

**Camps and newsletters are owned by an organization, and organizations are moderated by system administrators.** Anyone
may found one, but until it is verified its camps stay private drafts that cannot accept registrations — so no
participant's personal data is ever collected on behalf of an entity nobody has vetted. Organization membership is an
ownership and accountability relationship, deliberately _not_ a grant of access to participant data.

## Why this design

- **Publication is gated, not creation.** An unverified organization can build a camp end to end, publication settings
  included; the camp just stays out of the public directory and refuses registrations until the organization is
  verified. Moderation never blocks preparation work, and the reviewer sees a real camp rather than an empty shell.
- **Fixed permission set, not a registry lookup.** Organization roles map to camp permissions through the constant
  `ORGANIZATION_CAMP_PERMISSIONS`, not through a role→permission registry. A registry invites incremental widening; a
  constant with a test asserting its exact contents does not. This is the one place the generic scope mechanism is
  deliberately bypassed — organization→camp is a cross-scope derivation, and it is capped by hand.
- **Two roles, not three.** `ADMIN`/`MEMBER`. An `OWNER` tier would only have protected one admin from another: deleting
  an organization that owns camps is already blocked by the `Restrict` foreign key, and the last-admin invariant already
  prevents lockout.
- **Restrict, never cascade.** `Camp.organizationId` and `Newsletter.organizationId` use
  `onDelete: Restrict`. Deleting an organization must never silently take registrations with it; the endpoint returns
  `409` and the administrator moves or deletes the camps first.
- **The legacy organization is conditional.** The migration creates it only when the database already contains camps or
  newsletters. Fresh installs get none, and no application code may assume it exists.
- **No server-side default organization.** `organizationId` is required on
  `POST /camps` and `POST /newsletters`. A silent fallback would let a frontend bug quietly produce camps owned by
  "Legacy" instead of failing loudly.

## Ownership model

```
Organization ──< OrganizationMember >── User
     │                    │
     │                    └── OrganizationInvitation (email, pre-registration)
     ├──< Camp ──< CampManager >── User
     └──< Newsletter ──< NewsletterManager >── User
```

Camp managers and newsletter managers are **independent of organization membership**. Being invited to run a camp never
requires joining the organization that owns it, and the existing invite-by-email flow is unchanged.

`OrganizationInvitation` is a separate table from `camp_manager_invitations` on purpose:
`resolveManagerInvitations` deletes by email alone, so a shared table would destroy the other scope's pending
invitations. Both are resolved side by side in
`AuthController.register`.

## Verification lifecycle

```
        (created)
            │
            ▼
         PENDING ───────review───────▶ VERIFIED
            │                          ▲     │
            │                  reinstate     revoke
            │                          │     ▼
            └───review───────────────▶ REJECTED
                                        │
                                        └── resubmit ──▶ PENDING
```

A review is **not** restricted to `PENDING`. A verified organization can turn out to be fraudulent and must be revocable
after the fact, and a rejected one can be reinstated without waiting for it to resubmit. Any transition _into_
`REJECTED` unpublishes the organization's camps, whichever state it came from. Reinstating deliberately does **not**
republish them — unpublishing was a safety action, and putting a camp back in front of the public is the organization's
decision, not the reviewer's.

- Organizations are created `PENDING` with the full verification dataset — registered address, country and registration
  number — so a submission is always complete enough to review. There is no `DRAFT` state.
- There is a single `name`, not a separate trading and legal name. Camp organizations are almost always registered under
  the name they operate as, and two near-identical fields only invited confusion.
- Only system administrators decide (`PATCH /organizations/:id/verification`, bare
  `guard()`), and they can decide again at any time.
- **Editing the vetted identity sends the organization back to `PENDING`.** Only the fields in
  `ORGANIZATION_VERIFICATION_FIELDS` (name, country, address, registration number) trigger it — correcting a phone
  number or website must not pull a live camp out of the public directory. The constant is exported from `common` so the
  client warns about exactly the fields the server acts on.
- Editing is **not** blocked while `PENDING`. The demotion already re-opens review, so a lock would only freeze an
  organization after its first edit.
- A demotion does **not** unpublish camps. It is not a rejection: the registration guard and public listing already
  exclude unverified organizations, so the camps reappear once it is verified again rather than every edit costing it
  its publication state.
- Rejection **unpublishes every camp the organization owns, in the same transaction as the status change** — not for
  safety (visibility is already derived; see
  [Publication gating](#publication-gating)) but because it is the only thing that forces the organization to re-affirm
  publication if it is later reinstated.

### Notifications

| Event                                                          | Recipients                                                   | Mailable                           |
|----------------------------------------------------------------|--------------------------------------------------------------|------------------------------------|
| Enters `PENDING` (created, resubmitted, or demoted by an edit) | every system administrator                                   | `OrganizationReviewPendingMessage` |
| Verified                                                       | the organization's `ADMIN` members                           | `OrganizationVerifiedMessage`      |
| Rejected or revoked                                            | the organization's `ADMIN` members, with the reviewer's note | `OrganizationRejectedMessage`      |

All are enqueued, never awaited inline, so an unreachable mail server cannot fail the request that triggered it. Members
still holding an unaccepted invitation have no account and are skipped. The reviewer is not notified of their own
decision.

## Publication gating

An unverified organization is kept away from two distinct harms, and conflating them is what makes this area easy to get
wrong:

| Harm                                                       | Gated on                      | Enforced by                                             |
|------------------------------------------------------------|-------------------------------|---------------------------------------------------------|
| Participant data collected for an entity nobody has vetted | accepting a registration      | `registrationOpen` (`camp.guard.ts`)                    |
| An unvetted entity advertising through the platform        | the camp being visible at all | the organization filter in `buildCampWhere`, and `show` |

A camp page with no registration button is still an advertisement — it carries a
`contactEmail` and the platform's implicit endorsement, and payment can be arranged off platform. So visibility is gated
on its own, not as a side effect of the registration rule.

- **Visibility is derived, not stored.** `buildCampWhere` restricts the public directory to `VERIFIED` organizations
  independently of the camp's own `listed` flag, so a camp hidden by its organization's status reappears when that
  status changes, with the flag untouched. `GET /camps/:campId` is otherwise unguarded — `listed: false` means
  _unlisted_, not secret, and preview links are shareable — but
  `or(campOrganizationVerified, campManager('camp.view'))` narrows an unverified organization's camp to its camp
  managers, the organization's administrators (who hold
  `camp.view` by derivation) and system administrators.
- **`camp.listed` belongs to the organization.** It answers "do we want this listed", never "are we allowed to list it".
  Nothing but a rejection may rewrite it.
- **There is no write-time publication gate**, deliberately. Setting `listed: true` or a registration window under an
  unverified organization succeeds; the camp simply does not appear and does not accept registrations until the
  organization is verified. A `403`
  would have been a second, differently-shaped copy of a rule the read side already enforces, it would have withheld
  exactly the preparation work `PENDING` exists to allow, and it would have contradicted the two paths that deliberately
  leave `listed: true` on a hidden camp — a demotion, and an administrator moving a camp to an unverified organization.
  The consequence is intended: a camp whose window is already open goes live the moment a moderator verifies the
  organization, with no further action by the organization.
- **Destructive unpublish is reserved for rejection.** Every other path that makes a camp temporarily invisible — a
  demotion triggered by an identity edit, a transfer to an unverified organization — does it by derivation. Rejection is
  the one case where the organization must consciously re-publish afterwards, so it is the one case that rewrites
  `listed`.
- **Management surfaces must say so.** Derived invisibility means a camp can be configured perfectly, report
  `registrationStatus: 'open'`, and still reach nobody. So `Camp` carries
  `organizationName` and `organizationVerificationStatus`, and the camp card and dashboard render "pending
  verification" / "not verified" instead of letting it look live. The full status rather than a boolean, because
  "awaiting review" and "rejected" need different wording and a different call to action. Carrying it leaks nothing: a
  camp whose organization is unverified is only readable by the people listed above.

## Organization-derived camp access

An organization `ADMIN` holds a fixed, minimal permission set on **every** camp their organization owns, without any
`CampManager` record:

```ts
// common/src/permissions/permissions.ts
export const ORGANIZATION_CAMP_PERMISSIONS = [
  "camp.view",
  "camp.edit",
  "camp.managers.view",
] as const satisfies readonly Permission[];
```

| Capability             | Granted                 | Rationale                                             |
|------------------------|-------------------------|-------------------------------------------------------|
| See the camp exists    | ✅ `camp.view`          | Ownership implies visibility                          |
| Close registration     | ✅ `camp.edit`          | The organization is accountable for what it publishes |
| See who manages it     | ✅ `camp.managers.view` | Accountability for delegated access                   |
| **See registrations**  | ❌                      | **Never.** Ownership is not a data-access grant       |
| Delete the camp        | ❌                      | Requires an explicit camp-manager role                |
| Add or remove managers | ❌                      | Requires an explicit camp-manager role                |

`MEMBER` gets nothing implicit — they may create camps under the organization and must be invited as camp managers like
anyone else.

Note `camp.edit` is broader than "close registration": it also authorizes editing the registration form and themes. This
is accepted; narrowing it would need a dedicated
`camp.registration_window.edit` permission and a field-level split in
`camp.validation.update`.

### Where it is enforced

`CampManagerService.getManagerAuthorization()` is the **only** place camp permissions are resolved — the REST guard,
`campManagerHasPermission`, and the realtime subscriber resolver all go through it, so they cannot drift. Two subtleties
it preserves:

- **An expired manager record does not mask organization access.** The record grants nothing once expired, but the
  organization-derived set still applies.
- **A live record's `expiresAt` is kept even when organization permissions also apply.**
  Clearing it would let the _wider_ manager set keep serving an open SSE stream past expiry. Instead the stream closes
  at expiry and the reconnect re-resolves the user down to the organization-only set.

## Realtime

Organizations are **not** a `RealtimeResource`. The SSE layer is camp-scoped end to end and organization data changes
rarely.

That leaves one gap, closed explicitly: `shouldRefreshOn` only re-resolves a subscriber when a `manager` event names
their own record, so a demoted organization administrator would otherwise keep their snapshot for the life of the
connection. Authorizations that draw on organization membership therefore carry `revalidate: true`, and
`realtime.stream.ts` re-resolves them on each heartbeat. Worst-case staleness is one heartbeat (25 s) rather than
unbounded.

## Adding an organization-scoped permission

1. **common**: add the string to `OrganizationPermission` in
   `common/src/permissions/permissions.ts`; rebuild `common`.
2. **backend**: return it from the owning module's `registerPermissions()` hook under the
   `organization` key, and guard the route with `organizationMember('organization.…')`.
3. **backend**: update the registry snapshot in
   `tests/unit/core/permission-registry.test.ts` — the diff is the review prompt for "did this role's reach change on
   purpose?".
4. **frontend**: gate the UI on `profile.organizationAccess` via `useOrganizationPermissions()`.

Do **not** add camp permissions to `ORGANIZATION_CAMP_PERMISSIONS` as part of this — that constant is a privacy boundary
and has a test asserting its exact contents.

## Migration

`20260813140000_add_organizations` is **hand-edited on purpose**, and is the one sanctioned exception to "never edit
migration SQL".

The data-migration runner (`prisma/data-migrations/runner.ts`) executes only after
`prisma migrate deploy` has applied _all_ pending schema migrations, so a co-located
`migration.ts` can never satisfy a `NOT NULL` constraint added in the same release. Each column is therefore added
nullable, backfilled, and only then tightened, all in
`migration.sql`.

The legacy organization (`00000000000000000000000000` — valid Crockford base32; `L`, `I`,
`O` and `U` are not) is created only when the database already has camps or newsletters, and is deliberately
**member-less**: system administrators already bypass every guard, and adding the existing user base as members would
hand them organization-derived permissions over each other's camps.

`db:reset` uses `prisma db push` and the integration suite truncates every table, so neither ever runs the migration —
organizations must also come from the factories and seeders, or the foreign keys have nothing to point at.

## Known gaps (accepted)

- **SSE staleness on organization role change** is bounded at one heartbeat, not instantaneous. The fix would be an
  organization-membership realtime event; not worth a second stream scope yet.
- **`profile.campAccess` grows with organization size** — an organization with 200 camps puts 200 entries in every
  profile response for each of its administrators. If that bites, send `organizationAccess` alone and derive camp access
  client-side, at the cost of duplicating the merge rule.
- **`campAccess` does not model camp-manager expiry.** Pre-existing; the server-side guard remains authoritative.
- **The legacy organization is a permission vacuum by design** — it owns pre-existing camps but has no members, so
  nobody gains organization-derived access to them. Administrators reassign camps to real organizations over time via
  `PATCH /camps/:campId/organization`.
