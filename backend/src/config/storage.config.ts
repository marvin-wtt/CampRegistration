import Joi from "joi";
import path from "path";

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
    MAX_FILE_SIZE: Joi.string().description("Maximum size of uploaded files"),
  })
  .unknown()
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const defaultOptions = {
  location: "local",
  tmpDir: path.join("storage", "tmp") + path.sep,
  uploadDir: path.join("storage", "uploads") + path.sep,
  maxFileSize: 100e6,
};

const storageOptions = {
  location: envVars.STORAGE_LOCATION ?? defaultOptions.location,
  tmpDir: envVars.TMP_DIR ?? defaultOptions.tmpDir,
  uploadDir: envVars.UPLOAD_DIR ?? defaultOptions.uploadDir,
  maxFileSize: envVars.MAX_FILE_SIZE ?? defaultOptions.maxFileSize,
};

export default storageOptions;
