import type { Express, Router } from 'express';
import type {
  ManagerRole,
  Permission,
} from '@camp-registration/common/permissions';
import type { ModuleRouter } from '#core/router/ModuleRouter';

export type AppRouter = Router & {
  useRouter: (path: string, router: ModuleRouter) => void;
};

export interface ModuleOptions {
  app: Express;
}

export type RoleToPermissions<T extends Permission> = Partial<
  Record<ManagerRole, T[]>
>;

export interface AppModule {
  configure?(options: ModuleOptions): Promise<void> | void;

  registerRoutes?(router?: Router): void;

  registerPermissions?(): RoleToPermissions<Permission>;
}
