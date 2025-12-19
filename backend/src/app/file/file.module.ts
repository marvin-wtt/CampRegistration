import type { AppModule, AppRouter } from '#core/base/AppModule';
import { FileRouter } from '#app/file/file.routes';
import { fileQueue } from '#app/file/file.queue';
import fileService from '#app/file/file.service';
import { unregisterAllFileGuards } from '#app/file/file.guard.js';

export class FileModule implements AppModule {
  configure() {
    fileQueue.process(async (job) => {
      if (job.name === 'upload') {
        await fileService.uploadFile(job.payload);
        return;
      }

      throw new Error(`Unknown file job: "${job.name}"`);
    });
  }

  registerRoutes(router: AppRouter) {
    router.useRouter('/files', new FileRouter());
  }

  async shutdown() {
    await fileQueue.close();

    unregisterAllFileGuards();
  }
}
