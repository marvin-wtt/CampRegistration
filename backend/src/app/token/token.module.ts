import type { AppModule, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { TokenService } from '#app/token/token.service';
import { resolve } from '#core/ioc/container';

export class TokenModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TokenService).toSelf().inSingletonScope();
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('expired-token-cleanup', '0 3 * * *', () =>
      resolve(TokenService).purgeExpiredTokens(),
    );
  }
}
