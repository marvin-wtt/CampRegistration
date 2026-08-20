import { beforeEach, describe, expect, it } from 'vitest';
import { PermissionRegistry } from '#core/permission-registry';
import { createModules } from '../../../src/modules.js';

/**
 * The policy has no single readable definition — every module contributes a
 * slice through `registerPermissions()`. These snapshots are that definition,
 * and they are also the contract of `GET /permissions`, which the role
 * permission dialogs render. A diff here means a role's reach changed; confirm
 * that was intended before updating it.
 */
describe('the assembled permission policy', () => {
  let registry: PermissionRegistry;

  beforeEach(() => {
    registry = new PermissionRegistry();
    for (const module of createModules()) {
      const scoped = module.registerPermissions?.();
      if (scoped) {
        registry.registerAll(scoped);
      }
    }
  });

  /** Sorted so the snapshot reflects the policy, not module boot order. */
  const normalize = (matrix: Record<string, string[]>) =>
    Object.fromEntries(
      Object.entries(matrix)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([role, permissions]) => [role, [...permissions].sort()]),
    );

  it('grants camp roles exactly these permissions', () => {
    expect(normalize(registry.for('camp').getAll())).toMatchSnapshot();
  });

  it('grants newsletter roles exactly these permissions', () => {
    expect(normalize(registry.for('newsletter').getAll())).toMatchSnapshot();
  });

  it('grants organization roles exactly these permissions', () => {
    expect(normalize(registry.for('organization').getAll())).toMatchSnapshot();
  });

  it('registers every scope, so GET /permissions is never partially empty', () => {
    const matrix = registry.toMatrix();

    for (const scope of ['camp', 'newsletter', 'organization'] as const) {
      expect(Object.keys(matrix[scope]).length).toBeGreaterThan(0);
    }
  });

  it('keeps each scope free of other scopes’ permissions', () => {
    const matrix = registry.toMatrix();

    for (const [scope, roles] of Object.entries(matrix)) {
      for (const permissions of Object.values(roles)) {
        for (const permission of permissions) {
          expect(permission.startsWith(`${scope}.`)).toBe(true);
        }
      }
    }
  });
});
