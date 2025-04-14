import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import httpStatus from 'http-status';

export class HealthModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    // Simple health check to see if the API is available
    router.get('/health', (_req, res) => {
      res.sendStatus(httpStatus.OK);
    });
  }
}
