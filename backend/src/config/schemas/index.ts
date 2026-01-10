import { z } from 'zod';
import { MainEnvSchema } from './main.schema.js';
import { AuthEnvSchema } from './auth.schema.js';
import { EmailEnvSchema } from './email.schema.js';
import { StorageEnvSchema } from './storage.schema.js';
import { CsrfEnvSchema } from './csrf.schema.js';
import { DatabaseSchema } from './database.schema.js';

export const EnvSchema = z
  .object({
    ...MainEnvSchema.shape,
    ...DatabaseSchema.shape,
    ...AuthEnvSchema.shape,
    ...EmailEnvSchema.shape,
    ...StorageEnvSchema.shape,
    ...CsrfEnvSchema.shape,
  })
  .readonly();
