import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import fileRoutes from '#app/file/file.routes';
import { registerRouteModelBinding } from '#core/router';
import fileService from './file.service.js';

export class FileModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    registerRouteModelBinding('file', (_req, id) =>
      fileService.getFileById(id),
    );

    router.use('/files', fileRoutes);
  }
}
