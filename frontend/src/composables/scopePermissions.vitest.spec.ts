import { describe, expect, it } from 'vitest';
import { createScopePermissions } from '@/composables/scopePermissions';

describe('createScopePermissions', () => {
  // An administrator who is a viewer of `own` and holds a grant for `granted`.
  const permissions = createScopePermissions<'event'>({
    isAdmin: (id) => id === 'granted',
    granted: (id) => (id === 'own' ? ['event.view'] : []),
    currentSubjectId: () => 'own',
  });

  it('allows everything on a subject the administrator holds a grant for', () => {
    expect(permissions.canFor('granted', 'event.delete')).toBe(true);
  });

  it('applies only the own role elsewhere', () => {
    expect(permissions.can('event.view')).toBe(true);
    expect(permissions.can('event.delete')).toBe(false);
    expect(permissions.canFor('other', 'event.view')).toBe(false);
  });
});
