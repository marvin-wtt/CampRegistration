import type {
  AppModule,
  AppRouter,
  BindOptions,
  ModuleOptions,
} from '#core/base/AppModule';
import { AuthRouter } from '#app/auth/auth.routes';
import { AuthController } from '#app/auth/auth.controller';
import { AuthService } from '#app/auth/auth.service';
import { registerMailable } from '#app/mail/mail.registry';
import {
  ResetPasswordMessage,
  VerifyEmailMessage,
} from '#app/auth/auth.messages';

export class AuthModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(AuthService).toSelf().inSingletonScope();
    options.bind(AuthController).toSelf().inSingletonScope();
  }

  configure(_options: ModuleOptions): Promise<void> | void {
    registerMailable(VerifyEmailMessage);
    registerMailable(ResetPasswordMessage);
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/auth', new AuthRouter());
  }
}
