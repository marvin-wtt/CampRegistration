---
name: add-permission
description: Add or change a scoped RBAC permission (camp, newsletter, or organization) — the union, the module's registerPermissions(), the route guard, and the registry snapshot. Use whenever a new route needs authorization, a role's grants change, or a new permission scope is introduced.
---

# Adding a scoped permission

Permissions are declared per module and merged into one registry at boot. No single
file holds the whole policy, so a new permission is only real once every step below
is done — a string that no module returns from `registerPermissions()` is granted to
nobody, silently.

## Steps

1. **Declare the string.** Add it to its scope's union in
   `common/src/permissions/permissions.ts`. Scopes are declared in
   `common/src/permissions/scopes.ts`:
   `camp` / `newsletter` / `organization`, each pairing a role type with a
   permission type.
2. **Rebuild common** — `npm run build --workspace common`. Backend and frontend
   both resolve the type from `common/dist`, so skipping this produces type errors
   that look unrelated.
3. **Grant it.** Return it from the owning module's `registerPermissions()`, keyed
   by scope and role. Registration is additive; the module that owns the _subject_
   owns the grant.
4. **Guard the route.** Use `scoped(scope, permission)` from
   `#core/permission.guard`, or its aliases `campManager(p)`,
   `newsletterManager(p)`, `organizationMember(p)`. Never write a role comparison.
5. **Update the snapshot.** `backend/tests/unit/core/permission-registry.test.ts`
   snapshots the assembled registry — it must be updated deliberately, since the
   diff is the review surface for "who can now do what".

The role-permission dialog in the frontend needs no change: it renders
`GET /permissions`, which serves `permissionRegistry.toMatrix()`. Never hardcode
the matrix client-side; consume it with `usePermissionMatrix(scope)`.

## Type safety

Use the narrow type for scope-specific APIs — `ScopePermission<'camp'>` or
`CampScopedPermission`. `Permission` is the union of all three scopes, and passing
an organization string to a camp API must be a compile error, not a silent `false`.

## What is _not_ a permission

State and ownership rules stay plain `GuardFn`s composed with `or`/`and`, never
registry entries: `registrationOpen`, `campOrganizationVerified`,
`campManagerSelf`, `organizationMemberSelf`, `buildCampWhere`, `file.guard.ts`.
If the rule depends on the state of the row rather than on who the user is, it
belongs here, not in the registry.

## Organization-implied grants

Organization `ADMIN`s hold exactly `ORGANIZATION_CAMP_PERMISSIONS` on their org's
camps and exactly `ORGANIZATION_NEWSLETTER_PERMISSIONS` on its newsletters, merged
in `CampManagerService.getManagerAuthorization()` /
`NewsletterManagerService.getManagerPermissions()`. **Never extend either constant
to personal data** — registrations, subscribers, `newsletter.messages.*`. Tests
assert both sets' exact contents.

An implicit grant carries no manager record, so the entity never appears under
`GET /camps?view=assigned`. If you add one, add the matching
`GET /organizations/:id/...` listing too, or the permission is unreachable outside
a direct link.

## Adding a whole scope

A new scope needs a `ScopeResolver` returned from the owning module's
`registerScopeResolvers()`. `boot.ts` calls `assertScopeResolversComplete()`, so an
unwired scope fails boot rather than 500-ing on the first guarded request. Exactly
one module may own a scope. Put the resolver and its alias in the **subject**
module's guard file (`camp/camp.guard.ts`, …), not in the membership module whose
service it calls.
