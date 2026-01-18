import { describe, expect, it } from 'vitest';
import { MailBase } from '#app/mail/mail.base.js';
import { NoOpMailer } from '#app/mail/noop.mailer.js';

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
