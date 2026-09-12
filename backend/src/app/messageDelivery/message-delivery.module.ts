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

  registerRoutes() {
    registerFileGuard('messageDelivery', {
      view: messageDeliveryFileGuard,
    });
  }

  async configure(): Promise<void> {
    await resolve(BounceReader).verify();
  }

  registerJobs(scheduler: JobScheduler): void {
    // Requesting DSN on outgoing mail is pointless without something to read
    // the reports back — see RegistrationTemplateMessage.requestDsn().
    if (!config.email.bounce) {
      return;
    }

    const bounceReader = resolve(BounceReader);
    // The reader only acknowledges the mailbox once `processBounceResults`
    // has resolved, so a failure here leaves the reports for the next poll
    // instead of dropping them.
    scheduler.schedule('bounce-mailbox-poll', '*/5 * * * *', async () => {
      await bounceReader.pollOnce(processBounceResults);
    });
  }
}
