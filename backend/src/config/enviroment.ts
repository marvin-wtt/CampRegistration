import { validateEnv } from '#core/validation/env.js';
import dotenv from 'dotenv';
dotenv.config();

import { EnvSchema } from './schemas/index.js';

process.env.NODE_ENV = 'production';

export const env = validateEnv(EnvSchema);
