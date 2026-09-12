import type { ContainerModuleLoadOptions } from 'inversify';

export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export interface CoreModule {
  bindContainers?(options: BindOptions): void;

  configure?(options: ModuleOptions): Promise<void> | void;

  /**
   * Runs last in boot — after every module's `configure()`, and after
   * permissions, routes, and scheduled jobs have all been registered. Use
   * this instead of `configure()` for anything that starts consuming live
   * app state (e.g. a queue worker that looks up handlers app modules
   * register during their own `configure()`), so it can't run ahead of that
   * registration.
   */
  ready?(): Promise<void> | void;

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
