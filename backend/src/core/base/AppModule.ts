import type { Express, Router } from 'express';
import type {
  ManagerRole,
  Permission,
} from '@camp-registration/common/permissions';

export interface ModuleOptions {
  app: Express;
  router: Router;
}

export type RoleToPermissions<T extends Permission> = Partial<
  Record<ManagerRole, T[]>
>;

export interface AppModule {
  configure(options: ModuleOptions): Promise<void> | void;

  registerPermissions?(): RoleToPermissions<Permission>;
}
