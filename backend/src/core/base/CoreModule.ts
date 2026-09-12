import type { ContainerModuleLoadOptions } from 'inversify';

export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export interface CoreModule {
  bindContainers?(options: BindOptions): void;

  configure?(options: ModuleOptions): Promise<void> | void;

  shutdown?(): Promise<void> | void;
}
