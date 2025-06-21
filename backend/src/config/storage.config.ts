import { env } from '#config/enviroment';
import { appPath } from '#utils/paths';

export default {
  location: env.STORAGE_LOCATION,
  tmpDir: appPath(env.TMP_DIR),
  uploadDir: appPath(env.UPLOAD_DIR),
  staticDir: appPath(env.STATIC_DIR),
  maxFileSize: env.MAX_FILE_SIZE,
};
