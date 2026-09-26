import type { ScopedPermissions } from '@camp-registration/common/permissions';
import type { ScopeResolvers } from '#core/permission/permission.guard';
import type {
  AppRouter,
  BindOptions,
  ModuleOptions,
  CoreModule,
} from '#core/base/CoreModule';

export type { AppRouter, BindOptions, ModuleOptions };

export interface AppModule extends CoreModule {
  registerWebRoutes?(router: AppRouter): void;

  registerPermissions?(): ScopedPermissions;

  /**
   * The other half of a scope declaration: how a request becomes a permission
   * set. Separate from `registerPermissions()` because the cardinality differs
   * — grants are additive across modules, a resolver belongs to exactly the one
   * module owning the scope's membership table.
   */
  registerScopeResolvers?(): ScopeResolvers;
}
