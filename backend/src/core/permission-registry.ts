import type {
  PermissionMatrix,
  PermissionScope,
  RoleToPermissions,
  ScopedPermissions,
  ScopePermission,
  ScopeRole,
} from '@camp-registration/common/permissions';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';

/**
 * The role → permission map of a single scope. Registration is additive: every
 * module contributes the permissions it owns, so no single file holds the
 * complete policy.
 */
export class ScopeRegistry<S extends PermissionScope> {
  private map = new Map<ScopeRole<S>, Set<ScopePermission<S>>>();

  register(role: ScopeRole<S>, perms: ScopePermission<S>[]) {
    const set = this.map.get(role) ?? new Set<ScopePermission<S>>();
    perms.forEach((p) => set.add(p));
    this.map.set(role, set);
  }

  registerAll(permissions: RoleToPermissions<S>) {
    const entries = Object.entries(permissions) as [
      ScopeRole<S>,
      ScopePermission<S>[],
    ][];
    for (const [role, perms] of entries) {
      this.register(role, perms);
    }
  }

  get(role: ScopeRole<S>): ScopePermission<S>[] {
    return Array.from(this.map.get(role) ?? []);
  }

  getPermissions(role: string): ScopePermission<S>[] {
    return this.map.has(role as ScopeRole<S>)
      ? this.get(role as ScopeRole<S>)
      : [];
  }

  hasRole(role: string): boolean {
    return this.map.has(role as ScopeRole<S>);
  }

  getAll(): Record<string, ScopePermission<S>[]> {
    return Object.fromEntries(
      [...this.map.entries()].map(([role, perms]) => [role, Array.from(perms)]),
    );
  }

  clear() {
    this.map.clear();
  }
}

/**
 * Every scope's registry behind one object, so a new scope costs a
 * `PermissionScopes` entry rather than a fourth copy of the registry, the
 * module hook and the boot-time merge.
 */
export class PermissionRegistry {
  private scopes: { [S in PermissionScope]: ScopeRegistry<S> } = {
    camp: new ScopeRegistry<'camp'>(),
    newsletter: new ScopeRegistry<'newsletter'>(),
    organization: new ScopeRegistry<'organization'>(),
  };

  for<S extends PermissionScope>(scope: S): ScopeRegistry<S> {
    return this.scopes[scope];
  }

  registerAll(scoped: ScopedPermissions) {
    for (const scope of PERMISSION_SCOPES) {
      const permissions = scoped[scope];
      if (permissions) {
        // `scope` is narrowed per iteration, but TS cannot see that the
        // registry and the permission map share it.
        (this.scopes[scope] as ScopeRegistry<PermissionScope>).registerAll(
          permissions,
        );
      }
    }
  }

  /** Serializable snapshot of the whole policy, served by `GET /permissions`. */
  toMatrix(): PermissionMatrix {
    return {
      camp: this.scopes.camp.getAll(),
      newsletter: this.scopes.newsletter.getAll(),
      organization: this.scopes.organization.getAll(),
    };
  }

  clear() {
    for (const scope of PERMISSION_SCOPES) {
      this.scopes[scope].clear();
    }
  }
}

export const permissionRegistry = new PermissionRegistry();
