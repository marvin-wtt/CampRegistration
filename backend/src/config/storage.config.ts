import Joi from "joi";
import path from "path";
import fse from "fs-extra";

const { value: envVars, error } = Joi.object()
  .keys({
    TMP_DIR: Joi.string().description(
      "Directory where unprocessed files are stored",
    ),
    UPLOAD_DIR: Joi.string().description(
      "Directory where uploaded files are stored",
    ),
    STORAGE_LOCATION: Joi.string().description(
      "Location where new files should be stored to",
    ),
    MAX_FILE_SIZE: Joi.number().description("Maximum size of uploaded files"),
  })
  .unknown()
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const createPath = (dir: string | undefined): string | undefined => {
  if (!dir) {
    return undefined;
  }
  return dir.replaceAll("/", path.sep);
};

const defaultOptions = {
  location: "local",
  tmpDir: path.join("storage", "tmp") + path.sep,
  uploadDir: path.join("storage", "uploads") + path.sep,
  maxFileSize: 100e6,
};

const storageOptions = {
  location: envVars.STORAGE_LOCATION ?? defaultOptions.location,
  tmpDir: createPath(envVars.TMP_DIR) ?? defaultOptions.tmpDir,
  uploadDir: createPath(envVars.UPLOAD_DIR) ?? defaultOptions.uploadDir,
  maxFileSize: envVars.MAX_FILE_SIZE ?? defaultOptions.maxFileSize,
};

{
  if (storageOptions.tmpDir) {
    fse.ensureDirSync(storageOptions.tmpDir);
  }
  if (storageOptions.uploadDir) {
    fse.ensureDirSync(storageOptions.uploadDir);
  }
}

export default storageOptions;
