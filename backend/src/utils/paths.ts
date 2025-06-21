import { packageDirectorySync } from 'pkg-dir';

const dirname = import.meta.dirname;

const packageDir = packageDirectorySync({
  cwd: dirname,
});

if (!packageDir) {
  throw new Error('Could not determine the root path of the package.');
}

// Ensure that the type is string only
const projectRoot = packageDir;

export default projectRoot;
