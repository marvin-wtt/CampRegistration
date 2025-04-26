import type {
  ManagerRole,
  Permission,
} from '@camp-registration/common/permissions';

export class PermissionRegistry {
  private map = new Map<ManagerRole, Set<Permission>>();

  register(role: ManagerRole, perms: Permission[]) {
    const set = this.map.get(role) ?? new Set<Permission>();
    perms.forEach((p) => set.add(p));
    this.map.set(role, set);
  }

  registerAll(permissions: Partial<Record<ManagerRole, Permission[]>>) {
    for (const [role, perms] of Object.entries(permissions)) {
      this.register(role as ManagerRole, perms);
    }
  }

  get(role: ManagerRole): Permission[] {
    if (!this.map.has(role)) {
      return [];
    }

    return Array.from(this.map.get(role) ?? []);
  }

  getPermissions(role: string): Permission[] {
    return this.map.has(role as ManagerRole)
      ? this.get(role as ManagerRole)
      : [];
  }
}

export const permissionRegistry = new PermissionRegistry();
