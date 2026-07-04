import type { AppModule, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { TokenService } from '#app/token/token.service';
import { resolve } from '#core/ioc/container';
import logger from '#core/logger';

export class TokenModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TokenService).toSelf().inSingletonScope();
  }

  registerJobs(scheduler: JobScheduler): void {
    scheduler.schedule('expired-token-cleanup', '0 3 * * *', async () => {
      const removed = await resolve(TokenService).purgeExpiredTokens();
      logger.info(`Removed ${removed.toString()} expired token(s)`);
    });
  }
}
