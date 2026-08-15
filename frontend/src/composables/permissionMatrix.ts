import { computed, ref } from 'vue';
import type {
  PermissionMatrix,
  PermissionScope,
} from '@camp-registration/common/permissions';
import { usePermissionService } from '@/services/PermissionService';

/**
 * The role → permission matrix as the API enforces it. Module-level state: the
 * response is identical for every user and never changes within a session, so
 * one fetch serves every dialog that renders it.
 */
const matrix = ref<PermissionMatrix | null>(null);
let pending: Promise<PermissionMatrix> | null = null;

export interface PermissionRow {
  /** Feature group derived from the permission string, e.g. `files`. */
  group: string;
  /** Per role, the actions granted in that group, e.g. `['view', 'edit']`. */
  actions: Record<string, string[]>;
}

/**
 * Splits `camp.rooms.beds.create` into group `rooms.beds` and action `create`.
 * A permission naming the scope itself (`camp.view`) falls into the group named
 * after the scope.
 */
function splitPermission(
  scope: PermissionScope,
  permission: string,
): { group: string; action: string } {
  const segments = permission.split('.');
  const action = segments[segments.length - 1] ?? permission;
  const group = segments.slice(1, -1).join('.');

  return { group: group === '' ? scope : group, action };
}

export function usePermissionMatrix(scope: PermissionScope) {
  const service = usePermissionService();

  async function load(): Promise<void> {
    if (matrix.value !== null) {
      return;
    }

    pending ??= service.fetchPermissionMatrix();
    try {
      matrix.value = await pending;
    } finally {
      pending = null;
    }
  }

  const roles = computed<string[]>(() =>
    Object.keys(matrix.value?.[scope] ?? {}),
  );

  /**
   * One row per feature group, in the order the permissions were registered,
   * with each role's actions for that group.
   */
  const rows = computed<PermissionRow[]>(() => {
    const scoped = matrix.value?.[scope];
    if (!scoped) {
      return [];
    }

    const byGroup = new Map<string, Record<string, string[]>>();

    for (const [role, permissions] of Object.entries(scoped)) {
      for (const permission of permissions) {
        const { group, action } = splitPermission(scope, permission);
        const actions = byGroup.get(group) ?? {};
        actions[role] = [...(actions[role] ?? []), action];
        byGroup.set(group, actions);
      }
    }

    return [...byGroup.entries()].map(([group, actions]) => ({
      group,
      // Roles with nothing in this group still need an (empty) cell.
      actions: Object.fromEntries(
        roles.value.map((role) => [role, actions[role] ?? []]),
      ),
    }));
  });

  return { load, roles, rows, matrix };
}
