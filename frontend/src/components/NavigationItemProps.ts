import type { PermissionScope } from '@camp-registration/common/permissions';
import type { PermissionRequirement } from '@/composables/scopePermissions';

interface BaseProps<S extends PermissionScope> {
  header?: boolean;
  name: string;
  label?: string | undefined;
  separated?: boolean | undefined;
  insertLevel?: number | undefined;
  // A single permission, or `{ any: [...] }` / `{ all: [...] }`.
  permission?: PermissionRequirement<S> | undefined;
  // Can this item be hidden from its rail by a per-event nav setting?
  hideable?: boolean | undefined;
}

interface HeaderItemProps<S extends PermissionScope> extends BaseProps<S> {
  header: true;
}

interface LinkItemProps<S extends PermissionScope> extends BaseProps<S> {
  icon?: string | undefined;
  to?: string | object | undefined;
  children?: LinkItemProps<S>[] | undefined;
}

/**
 * Navigation items are gated per scope: a event layout filters with
 * `usePermissions().canAccess`, an organization layout with `canAccessOrg`.
 * The scope parameter keeps a event permission out of an organization menu,
 * where it could never match.
 */
export type NavigationItemProps<S extends PermissionScope = PermissionScope> =
  LinkItemProps<S> | HeaderItemProps<S>;
