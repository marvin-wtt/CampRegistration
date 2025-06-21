import type { AppModule, AppRouter } from '#core/base/AppModule';
import httpStatus from 'http-status';

export class HealthModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    // Simple health check to see if the API is available
    router.get('/health', (_req, res) => {
      res.sendStatus(httpStatus.OK);
    });
  }
}
