import { packageDirectorySync } from 'package-directory';
import path from 'path';

const dirname = import.meta.dirname;

const packageDir = packageDirectorySync({
  cwd: dirname,
});

if (!packageDir) {
  throw new Error('Could not determine the root path of the package.');
}

export function appPath(...paths: string[]) {
  return path.resolve(projectRoot, ...paths);
}

export function appBuildPath(...paths: string[]) {
  return appPath('build', ...paths);
}

// Ensure that the type is string only
const projectRoot = packageDir;

export function spaPath(...paths: string[]) {
  return appPath('..', 'frontend', 'dist', 'spa', ...paths);
}

/** The built SPA shell — the one document every browser path falls back to. */
export function spaIndexPath() {
  return spaPath('index.html');
}
