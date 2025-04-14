import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import fileRoutes from '#app/file/file.routes';

export class FileModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/files', fileRoutes);
  }
}
