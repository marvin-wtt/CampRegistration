import type {
  AppModule,
  AppRouter,
  BindOptions,
  JobScheduler,
} from '#core/base/AppModule';
import { FileRouter } from '#app/file/file.routes';
import { unregisterAllFileGuards } from '#app/file/file.guard';
import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';
import { FileController } from '#app/file/file.controller';
import {
  CleanTempFilesJob,
  CleanUnassignedFilesJob,
  CleanUnusedFilesJob,
} from '#app/file/file.job';

export class FileModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(FileService).toSelf().inSingletonScope();
    options.bind(FileController).toSelf().inSingletonScope();
    options.bind(FileRouter).toSelf().inSingletonScope();

    options.bind(CleanUnassignedFilesJob).toSelf().inSingletonScope();
    options.bind(CleanTempFilesJob).toSelf().inSingletonScope();
    options.bind(CleanUnusedFilesJob).toSelf().inSingletonScope();
  }

  registerJobs(options: JobScheduler) {
    options.schedule(resolve(CleanUnassignedFilesJob));
    options.schedule(resolve(CleanTempFilesJob));
    options.schedule(resolve(CleanUnusedFilesJob));
  }

  registerRoutes(router: AppRouter) {
    router.useRouter('/files', resolve(FileRouter));
  }

  async shutdown() {
    await resolve(FileService).close();

    unregisterAllFileGuards();
  }
}
