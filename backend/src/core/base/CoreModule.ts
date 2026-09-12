import type { ContainerModuleLoadOptions } from 'inversify';

export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export interface CoreModule {
  bindContainers?(options: BindOptions): void;

  configure?(options: ModuleOptions): Promise<void> | void;

  /**
   * Runs last in boot, after every `configure()` and every registration.
   * Start anything that consumes what other modules register here (e.g. a
   * queue worker), so it can't run ahead of them.
   */
  ready?(): Promise<void> | void;

  /**
   * Stops the module generating new work (e.g. halting cron jobs). Runs
   * synchronously for every module before any `shutdown()` does, so nothing
   * starts new work mid-teardown.
   */
  quiesce?(): void;

  shutdown?(): Promise<void> | void;
}
