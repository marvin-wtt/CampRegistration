import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { JobScheduler } from '#core/scheduler/JobScheduler';

export class SchedulerModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(JobScheduler).toSelf().inSingletonScope();
  }
}
