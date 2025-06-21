import { validateEnv } from '#core/validation/env.js';
import dotenv from 'dotenv';
dotenv.config();

import { EnvSchema } from './schemas/index.js';

export const env = validateEnv(EnvSchema);
