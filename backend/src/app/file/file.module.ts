import type { AppModule, AppRouter } from '#core/base/AppModule';
import { FileRouter } from '#app/file/file.routes';
import { registerRouteModelBinding } from '#core/router';
import fileService from './file.service.js';

export class FileModule implements AppModule {
  configure(): Promise<void> | void {
    registerRouteModelBinding('file', (_req, id) =>
      fileService.getFileById(id),
    );
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/files', new FileRouter());
  }
}
