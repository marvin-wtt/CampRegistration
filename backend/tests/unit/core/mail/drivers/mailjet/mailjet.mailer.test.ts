import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuiltMail } from '#core/mail/mail.types';

vi.mock('#config/index', () => ({
  default: {
    email: {
      mailjet: {
        apiKey: 'key123',
        apiSecret: 'secret456',
      },
    },
  },
}));

vi.mock('#core/logger', () => ({
  default: { warn: vi.fn(), error: vi.fn() },
}));

const { MailjetMailer } =
  await import('#core/mail/drivers/mailjet/mailjet.mailer');
const { default: mockedConfig } = await import('#config/index');

function builtMail(overrides: Partial<BuiltMail> = {}): BuiltMail {
  return {
    to: 'recipient@example.com',
    subject: 'Subject',
    from: { name: 'Sender', address: 'from@example.com' },
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('MailjetMailer', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when Mailjet is not configured', async () => {
    const originalMailjet = mockedConfig.email.mailjet;
    mockedConfig.email.mailjet = undefined;

    expect(() => new MailjetMailer()).toThrow(/not configured/);

    mockedConfig.email.mailjet = originalMailjet;
  });

  it('sends with the mapped envelope, subject and content, authenticated with Basic auth', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { Messages: [{ Status: 'success' }] }),
    );
    const mailer = new MailjetMailer();

    await mailer.sendMail(
      builtMail({
        html: '<p>hi</p>',
        text: 'hi',
        messageId: 'abc@example.com',
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mailjet.com/v3.1/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('key123:secret456').toString('base64')}`,
        }),
      }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.Messages[0]).toMatchObject({
      From: { Email: 'from@example.com', Name: 'Sender' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Subject',
      HTMLPart: '<p>hi</p>',
      TextPart: 'hi',
      // CustomID doubles as the bounce correlation id — see bounce.types.ts.
      CustomID: 'abc@example.com',
    });
  });

  it('base64-encodes attachments for Mailjet', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { Messages: [{ Status: 'success' }] }),
    );
    const mailer = new MailjetMailer();

    await mailer.sendMail(
      builtMail({
        attachments: [
          {
            filename: 'note.txt',
            content: Buffer.from('hello'),
            contentType: 'text/plain',
          },
        ],
      }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.Messages[0].Attachments).toEqual([
      {
        ContentType: 'text/plain',
        Filename: 'note.txt',
        Base64Content: Buffer.from('hello').toString('base64'),
      },
    ]);
  });

  it('throws when Mailjet rejects the message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        Messages: [
          { Status: 'error', Errors: [{ ErrorMessage: 'Invalid recipient' }] },
        ],
      }),
    );
    const mailer = new MailjetMailer();

    await expect(mailer.sendMail(builtMail())).rejects.toThrow(
      /Invalid recipient/,
    );
  });

  it('throws when the send request fails at the HTTP level', async () => {
    fetchMock.mockResolvedValue(jsonResponse(502, {}));
    const mailer = new MailjetMailer();

    await expect(mailer.sendMail(builtMail())).rejects.toThrow(/502/);
  });

  it('throws when the network request itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));
    const mailer = new MailjetMailer();

    await expect(mailer.sendMail(builtMail())).rejects.toThrow(/boom/);
  });

  it('reports no rejections on success, unlike per-recipient SMTP rejection', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { Messages: [{ Status: 'success' }] }),
    );
    const mailer = new MailjetMailer();

    const result = await mailer.sendMail(builtMail());

    expect(result).toEqual({ rejected: [] });
  });

  it('verifies credentials against the Mailjet API', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    const mailer = new MailjetMailer();

    await mailer.verify();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mailjet.com/v3/REST/apikey',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('key123:secret456').toString('base64')}`,
        }),
      }),
    );
  });

  it('throws when credential verification fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, {}));
    const mailer = new MailjetMailer();

    await expect(mailer.verify()).rejects.toThrow(/401/);
  });

  it('describes the bounce webhook route when a webhook secret is configured', () => {
    const originalMailjet = mockedConfig.email.mailjet;
    mockedConfig.email.mailjet = { ...originalMailjet!, webhookSecret: 'shh' };

    const mailer = new MailjetMailer();
    const webhook = mailer.getBounceWebhook();

    expect(webhook).toMatchObject({
      path: '/mailjet/:secret',
      handler: expect.any(Function),
    });

    mockedConfig.email.mailjet = originalMailjet;
  });

  it('returns no webhook without a webhook secret', () => {
    const mailer = new MailjetMailer();

    expect(mailer.getBounceWebhook()).toBeUndefined();
  });

  it('handles a request with the handler pushed via setBounceHandler, resolved fresh per request', async () => {
    const originalMailjet = mockedConfig.email.mailjet;
    mockedConfig.email.mailjet = { ...originalMailjet!, webhookSecret: 'shh' };

    const mailer = new MailjetMailer();
    const firstHandler = vi.fn().mockResolvedValue(undefined);
    mailer.setBounceHandler(firstHandler);

    // Registered once...
    const webhook = mailer.getBounceWebhook();
    // ...but swapped before any request arrives.
    const secondHandler = vi.fn().mockResolvedValue(undefined);
    mailer.setBounceHandler(secondHandler);

    const req = {
      params: { secret: 'shh' },
      body: [{ event: 'blocked', CustomID: 'a@example.com' }],
    };
    const res = { sendStatus: vi.fn() };
    await webhook?.handler(req as never, res as never, vi.fn());

    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledWith([
      { correlationId: 'a@example.com', action: 'failed' },
    ]);

    mockedConfig.email.mailjet = originalMailjet;
  });
});
