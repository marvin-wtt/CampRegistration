import type { ContainerModuleLoadOptions } from 'inversify';

export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export interface CoreModule {
  bindContainers?(options: BindOptions): void;

  configure?(options: ModuleOptions): Promise<void> | void;

  /**
   * Stops this mechanism from generating new work — e.g. the scheduler
   * halting cron jobs — before any module's `shutdown()` runs. Unlike
   * `shutdown()`, this isn't ordered relative to other modules: it runs for
   * every module up front, synchronously, so nothing can trigger new work
   * once the shutdown sequence has started.
   */
  quiesce?(): void;

  shutdown?(): Promise<void> | void;
}
