import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { FeedbackRouter } from '#app/feedback/feedback.routes';
import { resolve } from '#core/ioc/container';
import { FeedbackController } from '#app/feedback/feedback.controller';
import { MailableRegistry } from '#app/mail/mail.registry';
import { FeedbackMessage } from '#app/feedback/feedback.messages';

export class FeedbackModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(FeedbackController).toSelf().inSingletonScope();
    options.bind(FeedbackRouter).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    resolve(MailableRegistry).register(FeedbackMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/feedback', resolve(FeedbackRouter));
  }
}
