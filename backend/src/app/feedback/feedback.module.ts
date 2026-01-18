import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { FeedbackRouter } from '#app/feedback/feedback.routes';
import { resolve } from '#core/ioc/container';
import { FeedbackController } from '#app/feedback/feedback.controller';

export class FeedbackModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(FeedbackController).toSelf().inSingletonScope();
    options.bind(FeedbackRouter).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/feedback', resolve(FeedbackRouter));
  }
}
