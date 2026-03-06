import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import { ProfileRouter } from '#app/profile/profile.routes';
import { ProfileController } from '#app/profile/profile.controller';

export class ProfileModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(ProfileController).toSelf().inSingletonScope();
  }

  registerRoutes(router: AppRouter): void {
    router.useRouter('/profile', new ProfileRouter());
  }
}
