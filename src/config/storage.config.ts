import Joi from "joi";
import path from "path";

const { value: envVars, error } = Joi.object()
  .keys({
    TMP_DIR: Joi.string().description(
      "Directory where unprocessed files are stored"
    ),
    UPLOAD_DIR: Joi.string().description(
      "Directory where uploaded files are stored"
    ),
    STORAGE_LOCATION: Joi.string().description(
      "Location where new files should be stored to"
    ),
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
};

const storageOptions = {
  location: envVars.STORAGE_LOCATION ?? defaultOptions.location,
  tmpDir: envVars.TMP_DIR ?? defaultOptions.tmpDir,
  uploadDir: envVars.UPLOAD_DIR ?? defaultOptions.uploadDir,
};

export default storageOptions;
