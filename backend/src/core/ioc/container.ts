import { Container, type ServiceIdentifier } from 'inversify';
import { TYPES } from './types.js';
import config, { type AppConfig } from '#config/index';

export const container = new Container({
  defaultScope: 'Singleton',
});

// Basic binding: config
container.bind<AppConfig>(TYPES.Config).toConstantValue(config);

// Optional tiny helper (nice ergonomics)
export function resolve<T>(id: ServiceIdentifier<T>) {
  return container.get<T>(id);
}

export function bindSingleton<T>(id: ServiceIdentifier<T>) {
  container.bind(id).toSelf().inSingletonScope();
}
