import type { ContainerModuleLoadOptions } from 'inversify';
import type { Router } from 'express';
import type { ModuleRouter } from '#core/router/ModuleRouter';
import type { JobScheduler } from '#core/scheduler/JobScheduler';

export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export type AppRouter = Router & {
  useRouter: (path: string, router: ModuleRouter) => void;
};

export interface CoreModule {
  bindContainers?(options: BindOptions): void;

  configure?(options: ModuleOptions): Promise<void> | void;

  /**
   * Mount routes under /api/v1. Declared here (not just on `AppModule`) so a
   * cross-cutting mechanism can own wiring that depends on its own active
   * configuration — e.g. mail mounting a provider's bounce webhook only when
   * that provider is the configured driver — without a feature module
   * reaching back into it to do so on its behalf.
   */
  registerApiRoutes?(router: AppRouter): void;

  /** Recurring cron jobs — see `registerApiRoutes` for why this lives here too. */
  registerJobs?(scheduler: JobScheduler): void;

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
