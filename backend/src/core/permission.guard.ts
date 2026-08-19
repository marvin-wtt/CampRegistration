import type { Request } from 'express';
import type {
  PermissionScope,
  ScopePermission,
} from '@camp-registration/common/permissions';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';
import type { GuardFn } from '#core/guard';

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
  ): Promise<ReadonlySet<ScopePermission<S>> | null>;
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

/**
 * Guards a route on `permission` within `scope`. The three scope-specific
 * guards (`campManager`, `newsletterManager`, `organizationMember`) are aliases
 * of this, so a new scope needs no new guard plumbing.
 */
export const scoped = <S extends PermissionScope>(
  scope: S,
  permission: ScopePermission<S>,
): GuardFn => {
  return async (req: Request) => {
    const resolver = resolvers.get(scope);
    if (!resolver) {
      throw new Error(`No permission resolver registered for scope '${scope}'`);
    }

    const subjectId = req.modelOrFail(resolver.model).id;
    const permissions = await resolver.resolve(subjectId, req.authUserId());

    return permissions?.has(permission) ?? false;
  };
};
