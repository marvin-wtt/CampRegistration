import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { AuthRouter } from '#app/auth/auth.routes';
import { AuthController } from '#app/auth/auth.controller';
import { AuthService } from '#app/auth/auth.service';
import { MailableRegistry } from '#app/mail/mail.registry';
import {
  ResetPasswordMessage,
  VerifyEmailMessage,
} from '#app/auth/auth.messages';
import { resolve } from '#core/ioc/container';

export class AuthModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(AuthService).toSelf().inSingletonScope();
    options.bind(AuthController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    resolve(MailableRegistry).register(VerifyEmailMessage);
    resolve(MailableRegistry).register(ResetPasswordMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/auth', new AuthRouter());
  }
}
