import type { Router } from 'express';
import type {
  ManagerRole,
  NewsletterManagerRole,
  Permission,
  NewsletterPermission,
} from '@camp-registration/common/permissions';
import type { ModuleRouter } from '#core/router/ModuleRouter';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import type { ContainerModuleLoadOptions } from 'inversify';

export type AppRouter = Router & {
  useRouter: (path: string, router: ModuleRouter) => void;
};

export type ModuleOptions = object;

export type BindOptions = ContainerModuleLoadOptions;

export type RoleToPermissions<
  TRole extends string,
  TPermission extends string,
> = Partial<Record<TRole, TPermission[]>>;

export interface AppModule {
  configure?(options: ModuleOptions): Promise<void> | void;

  bindContainers?(options: BindOptions): void;

  registerRoutes?(router: AppRouter): void;

  registerPermissions?(): RoleToPermissions<ManagerRole, Permission>;

  registerNewsletterPermissions?(): RoleToPermissions<
    NewsletterManagerRole,
    NewsletterPermission
  >;

  registerJobs?(scheduler: JobScheduler): void;

  shutdown?(): Promise<void> | void;
}
