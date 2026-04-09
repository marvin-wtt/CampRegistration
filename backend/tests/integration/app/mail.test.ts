import { describe, expect, it } from 'vitest';
import { MailBase } from '#app/mail/mail.base.js';
import { NoOpMailer } from '#app/mail/noop.mailer.js';
import { MailFactory } from '#app/mail/mail.factory.js';
import { resolve } from '#core/ioc/container.js';
import { MailService } from '#app/mail/mail.service.js';
import { MailableRegistry } from '#app/mail/mail.registry.js';

const mailer = NoOpMailer.prototype;

describe('Mail', () => {
  it('should send an email', async () => {
    await TestMail.send('value 123');

    expect(mailer.sendMail).toBeCalledTimes(1);
    expect(mailer.sendMail).toBeCalledWith(
      expect.objectContaining({
        to: 'to@email.com',
        cc: 'cc@email.com',
        bcc: 'bcc@email.com',
        replyTo: 'replyTo@email.com',
        priority: 'high',
        subject: 'Test Mail',
        html: expect.stringContaining(
          'This is a test mail with payload: value 123',
        ),
        text: 'This is a test mail with payload: value 123',
      }),
    );
  });

  it('should send a queued email', async () => {
    await TestMail.enqueue('value 123');

    expect(mailer.sendMail).toBeCalledTimes(1);
  });

  describe('enqueueBulk', () => {
    it('should not send any email when payloads array is empty', async () => {
      await TestMail.enqueueBulk([]);

      expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    it('should send a single email when one payload is provided', async () => {
      await TestMail.enqueueBulk(['value A']);

      expect(mailer.sendMail).toBeCalledTimes(1);
      expect(mailer.sendMail).toBeCalledWith(
        expect.objectContaining({
          to: 'to@email.com',
          subject: 'Test Mail',
          text: 'This is a test mail with payload: value A',
        }),
      );
    });

    it('should send one email per payload when multiple payloads are provided', async () => {
      await TestMail.enqueueBulk(['value A', 'value B', 'value C']);

      expect(mailer.sendMail).toBeCalledTimes(3);
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'This is a test mail with payload: value A',
        }),
      );
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'This is a test mail with payload: value B',
        }),
      );
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'This is a test mail with payload: value C',
        }),
      );
    });
  });

  describe('MailService.dispatchMailBulk', () => {
    it('should not enqueue any jobs when payloads array is empty', async () => {
      const mailableRegistry = resolve(MailableRegistry);
      mailableRegistry.register(TestMail);
      const mailService = resolve(MailService);

      await mailService.dispatchMailBulk(TestMail, []);

      expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    it('should enqueue one job per payload', async () => {
      const mailableRegistry = resolve(MailableRegistry);
      mailableRegistry.register(TestMail);
      const mailService = resolve(MailService);

      await mailService.dispatchMailBulk(TestMail, ['payload 1', 'payload 2']);

      expect(mailer.sendMail).toBeCalledTimes(2);
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'This is a test mail with payload: payload 1',
        }),
      );
      expect(mailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'This is a test mail with payload: payload 2',
        }),
      );
    });
  });
});

describe('MailFactory', () => {
  it('should create a noop mailer for the "noop" driver', () => {
    const factory = new MailFactory();
    const instance = factory.createMailer('noop');

    expect(instance).toBeInstanceOf(NoOpMailer);
  });

  it('should throw an error for an unknown driver', () => {
    const factory = new MailFactory();

    expect(() => factory.createMailer('unknown-driver')).toThrow(
      "Invalid mailer driver 'unknown-driver'",
    );
  });
});

describe('NoOpMailer', () => {
  it('should handle a plain string address', () => {
    const noop = new NoOpMailer();

    expect(() =>
      noop.sendMail({
        to: 'plain@example.com',
        subject: 'Test',
        text: 'body',
      } as never),
    ).not.toThrow();
  });

  it('should handle an object address with name and address fields', () => {
    const noop = new NoOpMailer();

    expect(() =>
      noop.sendMail({
        to: { name: 'Alice', address: 'alice@example.com' },
        subject: 'Test',
        text: 'body',
      } as never),
    ).not.toThrow();
  });

  it('should handle an array of mixed addresses', () => {
    const noop = new NoOpMailer();

    expect(() =>
      noop.sendMail({
        to: ['plain@example.com', { name: 'Bob', address: 'bob@example.com' }],
        subject: 'Test',
        text: 'body',
      } as never),
    ).not.toThrow();
  });
});

class TestMail extends MailBase<string> {
  static readonly type = 'test';

  protected to() {
    return 'to@email.com';
  }

  protected cc() {
    return 'cc@email.com';
  }

  protected bcc() {
    return 'bcc@email.com';
  }

  protected replyTo() {
    return 'replyTo@email.com';
  }

  protected priority() {
    return 'high' as const;
  }

  protected subject() {
    return 'Test Mail';
  }

  protected content() {
    return {
      text: 'This is a test mail with payload: ' + this.payload,
      html: `<p>This is a test mail with payload: ${this.payload}</p>`,
    };
  }
}
