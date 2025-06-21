import { packageDirectorySync } from 'pkg-dir';
import logger from '#core/logger';

const dirname = import.meta.dirname;

const packageDir = packageDirectorySync({
  cwd: dirname,
});

if (!packageDir) {
  throw new Error('Could not determine the root path of the package.');
}

logger.info(`App root path is: ${packageDir}`);

// Ensure that the type is string only
const projectRoot = packageDir;

export default projectRoot;
