import type { AppModule } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import apiRouter from '#routes/api';
import webRouter from '#routes/web';
import { createAppModules, createCoreModules } from '#modules';
import { permissionRegistry } from '#core/permission/permission.registry';
import {
  assertScopeResolversComplete,
  registerScopeResolver,
} from '#core/permission/permission.guard';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { ContainerModule } from 'inversify';
import { container, resolve } from '#core/ioc/container';
import logger from '#core/logger';

type Module = CoreModule | AppModule;

let allModules: Module[] = [];

export interface BootOptions {
  overrideBindings?: () => void;
}

export async function boot(options: BootOptions = {}) {
  const coreModules = createCoreModules();
  const appModules = createAppModules();

  // Core modules boot first and shut down last.
  allModules = [...coreModules, ...appModules];
  bindModuleContainers(allModules);
  options.overrideBindings?.();

  await configureModules(allModules);

  registerModulePermissions(appModules);
  registerModuleScopeResolvers(appModules);
  registerModuleRoutes(appModules);
  registerModuleWebRoutes(appModules);
  registerModuleJobs(appModules);

  await startModules(allModules);
}

export async function shutdown() {
  quiesceModules(allModules);

  await shutdownModules(allModules);
}

// Runs before any module's shutdown() — see CoreModule.quiesce().
function quiesceModules(modules: Module[]) {
  for (const module of modules) {
    module.quiesce?.();
  }
}

function bindModuleContainers(modules: Module[]) {
  container.load(
    ...modules.map(
      (module) =>
        new ContainerModule((options) => {
          module.bindContainers?.(options);
        }),
    ),
  );
}

async function configureModules(modules: Module[]) {
  for (const module of modules) {
    await module.configure?.({});
  }
}

async function startModules(modules: Module[]) {
  for (const module of modules) {
    await module.ready?.();
  }
}

function registerModulePermissions(modules: AppModule[]) {
  for (const module of modules) {
    const scoped = module.registerPermissions?.();
    if (scoped) {
      permissionRegistry.registerAll(scoped);
    }
  }
}

function registerModuleScopeResolvers(modules: AppModule[]) {
  for (const module of modules) {
    const declared = module.registerScopeResolvers?.();
    if (!declared) {
      continue;
    }

    for (const scope of PERMISSION_SCOPES) {
      const resolver = declared[scope];
      if (resolver) {
        registerScopeResolver(scope, resolver);
      }
    }
  }

  assertScopeResolversComplete();
}

function registerModuleRoutes(modules: AppModule[]) {
  for (const module of modules) {
    module.registerApiRoutes?.(apiRouter);
  }
}

function registerModuleWebRoutes(modules: AppModule[]) {
  for (const module of modules) {
    module.registerWebRoutes?.(webRouter);
  }
}

function registerModuleJobs(modules: AppModule[]) {
  const scheduler = resolve(JobScheduler);
  for (const module of modules) {
    module.registerJobs?.(scheduler);
  }
}

// Reverse boot order, so every AppModule shuts down while the core mechanisms
// it may still use are up. A failing module must not skip the rest.
async function shutdownModules(modules: Module[]) {
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
