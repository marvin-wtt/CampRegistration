import type { AppRouter, BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import type { JobScheduler } from '#core/scheduler/JobScheduler';
import { MailService } from '#core/mail/mail.service';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#core/mail/mail.registry';
import { BounceReader } from '#core/mail/drivers/smtp/bounce.reader';

/**
 * Provides the mail mechanism, nothing domain-specific: feature modules
 * register a bounce handler via `MailService.onBounce()`, which pushes it
 * into the active mailer. That mailer alone decides how — and whether — to
 * detect bounces; this module just mounts whatever route/job it describes
 * (`IMailer.getBounceWebhook`/`getBouncePollJob`). `BounceReader` is bound
 * here only for `SmtpMailer` to resolve; this module never touches it.
 */
export class MailModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(MailableRegistry).toSelf().inSingletonScope();
    options.bind(MailService).toSelf().inSingletonScope();
    options.bind(BounceReader).toSelf().inSingletonScope();
  }

  async configure() {
    await resolve(MailService).connect();
  }

  registerApiRoutes(router: AppRouter): void {
    const webhook = resolve(MailService).getMailer().getBounceWebhook?.();
    if (webhook) {
      router.post(`/webhooks${webhook.path}`, webhook.handler);
    }
  }

  registerJobs(scheduler: JobScheduler): void {
    const run = resolve(MailService).getMailer().getBouncePollJob?.();
    if (run) {
      scheduler.schedule('bounce-mailbox-poll', '*/5 * * * *', run);
    }
  }

  ready() {
    resolve(MailService).startWorker();
  }

  async shutdown(): Promise<void> {
    await resolve(MailService).close();
  }
}
