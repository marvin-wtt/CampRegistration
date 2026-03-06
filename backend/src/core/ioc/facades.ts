import { container } from './container.js';
import type { AppConfig } from '#config/index';
import { TYPES } from '#core/ioc/types';

export function config() {
  return container.get<AppConfig>(TYPES.Config);
}
