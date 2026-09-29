import type { AppModule, AppRouter } from '#core/base/AppModule';
import { createSeoRouter } from '#app/seo/seo.routes';

export class SeoModule implements AppModule {
  registerWebRoutes(router: AppRouter): void {
    router.use(createSeoRouter());
  }
}
