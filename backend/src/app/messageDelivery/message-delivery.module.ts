import type { AppModule, BindOptions } from '#core/base/AppModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { registerFileGuard } from '#app/file/file.guard';
import { messageDeliveryFileGuard } from '#app/messageDelivery/message-delivery.guard';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import { processBounceResults } from '#app/messageDelivery/message-bounce-notifier';
import { BounceReader } from '#core/mail/bounce.reader';
import { resolve } from '#core/ioc/container';
import config from '#config/index';

export class MessageDeliveryModule implements AppModule {
  bindContainers(options: BindOptions) {
    options.bind(MessageDeliveryService).toSelf().inSingletonScope();
  }

  registerApiRoutes() {
    registerFileGuard('messageDelivery', {
      view: messageDeliveryFileGuard,
    });
  }

  async configure(): Promise<void> {
    await resolve(BounceReader).verify();
  }

  registerJobs(scheduler: JobScheduler): void {
    if (!config.email.bounce) {
      return;
    }

    const bounceReader = resolve(BounceReader);
    // A failure here leaves the reports unacknowledged for the next poll.
    scheduler.schedule('bounce-mailbox-poll', '*/5 * * * *', async () => {
      await bounceReader.pollOnce(processBounceResults);
    });
  }
}
