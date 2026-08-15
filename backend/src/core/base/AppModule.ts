import type { Router } from 'express';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import type { ModuleRouter } from '#core/router/ModuleRouter';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import type { ContainerModuleLoadOptions } from 'inversify';

export type AppRouter = Router & {
  useRouter: (path: string, router: ModuleRouter) => void;
};

export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export interface AppModule {
  configure?(options: ModuleOptions): Promise<void> | void;

  bindContainers?(options: BindOptions): void;

  registerRoutes?(router: AppRouter): void;

  registerPermissions?(): ScopedPermissions;

  registerJobs?(scheduler: JobScheduler): void;

  shutdown?(): Promise<void> | void;
}
