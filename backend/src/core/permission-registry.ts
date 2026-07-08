import type {
  CampManagerRole,
  NewsletterManagerRole,
  Permission,
  NewsletterPermission,
} from '@camp-registration/common/permissions';

export class PermissionRegistry<
  TRole extends string,
  TPermission extends string,
> {
  private map = new Map<TRole, Set<TPermission>>();

  register(role: TRole, perms: TPermission[]) {
    const set = this.map.get(role) ?? new Set<TPermission>();
    perms.forEach((p) => set.add(p));
    this.map.set(role, set);
  }

  registerAll(permissions: Partial<Record<TRole, TPermission[]>>) {
    const entries = Object.entries(permissions) as [TRole, TPermission[]][];
    for (const [role, perms] of entries) {
      this.register(role, perms);
    }
  }

  get(role: TRole): TPermission[] {
    return Array.from(this.map.get(role) ?? []);
  }

  getPermissions(role: string): TPermission[] {
    return this.map.has(role as TRole) ? this.get(role as TRole) : [];
  }

  hasRole(role: string): boolean {
    return this.map.has(role as TRole);
  }

  getAll(): Record<TRole, TPermission[]> {
    return Object.fromEntries(
      [...this.map.entries()].map(([role, perms]) => [role, Array.from(perms)]),
    ) as Record<TRole, TPermission[]>;
  }
}

export const campPermissionRegistry = new PermissionRegistry<
  CampManagerRole,
  Permission
>();

export const newsletterPermissionRegistry = new PermissionRegistry<
  NewsletterManagerRole,
  NewsletterPermission
>();
