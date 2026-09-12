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

  registerJobs(scheduler: JobScheduler): void {
    // Requesting DSN on outgoing mail is pointless without something to read
    // the reports back — see RegistrationTemplateMessage.dsn().
    if (!config.email.bounce) {
      return;
    }

    const bounceReader = resolve(BounceReader);
    scheduler.schedule('bounce-mailbox-poll', '*/5 * * * *', async () => {
      await processBounceResults(await bounceReader.pollOnce());
    });
  }
}
