import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { MailService } from '#core/mail/mail.service';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#core/mail/mail.registry';
import { BounceReader } from '#core/mail/bounce.reader';

/**
 * Provides the mail mechanism and nothing domain-specific: feature modules
 * define their own `MailBase` subclasses and, if they care about bounces,
 * their own job polling {@link BounceReader}, so dependencies point
 * feature → mail only.
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

  ready() {
    resolve(MailService).startWorker();
  }

  async shutdown(): Promise<void> {
    await resolve(MailService).close();
  }
}
