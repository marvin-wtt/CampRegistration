import { validateEnv } from '#core/validation/env';
import dotenv from 'dotenv';
import { appPath } from '#utils/paths';

dotenv.config({
  path: appPath('.env'),
});

import { EnvSchema } from './schemas/index.js';

export const env = validateEnv(EnvSchema);
