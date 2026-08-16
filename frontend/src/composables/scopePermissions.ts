import type {
  PermissionScope,
  ScopePermission,
} from '@camp-registration/common/permissions';

/**
 * A declarative access requirement, used by navigation items, quick actions and
 * anything else that stores "what it takes to see this" as data.
 *
 * A bare array is deliberately *not* a valid requirement: it would mean any-of
 * or all-of depending on which helper the consumer happened to call, so the
 * quantifier is spelled out at the declaration site instead.
 */
export type PermissionRequirement<S extends PermissionScope> =
  | ScopePermission<S>
  | { any: ScopePermission<S>[] }
  | { all: ScopePermission<S>[] };

interface ScopePermissionOptions<S extends PermissionScope> {
  /** Whether the current user bypasses every check (system administrator). */
  isAdmin: () => boolean;
  /** The permissions granted on `subjectId`, from the profile's access list. */
  granted: (subjectId: string | undefined) => ScopePermission<S>[];
  /** The subject `can()` defaults to — the camp/organization currently open. */
  currentSubjectId: () => string | undefined;
}

/**
 * The check helpers every permission scope shares. `usePermissions` and
 * `useOrganizationPermissions` are thin wrappers around this, so the admin
 * bypass and the all-of/any-of semantics exist once rather than per scope.
 */
export function createScopePermissions<S extends PermissionScope>(
  options: ScopePermissionOptions<S>,
) {
  type P = ScopePermission<S>;

  /** All of `permissions` must be held. */
  function canFor(subjectId: string | undefined, ...permissions: P[]): boolean {
    if (options.isAdmin()) {
      return true;
    }

    const granted = options.granted(subjectId);

    return permissions.every((value) => granted.includes(value));
  }

  function can(...permissions: P[]): boolean {
    return canFor(options.currentSubjectId(), ...permissions);
  }

  function canAny(...permissions: P[]): boolean {
    return permissions.some((value) => can(value));
  }

  function cannot(...permissions: P[]): boolean {
    return !can(...permissions);
  }

  /** Undefined means "not gated" — used by the declarative navigation items. */
  function canAccess(requirement?: PermissionRequirement<S>): boolean {
    if (requirement === undefined) {
      return true;
    }

    if (typeof requirement === 'string') {
      return can(requirement);
    }

    return 'any' in requirement
      ? canAny(...requirement.any)
      : can(...requirement.all);
  }

  return { can, canAny, canFor, cannot, canAccess };
}
