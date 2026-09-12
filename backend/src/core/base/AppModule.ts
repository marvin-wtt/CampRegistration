import type { Router } from 'express';
import type { ScopedPermissions } from '@camp-registration/common/permissions';
import type { ModuleRouter } from '#core/router/ModuleRouter';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import type { ScopeResolvers } from '#core/permission/permission.guard';
import type {
  BindOptions,
  ModuleOptions,
  CoreModule,
} from '#core/base/CoreModule';

export type { BindOptions, ModuleOptions };

export type AppRouter = Router & {
  useRouter: (path: string, router: ModuleRouter) => void;
};

export interface AppModule extends CoreModule {
  registerRoutes?(router: AppRouter): void;

  registerWebRoutes?(router: AppRouter): void;

  registerPermissions?(): ScopedPermissions;

  /**
   * The other half of a scope declaration: how a request becomes a permission
   * set. Separate from `registerPermissions()` because the cardinality differs
   * — grants are additive across modules, a resolver belongs to exactly the one
   * module owning the scope's membership table.
   */
  registerScopeResolvers?(): ScopeResolvers;

  registerJobs?(scheduler: JobScheduler): void;
}
