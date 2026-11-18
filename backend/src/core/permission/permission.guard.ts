import type { Request } from 'express';
import type {
  PermissionScope,
  ScopeGrant,
  ScopePermission,
} from '@camp-registration/common/permissions';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';
import { admin, type GuardFn } from '#core/guard';
import { type ModelKey, ownsBoundModel } from '#core/permission/ownership';

/**
 * How one scope turns a request into a permission set. Registered by the module
 * that owns the scope's membership table, so `scoped()` stays free of imports
 * from `#app`.
 */
export interface ScopeResolver<S extends PermissionScope> {
  /** The bound model carrying the scope's subject id. */
  model: keyof Express.Models;
  /**
   * The permissions `userId` holds on `subjectId`, or `null` when they hold
   * none at all.
   */
  resolve(
    subjectId: string,
    userId: string,
  ): Promise<ReadonlySet<ScopeGrant<S>> | null>;
}

/** What a module returns from `registerScopeResolvers()`. */
export type ScopeResolvers = {
  [S in PermissionScope]?: ScopeResolver<S>;
};

const resolvers = new Map<PermissionScope, ScopeResolver<PermissionScope>>();

/**
 * Exactly one module owns each scope, so a second registration is a wiring
 * mistake rather than an override — unlike the permission registry, which is
 * deliberately additive.
 */
export function registerScopeResolver<S extends PermissionScope>(
  scope: S,
  resolver: ScopeResolver<S>,
): void {
  if (resolvers.has(scope)) {
    throw new Error(`Duplicate permission resolver for scope '${scope}'`);
  }

  resolvers.set(scope, resolver);
}

/**
 * Fails the boot of an app whose scopes are not all wired. Without it a missing
 * resolver surfaces as a 500 on the first request to guard that scope, which
 * may be long after deploy and only on some routes.
 */
export function assertScopeResolversComplete(): void {
  const missing = PERMISSION_SCOPES.filter((scope) => !resolvers.has(scope));

  if (missing.length > 0) {
    throw new Error(
      `No permission resolver registered for scope(s): ${missing.join(', ')}`,
    );
  }
}

/** Test seam — the resolver map is a boot-time singleton like the registry. */
export function clearScopeResolvers(): void {
  resolvers.clear();
}

/** How far a permission reaches: every record, the user's own, or none. */
export type ScopeAccess = 'all' | 'own' | null;

export async function scopeAccess<S extends PermissionScope>(
  req: Request,
  scope: S,
  permission: ScopePermission<S>,
): Promise<ScopeAccess> {
  if (admin(req) === true) {
    return 'all';
  }

  const resolver = resolvers.get(scope);
  if (!resolver) {
    throw new Error(`No permission resolver registered for scope '${scope}'`);
  }

  const subjectId = req.modelOrFail(resolver.model).id;
  const grants = await resolver.resolve(subjectId, req.authUserId());

  if (grants?.has(permission)) {
    return 'all';
  }

  return grants?.has(`${permission}:own` as ScopeGrant<S>) ? 'own' : null;
}

interface ScopedOptions {
  /** The bound model a `:own` grant is checked on; without it, `:own` never passes. */
  own?: ModelKey;
}

/**
 * Guards a route on `permission` within `scope`. The scope-specific guards
 * (`hasEventPermission`, …) are aliases of this.
 */
export const scoped = <S extends PermissionScope>(
  scope: S,
  permission: ScopePermission<S>,
  options: ScopedOptions = {},
): GuardFn => {
  return async (req: Request) => {
    const access = await scopeAccess(req, scope, permission);

    return (
      access === 'all' ||
      (access === 'own' &&
        options.own !== undefined &&
        ownsBoundModel(req, options.own))
    );
  };
};

/**
 * Guards a list on the view it requests: `?view=all` needs the full grant,
 * `own` (the default) is also open to a `:own` grant. The handler filters on
 * the validated view, like `GET /events?view=assigned`.
 */
export const scopedView = <S extends PermissionScope>(
  scope: S,
  permission: ScopePermission<S>,
): GuardFn => {
  return async (req: Request) => {
    const access = await scopeAccess(req, scope, permission);

    return req.query.view === 'all' ? access === 'all' : access !== null;
  };
};
