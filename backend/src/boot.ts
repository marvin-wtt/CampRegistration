import type { AppModule } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import apiRouter from '#routes/api';
import webRouter from '#routes/web';
import { createAppModules, createCoreModules } from '#modules';
import { permissionRegistry } from '#core/permission-registry';
import {
  assertScopeResolversComplete,
  registerScopeResolver,
} from '#core/permission.guard';
import { PERMISSION_SCOPES } from '@camp-registration/common/permissions';
import { initI18n } from '#core/i18n';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { ContainerModule } from 'inversify';
import { container, resolve } from '#core/ioc/container';
import logger from '#core/logger';

type Module = CoreModule | AppModule;

let allModules: Module[] = [];

export async function boot() {
  await initI18n();

  const coreModules = createCoreModules();
  const appModules = createAppModules();

  // Core modules are listed first so every one of them finishes configuring
  // before any AppModule's configure() runs — see CoreModule's doc comment.
  // Bind order itself is irrelevant: container.load() only registers, it
  // never resolves. Reversing this same order at shutdown then naturally
  // shuts every AppModule down before any core module — see shutdownModules.
  allModules = [...coreModules, ...appModules];
  bindModuleContainers(allModules);
  await configureModules(allModules);

  registerModulePermissions(appModules);
  registerModuleScopeResolvers(appModules);
  registerModuleRoutes(appModules);
  registerModuleWebRoutes(appModules);
  registerModuleJobs(appModules);
}

export async function shutdown() {
  resolve(JobScheduler).stop();

  await shutdownModules(allModules);
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
    module.registerRoutes?.(apiRouter);
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

// Modules are shut down in reverse boot order so that later modules can rely
// on earlier ones during teardown. Since `allModules` lists core modules
// before app modules (see boot()), reversing it shuts every AppModule down
// first and every core module (mail, realtime, the queue and scheduler
// backplanes) after — so a cross-cutting mechanism stays up through every
// AppModule's own shutdown. A failing module must not prevent the remaining
// cleanup.
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
