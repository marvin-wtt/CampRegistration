import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { FileRouter } from '#app/file/file.routes';
import { unregisterAllFileGuards } from '#app/file/file.guard';
import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';
import { FileController } from '#app/file/file.controller';
import logger from '#core/logger';

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
    scheduler.schedule('tmp-file-cleanup', '0 * * * *', async () => {
      const count = await resolve(FileService).deleteTempFiles();
      logger.info(
        `Deleted ${count.toString()} unused temporary file(s) from disk`,
      );
    });
    // Order matters: `deleteUnassignedFiles` drops the File rows before
    // removing their blobs, so a failed removal leaves a blob no row points at
    // any more. `deleteUnreferencedFiles` is the sweeper for exactly that, and
    // only sees the leftovers once the rows are gone — it has to run second.
    scheduler.schedule('unassigned-file-cleanup', '15 4 * * *', () =>
      resolve(FileService).deleteUnassignedFiles(),
    );
    scheduler.schedule('unused-file-cleanup', '15 5 * * *', async () => {
      const results = await resolve(FileService).deleteUnreferencedFiles();
      for (const { location, count } of results) {
        logger.info(
          `Deleted ${count.toString()} file(s) from ${location} storage`,
        );
      }
    });
  }

  async shutdown() {
    await resolve(FileService).close();

    unregisterAllFileGuards();
  }
}
