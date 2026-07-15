import { z } from 'zod';
import { MainEnvSchema } from './main.schema.js';
import { AuthEnvSchema } from './auth.schema.js';
import { EmailEnvSchema } from './email.schema.js';
import { StorageEnvSchema } from './storage.schema.js';
import { CsrfEnvSchema } from './csrf.schema.js';
import { DatabaseEnvSchema } from './database.schema.js';
import { RedisEnvSchema } from './redis.schema.js';
import { QueueEnvSchema } from './queue.schema.js';
import { RealtimeEnvSchema } from './realtime.schema.js';
import { TranslationEnvSchema } from './translation.schema.js';

export const EnvSchema = z
  .object({})
  .and(MainEnvSchema)
  .and(DatabaseEnvSchema)
  .and(AuthEnvSchema)
  .and(EmailEnvSchema)
  .and(StorageEnvSchema)
  .and(CsrfEnvSchema)
  .and(RedisEnvSchema)
  .and(QueueEnvSchema)
  .and(RealtimeEnvSchema)
  .and(TranslationEnvSchema)
  .readonly();

export type Env = z.output<typeof EnvSchema>;
