import type { AppModule, AppRouter } from '#core/base/AppModule';
import feedbackRoutes from '#app/feedback/feedback.routes';

export class FeedbackModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.use('/feedback', feedbackRoutes);
  }
}
