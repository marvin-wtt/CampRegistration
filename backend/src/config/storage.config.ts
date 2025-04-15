import path from 'path';
import fse from 'fs-extra';
import { env } from '#config/enviroment';

const createPath = (dir: string): string => {
  return dir.replaceAll('/', path.sep);
};

const storageOptions = {
  location: env.STORAGE_LOCATION,
  tmpDir: createPath(env.TMP_DIR),
  uploadDir: createPath(env.UPLOAD_DIR),
  staticDir: path.join('storage', 'static') + path.sep,
  maxFileSize: env.MAX_FILE_SIZE,
};

// TODO This should not happen here
{
  if (storageOptions.tmpDir) {
    fse.ensureDirSync(storageOptions.tmpDir);
  }
  if (storageOptions.uploadDir) {
    fse.ensureDirSync(storageOptions.uploadDir);
  }
}

export default storageOptions;
