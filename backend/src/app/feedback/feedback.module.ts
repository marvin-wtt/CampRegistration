import type { AppModule, ModuleOptions } from '#core/base/AppModule';
import feedbackRoutes from '#app/feedback/feedback.routes';

export class FeedbackModule implements AppModule {
  configure({ router }: ModuleOptions): Promise<void> | void {
    router.use('/feedback', feedbackRoutes);
  }
}
