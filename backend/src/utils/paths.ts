import { packageDirectorySync } from 'pkg-dir';
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
