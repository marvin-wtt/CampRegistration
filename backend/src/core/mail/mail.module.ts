import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { MailService } from '#core/mail/mail.service';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#core/mail/mail.registry';
import { BounceReader } from '#core/mail/bounce.reader';

/**
 * Provides the mail mechanism (the {@link MailService} sender/queue, the
 * {@link MailableRegistry}, and the {@link BounceReader} for async bounce
 * detection). It registers no routes and has no knowledge of feature
 * mailables or how a bounce should be handled — each feature module defines
 * its own `MailBase` subclasses and, if it cares about bounces, its own
 * scheduled job that polls `BounceReader` and reacts, so dependencies point
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

  async shutdown(): Promise<void> {
    await resolve(MailService).close();
  }
}
