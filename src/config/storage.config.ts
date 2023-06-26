import Joi from "joi";

const { value: envVars, error } = Joi.object()
  .keys({
    TMP_DIR: Joi.string().description(
      "Directory where unprocessed files are stored"
    ),
    UPLOAD_DIR: Joi.string().description(
      "Directory where uploaded files are stored"
    ),
  })
  .unknown()
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const defaultOptions = {
  tmpDir: "storage/tmp/",
  uploadDir: "storage/uploads/",
};

const storageOptions = {
  tmpDir: envVars.TMP_DIR ?? defaultOptions.tmpDir,
  uploadDir: envVars.UPLOAD_DIR ?? defaultOptions.uploadDir,
};

export default storageOptions;
