import { packageDirectorySync } from 'pkg-dir';
import path from 'path';

const dirname = import.meta.dirname;

const packageDir = packageDirectorySync({
  cwd: dirname,
});

if (!packageDir) {
  throw new Error('Could not determine the root path of the package.');
}

export function appPath(...paths: string[]): string {
  return path.resolve(projectRoot, ...paths);
}

export function appBuildPath(...paths: string[]): string {
  return appPath('build', ...paths);
}

export function publicPath(...paths: string[]): string {
  return appPath('public', ...paths);
}

// Ensure that the type is string only
const projectRoot = packageDir;

export default projectRoot;
