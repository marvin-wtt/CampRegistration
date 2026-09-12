import type { BindOptions } from '#core/base/AppModule';
import type { CoreModule } from '#core/base/CoreModule';
import { MailService } from '#core/mail/mail.service';
import { resolve } from '#core/ioc/container';
import { MailableRegistry } from '#core/mail/mail.registry';

/**
 * Provides the mail mechanism (the {@link MailService} sender/queue and the
 * {@link MailableRegistry}). It registers no routes and has no knowledge of
 * feature mailables — each feature module defines and registers its own
 * `MailBase` subclasses, so dependencies point feature → mail only.
 */
export class MailModule implements CoreModule {
  bindContainers(options: BindOptions) {
    options.bind(MailableRegistry).toSelf().inSingletonScope();
    options.bind(MailService).toSelf().inSingletonScope();
  }

  async configure() {
    await resolve(MailService).connect();
  }

  async shutdown(): Promise<void> {
    await resolve(MailService).close();
  }
}
