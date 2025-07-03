import type { AppModule, AppRouter } from '#core/base/AppModule';
import { FileRouter } from '#app/file/file.routes';
import { fileQueue } from '#app/file/file.queue';
import fileService from '#app/file/file.service';

export class FileModule implements AppModule {
  async configure() {
    await fileQueue.process((data) => {
      return fileService.uploadFile(data);
    });
  }

  registerRoutes(router: AppRouter) {
    router.useRouter('/files', new FileRouter());
  }

  async shutdown() {
    await fileQueue.close();
  }
}
