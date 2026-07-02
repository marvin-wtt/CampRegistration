import type { AppModule } from '#core/base/AppModule';
import apiRouter from '#routes/api';
import { createModules } from './modules.js';
import {
  campPermissionRegistry,
  newsletterPermissionRegistry,
} from '#core/permission-registry';
import { initI18n } from '#core/i18n';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { verifyDatabaseConnection, disconnectDatabase } from '#core/database';
import { ContainerModule } from 'inversify';
import { container, resolve } from '#core/ioc/container';
import logger from '#core/logger';

let modules: AppModule[] = [];

export async function boot() {
  await verifyDatabaseConnection();

  await initI18n();

  modules = createModules();

  bindModuleContainers(modules);
  await configureModules(modules);
  registerModulePermissions(modules);
  registerModuleRoutes(modules);
  registerModuleJobs(modules);
}

export async function shutdown() {
  resolve(JobScheduler).stop();

  await shutdownModules(modules);

  await disconnectDatabase();
}

function bindModuleContainers(modules: AppModule[]) {
  container.load(
    ...modules.map(
      (module) =>
        new ContainerModule((options) => {
          module.bindContainers?.(options);
        }),
    ),
  );
}

async function configureModules(modules: AppModule[]) {
  for (const module of modules) {
    await module.configure?.({});
  }
}

function registerModulePermissions(modules: AppModule[]) {
  for (const module of modules) {
    if (module.registerPermissions) {
      campPermissionRegistry.registerAll(module.registerPermissions());
    }
    if (module.registerNewsletterPermissions) {
      newsletterPermissionRegistry.registerAll(
        module.registerNewsletterPermissions(),
      );
    }
  }
}

function registerModuleRoutes(modules: AppModule[]) {
  for (const module of modules) {
    module.registerRoutes?.(apiRouter);
  }
}

function registerModuleJobs(modules: AppModule[]) {
  const scheduler = resolve(JobScheduler);
  for (const module of modules) {
    module.registerJobs?.(scheduler);
  }
}

// Modules are shut down in reverse boot order so that later modules can rely
// on earlier ones during teardown (e.g. queue handlers still need the mail
// transport). A failing module must not prevent the remaining cleanup.
async function shutdownModules(modules: AppModule[]) {
  for (const module of modules.toReversed()) {
    try {
      await module.shutdown?.();
    } catch (err: unknown) {
      logger.error(
        `Failed to shut down module ${module.constructor.name}`,
        err,
      );
    }
  }
}
