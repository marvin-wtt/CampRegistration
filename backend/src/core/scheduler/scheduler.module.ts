import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { JobScheduler } from '#core/scheduler/JobScheduler';
import { resolve } from '#core/ioc/container';

export class SchedulerModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(JobScheduler).toSelf().inSingletonScope();
  }

  quiesce(): void {
    resolve(JobScheduler).stop();
  }
}
