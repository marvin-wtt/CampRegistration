import iconExportNames from '@quasar/extras/material-icons/icons.json';

/**
 * `@quasar/extras` ships the icon list as SVG export names (e.g. `mat3dRotation`,
 * `matAccountBox`). The app renders icons through the Material Icons *web font*,
 * which is addressed by ligature names (`3d_rotation`, `account_box`).
 *
 * The export names are generated from the ligatures by stripping `_`, capitalising
 * each segment and prefixing `mat`, so the transform is reversible: drop the `mat`
 * prefix, insert `_` before every capital letter, lowercase the result.
 */
function exportNameToLigature(name: string): string {
  return name
    .slice(3)
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase();
}

export const materialIconNames: string[] = iconExportNames
  .map(exportNameToLigature)
  .sort();
