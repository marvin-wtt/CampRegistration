import type { AppModule, AppRouter } from '#core/base/AppModule';
import { FeedbackRouter } from '#app/feedback/feedback.routes';

export class FeedbackModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/feedback', new FeedbackRouter());
  }
}
