import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { FileRouter } from '#app/file/file.routes';
import { unregisterAllFileGuards } from '#app/file/file.guard';
import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';
import { FileController } from '#app/file/file.controller';

export class FileModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(FileService).toSelf().inSingletonScope();
    options.bind(FileController).toSelf().inSingletonScope();
    options.bind(FileRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter) {
    router.useRouter('/files', resolve(FileRouter));
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('tmp-file-cleanup', '0 4 * * *', () =>
      resolve(FileService).deleteTempFiles(),
    );
    scheduler.schedule('unused-file-cleanup', '15 4 * * *', () =>
      resolve(FileService).deleteUnreferencedFiles(),
    );
    scheduler.schedule('unassigned-file-cleanup', '30 4 * * *', () =>
      resolve(FileService).deleteUnassignedFiles(),
    );
  }

  async shutdown() {
    await resolve(FileService).close();

    unregisterAllFileGuards();
  }
}
