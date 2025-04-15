import type { Express, Router } from 'express';

export interface ModuleOptions {
  app: Express;
  router: Router;
}

export interface AppModule {
  configure(options: ModuleOptions): Promise<void> | void;
}
