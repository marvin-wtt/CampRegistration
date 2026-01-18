import { Container, type ServiceIdentifier } from 'inversify';
import { TYPES } from './types.js';
import config, { type AppConfig } from '#config/index';
import { QueueManager } from '#core/queue/QueueManager';

export const container = new Container({
  defaultScope: 'Singleton',
});

// Basic binding: config
container.bind<AppConfig>(TYPES.Config).toConstantValue(config);

container.bind(QueueManager).toSelf().inSingletonScope();

// Optional tiny helper (nice ergonomics)
export function resolve<T>(id: ServiceIdentifier<T>) {
  return container.get<T>(id);
}

export function bindSingleton<T>(id: ServiceIdentifier<T>) {
  container.bind(id).toSelf().inSingletonScope();
}
