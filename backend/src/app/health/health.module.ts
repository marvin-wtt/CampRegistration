import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { resolve } from '#core/ioc/container';
import { HealthService } from '#app/health/health.service';
import httpStatus from 'http-status';

export class HealthModule implements AppModule {
  bindContainers(options: BindOptions): void {
    options.bind(HealthService).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.get('/health', async (_req, res) => {
      const health = await resolve(HealthService).check();
      const status =
        health.status === 'ok' ? httpStatus.OK : httpStatus.SERVICE_UNAVAILABLE;

      res.status(status).json(health);
    });
  }
}
