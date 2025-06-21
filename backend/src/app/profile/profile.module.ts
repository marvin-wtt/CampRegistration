import type { AppModule, AppRouter } from '#core/base/AppModule';
import { ProfileRouter } from '#app/profile/profile.routes';

export class ProfileModule implements AppModule {
  registerRoutes(router: AppRouter): void {
    router.useRouter('/profile', new ProfileRouter());
  }
}
