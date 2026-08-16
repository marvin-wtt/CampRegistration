export type WorkspaceAreaName = 'camps' | 'newsletters' | 'organizations';

export interface WorkspaceEntry {
  id: string;
  label: string;
  icon: string;
  caption?: string | undefined;
}

/**
 * The management area a route belongs to. Route names are already prefixed per
 * area (`management.camps`, `management.camp.settings.form`, …), so a prefix
 * test is enough and no route meta has to be maintained alongside them.
 */
export function areaFromRouteName(
  name: unknown,
): WorkspaceAreaName | undefined {
  const value = typeof name === 'string' ? name : '';

  if (value.startsWith('management.camp')) {
    return 'camps';
  }
  if (value.startsWith('management.newsletter')) {
    return 'newsletters';
  }
  if (value.startsWith('management.organization')) {
    return 'organizations';
  }

  return undefined;
}
