import { inject } from 'inversify';
import { TYPES } from './types.js';

/**
 * Injects the application config.
 *
 * Usage:
 *   constructor(@Config() private readonly config: AppConfig) {}
 */
export function Config(): ParameterDecorator {
  return inject(TYPES.Config);
}
