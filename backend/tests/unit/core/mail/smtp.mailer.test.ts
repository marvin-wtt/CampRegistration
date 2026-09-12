import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    },
  },
}));

// Imported after the mocks are registered so the mailer picks up the mocked
// nodemailer and config modules.
const { SmtpMailer } = await import('#core/mail/smtp.mailer');

function builtMail(overrides: Partial<BuiltMail> = {}): BuiltMail {
  return {
    to: 'recipient@example.com',
    subject: 'Subject',
    from: 'from@example.com',
    ...overrides,
  };
}

describe('SmtpMailer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTransportMock.mockReturnValue({
      sendMail: sendMailMock,
      verify: vi.fn(),
      close: vi.fn(),
    });
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
});
