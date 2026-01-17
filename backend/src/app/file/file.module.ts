import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { FileRouter } from '#app/file/file.routes';
import { unregisterAllFileGuards } from '#app/file/file.guard';
import { FileService } from '#app/file/file.service';
import { resolve } from '#core/ioc/container';

export class FileModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(FileService).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter) {
    router.useRouter('/files', new FileRouter());
  }

  async shutdown() {
    await resolve(FileService).close();

    unregisterAllFileGuards();
  }
}
