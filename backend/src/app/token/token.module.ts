import type {
  AppModule,
  BindOptions,
  JobScheduler,
} from '#core/base/AppModule';
import { TokenService } from '#app/token/token.service';
import { resolve } from '#core/ioc/container';
import { ExpiredTokenJob } from '#app/token/token.job';

export class TokenModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(TokenService).toSelf().inSingletonScope();

    options.bind(ExpiredTokenJob).toSelf().inSingletonScope();
  }

  registerJobs(options: JobScheduler) {
    options.schedule(resolve(ExpiredTokenJob));
  }
}
