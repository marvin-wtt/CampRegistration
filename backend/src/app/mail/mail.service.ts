import { MailFactory } from '#app/mail/mail.factory';
import logger from '#core/logger';
import type { IMailer } from '#app/mail/mailer.types';
import type { MailableCtor, MailBase } from '#app/mail/mail.base';
import type { Queue } from '#core/queue/Queue';
import { QueueManager } from '#core/queue/QueueManager';
import { MailableRegistry } from '#app/mail/mail.registry';
import { inject, injectable } from 'inversify';
import config from '#config/index';

@injectable()
export class MailService {
  private mailer: IMailer;
  private queue: Queue<unknown>;

  constructor(
    @inject(MailableRegistry) mailableRegistry: MailableRegistry,
    @inject(QueueManager) queueManager: QueueManager,
  ) {
    // Create mailer based on configured driver (defaults to 'smtp' per config schema)
    const factory = new MailFactory();
    this.mailer = factory.createMailer(config.email.driver);
    logger.info(`Using mailer: ${this.mailer.name()}`);

    this.queue = queueManager.create<unknown>('mail', {
      retryDelay: 1000 * 30,
      limit: {
        max: 49,
        duration: 1000 * 60 * 30, // 30 minutes
      },
    });

    this.queue.process(async (job) => {
      await this.sendMail(mailableRegistry.createFromJob(job));
    });
  }

  async connect() {
    try {
      await this.mailer.verify();
    } catch (error) {
      logger.error(
        'Unable to connect to email server. Make sure you have configured the mailer.',
      );
      logger.error(error);
    }
  }

  async close() {
    await this.queue.close();
    await this.mailer.close();
  }

  public async sendMail(mailable: MailBase<unknown>): Promise<void> {
    const data = await mailable.build();

    await this.mailer.sendMail(data);
  }

  public async dispatchMail<P>(
    mailable: MailableCtor<P>,
    payload: P,
  ): Promise<void> {
    await this.queue.add(mailable.type, payload);
  }
}
