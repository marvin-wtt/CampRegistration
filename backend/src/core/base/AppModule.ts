import type { Router } from 'express';
import type {
  ManagerRole,
  Permission,
} from '@camp-registration/common/permissions';
import type { ModuleRouter } from '#core/router/ModuleRouter';
import type { ContainerModuleLoadOptions } from 'inversify';
import type { AppJob } from '#core/base/AppJob';

export type AppRouter = Router & {
  useRouter: (path: string, router: ModuleRouter) => void;
};

// Convert to interface to allow for more flexibility in the future
export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export type RoleToPermissions<T extends Permission> = Partial<
  Record<ManagerRole, T[]>
>;

export interface JobScheduler {
  schedule: (job: AppJob) => void;
}

export interface AppModule {
  configure?(options: ModuleOptions): Promise<void> | void;

  bindContainers?(options: BindOptions): void;

  registerJobs?(options: JobScheduler): void;

  registerRoutes?(router?: Router): void;

  registerPermissions?(): RoleToPermissions<Permission>;

  shutdown?(): Promise<void> | void;
}
