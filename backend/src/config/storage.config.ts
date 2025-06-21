import path from 'path';
import { env } from '#config/enviroment';

const createPath = (dir: string): string => {
  return dir.replaceAll('/', path.sep);
};

export default {
  location: env.STORAGE_LOCATION,
  tmpDir: createPath(env.TMP_DIR),
  uploadDir: createPath(env.UPLOAD_DIR),
  staticDir: path.join('storage', 'static') + path.sep,
  maxFileSize: env.MAX_FILE_SIZE,
};
