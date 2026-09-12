import { MailFactory } from '#core/mail/mail.factory';
import logger from '#core/logger';
import type { IMailer, SendMailResult } from '#core/mail/mailer.types';
import type { MailableCtor, MailBase } from '#core/mail/mail.base';
import type { Queue } from '#core/queue/Queue';
import { QueueManager } from '#core/queue/QueueManager';
import { MailableRegistry } from '#core/mail/mail.registry';
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

  public async sendMail(mailable: MailBase<unknown>): Promise<SendMailResult> {
    const data = await mailable.build();
    const result = await this.mailer.sendMail(data);

    try {
      await mailable.afterSend(result);
    } catch (error) {
      // The mail already sent successfully — a bookkeeping failure here must
      // never make the caller (or a queued job's retry) think the send
      // itself failed.
      logger.error('Mail afterSend hook failed:', error);
    }

    return result;
  }

  public async dispatchMail<P>(
    mailable: MailableCtor<P>,
    payload: P,
  ): Promise<void> {
    await this.queue.add(mailable.type, payload, mailable.jobOptions());
  }

  public async dispatchMailBulk<P>(
    mailable: MailableCtor<P>,
    payloads: P[],
  ): Promise<void> {
    const options = mailable.jobOptions();
    await this.queue.addBulk(
      payloads.map((payload) => ({
        name: mailable.type,
        payload,
        options,
      })),
    );
  }
}
