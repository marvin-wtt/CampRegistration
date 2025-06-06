// config/schemas/index.js
import { MainEnvSchema } from './main.schema.js';
import { AuthEnvSchema } from './auth.schema.js';
import { EmailEnvSchema } from './email.schema.js';
import { StorageEnvSchema } from './storage.schema.js';
import { CsrfEnvSchema } from './csrf.schema.js';

export const EnvSchema = MainEnvSchema.merge(AuthEnvSchema)
  .merge(EmailEnvSchema)
  .merge(StorageEnvSchema)
  .merge(CsrfEnvSchema)
  .readonly();
