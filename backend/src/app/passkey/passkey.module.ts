import type { AppModule, AppRouter, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { PasskeyRouter } from '#app/passkey/passkey.routes';
import { PasskeyController } from '#app/passkey/passkey.controller';
import { PasskeyService } from '#app/passkey/passkey.service';
import { resolve } from '#core/ioc/container';
import logger from '#core/logger';

export class PasskeyModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(PasskeyService).toSelf().inSingletonScope();
    options.bind(PasskeyController).toSelf().inSingletonScope();
  }

  registerApiRoutes(router: AppRouter): void {
    router.useRouter('/passkeys', new PasskeyRouter());
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule(
      'passkey-challenge-cleanup',
      '*/15 * * * *',
      async () => {
        const count = await resolve(PasskeyService).purgeExpiredChallenges();
        logger.info(`Deleted ${count.toString()} expired passkey challenge(s)`);
      },
    );
  }
}
