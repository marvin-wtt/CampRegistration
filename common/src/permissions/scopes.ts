import type {
  EventManagerRole,
  NewsletterManagerRole,
  OrganizationRole,
} from './roles.js';
import type {
  EventScopedPermission,
  NewsletterPermission,
  OrganizationPermission,
} from './permissions.js';

/**
 * The scopes a permission can be granted in. Each pairs the role enum of the
 * membership record with the permissions that role may hold.
 *
 * Adding a scope here is the single edit that gives it a registry entry, a
 * module hook key, a route guard and a frontend `can()`.
 */
export interface PermissionScopes {
  event: { role: EventManagerRole; permission: EventScopedPermission };
  newsletter: { role: NewsletterManagerRole; permission: NewsletterPermission };
  organization: { role: OrganizationRole; permission: OrganizationPermission };
}

export type PermissionScope = keyof PermissionScopes;

export type ScopeRole<S extends PermissionScope> = PermissionScopes[S]['role'];

export type ScopePermission<S extends PermissionScope> =
  PermissionScopes[S]['permission'];

export type RoleToPermissions<S extends PermissionScope> = Partial<
  Record<ScopeRole<S>, ScopePermission<S>[]>
>;

/** What a module returns from `registerPermissions()`. */
export type ScopedPermissions = {
  [S in PermissionScope]?: RoleToPermissions<S>;
};

/**
 * Wire shape of `GET /permissions`. Roles are plain strings: the matrix is
 * rendered, not checked against, and each scope has its own role enum.
 */
export type PermissionMatrix = Record<
  PermissionScope,
  Record<string, string[]>
>;

export const PERMISSION_SCOPES = [
  'event',
  'newsletter',
  'organization',
] as const satisfies readonly PermissionScope[];
