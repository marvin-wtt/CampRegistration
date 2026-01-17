import { MailFactory } from '#app/mail/mail.factory';
import logger from '#core/logger';
import { NoOpMailer } from '#app/mail/noop.mailer';
import type { IMailer } from '#app/mail/mailer.types';
import type { MailableCtor, MailBase } from '#app/mail/mail.base';
import type { Queue } from '#core/queue/Queue';
import { QueueManager } from '#core/queue/QueueManager';
import { createMailableFromJob } from '#app/mail/mail.registry';
import { inject, injectable } from 'inversify';

@injectable()
export class MailService {
  private mailer: IMailer;
  private queue: Queue<unknown>;

  constructor(@inject(QueueManager) queueManager: QueueManager) {
    // Use the noop mailer as default to support operation without mail server
    this.mailer = new NoOpMailer();

    this.queue = queueManager.create<unknown>('mail', {
      retryDelay: 1000 * 30,
      limit: {
        max: 49,
        duration: 1000 * 60 * 30, // 5 minutes
      },
    });

    this.queue.process(async (job) => {
      await this.sendMail(createMailableFromJob(job));
    });
  }

  async connect() {
    const factory = new MailFactory();

    try {
      this.mailer = await factory.createMailer();
      logger.info(`Connected to mailer: ${this.mailer.name()}`);
    } catch (error) {
      logger.error(
        'Unable to connect to email server. Make sure you have configured the mailer',
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
