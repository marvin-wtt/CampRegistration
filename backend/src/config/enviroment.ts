import { validateEnv } from '#core/validation/env';
import dotenv from 'dotenv';
import { appPath } from '#utils/paths';

dotenv.config({
  path: appPath('.env'),
  quiet: true,
});

import { EnvSchema, type Env } from './schemas/index.js';

export const env: Env = validateEnv(EnvSchema);
