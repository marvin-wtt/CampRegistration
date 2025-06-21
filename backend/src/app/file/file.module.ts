import type { AppModule, AppRouter } from '#core/base/AppModule';
import { FileRouter } from '#app/file/file.routes';

export class FileModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/files', new FileRouter());
  }
}
