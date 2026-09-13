import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuiltMail } from '#core/mail/mail.types';

const { sendMailMock, createTransportMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  createTransportMock: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

vi.mock('#config/index', () => ({
  default: {
    email: {
      envelopeFrom: 'bounce@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        auth: { user: 'auth-user@example.com', pass: 'secret' },
      },
      bounce: {
        host: 'imap.example.com',
        port: 993,
        secure: true,
        auth: { user: 'bounce-user@example.com', pass: 'secret' },
      },
    },
  },
}));

// Imported after the mocks are registered so the mailer picks up the mocked
// nodemailer and config modules.
const { SmtpMailer } = await import('#core/mail/smtp.mailer');
const { default: mockedConfig } = await import('#config/index');

function builtMail(overrides: Partial<BuiltMail> = {}): BuiltMail {
  return {
    to: 'recipient@example.com',
    subject: 'Subject',
    from: 'from@example.com',
    ...overrides,
  };
}

describe('SmtpMailer', () => {
  const afterEachCleanup: Array<() => void> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    sendMailMock.mockResolvedValue({
      accepted: ['recipient@example.com'],
      rejected: [],
    });
    createTransportMock.mockReturnValue({
      sendMail: sendMailMock,
      verify: vi.fn(),
      close: vi.fn(),
    });
  });

  afterEach(() => {
    while (afterEachCleanup.length) {
      afterEachCleanup.pop()?.();
    }
  });

  it('connects using the configured SMTP auth, independent of the from/envelope addresses', () => {
    new SmtpMailer();

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        auth: { user: 'auth-user@example.com', pass: 'secret' },
      }),
    );
  });

  it('sends with the configured envelope-from, independent of the From header', async () => {
    const mailer = new SmtpMailer();

    await mailer.sendMail(builtMail({ from: 'from-header@example.com' }));

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'from-header@example.com',
        envelope: expect.objectContaining({ from: 'bounce@example.com' }),
      }),
    );
  });

  it('repeats to/cc/bcc on the envelope so nodemailer does not drop the recipients', async () => {
    const mailer = new SmtpMailer();

    await mailer.sendMail(
      builtMail({
        to: 'a@example.com',
        cc: 'b@example.com',
        bcc: 'c@example.com',
      }),
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        envelope: {
          from: 'bounce@example.com',
          to: 'a@example.com',
          cc: 'b@example.com',
          bcc: 'c@example.com',
        },
      }),
    );
  });

  it('requests a DSN on FAILURE with the id set to the messageId, only when both are provided', async () => {
    const mailer = new SmtpMailer();

    await mailer.sendMail(
      builtMail({
        messageId: 'abc123@example.com',
        dsn: true,
      }),
    );

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'abc123@example.com',
        envelope: expect.objectContaining({
          dsn: { id: 'abc123@example.com', notify: ['FAILURE'] },
        }),
      }),
    );
  });

  it('omits the DSN envelope block when no messageId is set, even if dsn is requested', async () => {
    const mailer = new SmtpMailer();

    await mailer.sendMail(builtMail({ dsn: true }));

    const call = sendMailMock.mock.calls[0]?.[0];
    expect(call.envelope.dsn).toBeUndefined();
  });

  it('omits the DSN envelope block when bounce reading is not configured, even if the mailable asked for it', async () => {
    const originalBounceConfig = mockedConfig.email.bounce;
    mockedConfig.email.bounce = undefined;
    afterEachCleanup.push(() => {
      mockedConfig.email.bounce = originalBounceConfig;
    });

    const mailer = new SmtpMailer();

    await mailer.sendMail(
      builtMail({
        messageId: 'abc123@example.com',
        dsn: true,
      }),
    );

    const call = sendMailMock.mock.calls[0]?.[0];
    expect(call.envelope.dsn).toBeUndefined();
  });

  it('returns the rejected recipients from the transport result', async () => {
    sendMailMock.mockResolvedValue({
      accepted: ['a@example.com'],
      rejected: ['b@example.com'],
    });
    const mailer = new SmtpMailer();

    const result = await mailer.sendMail(builtMail());

    expect(result).toEqual({ rejected: ['b@example.com'] });
  });

  it('reports no rejections when the transport reports none', async () => {
    sendMailMock.mockResolvedValue({});
    const mailer = new SmtpMailer();

    const result = await mailer.sendMail(builtMail());

    expect(result).toEqual({ rejected: [] });
  });
});
