import type {
  PermissionScope,
  ScopePermission,
} from '@camp-registration/common/permissions';

interface BaseProps<S extends PermissionScope> {
  header?: boolean;
  name: string;
  label?: string | undefined;
  separated?: boolean | undefined;
  insertLevel?: number | undefined;
  // A single permission, or an array meaning "any of these grants access".
  permission?: ScopePermission<S> | ScopePermission<S>[] | undefined;
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
 * Navigation items are gated per scope: a camp layout filters with
 * `usePermissions().canAccessAny`, an organization layout with
 * `canAccessAnyOrg`. The scope parameter keeps a camp permission out of an
 * organization menu, where it could never match.
 */
export type NavigationItemProps<S extends PermissionScope = PermissionScope> =
  LinkItemProps<S> | HeaderItemProps<S>;
