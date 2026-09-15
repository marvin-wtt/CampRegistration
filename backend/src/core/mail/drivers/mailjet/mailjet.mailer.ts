import type {
  BounceWebhook,
  IMailer,
  SendMailResult,
} from '#core/mail/mailer.types';
import type {
  Address,
  AddressLike,
  BuiltMail,
  MailAttachment,
} from '#core/mail/mail.types';
import type { BounceHandler } from '#core/mail/bounce.types';
import config from '#config/index';
import { describeError } from '#utils/errors';
import { createMailjetWebhookHandler } from '#core/mail/drivers/mailjet/mailjet-webhook.handler';

const MAILJET_SEND_URL = 'https://api.mailjet.com/v3.1/send';
const MAILJET_APIKEY_URL = 'https://api.mailjet.com/v3/REST/apikey';

interface MailjetAddress {
  Email: string;
  Name?: string;
}

interface MailjetAttachment {
  ContentType: string;
  Filename: string;
  Base64Content: string;
}

interface MailjetMessage {
  From?: MailjetAddress;
  To: MailjetAddress[];
  Cc?: MailjetAddress[];
  Bcc?: MailjetAddress[];
  ReplyTo?: MailjetAddress;
  Subject: string;
  HTMLPart?: string;
  TextPart?: string;
  Headers?: Record<string, string>;
  CustomID?: string;
  Attachments?: MailjetAttachment[];
}

interface MailjetSendError {
  ErrorMessage: string;
}

interface MailjetSendResult {
  Status: 'success' | 'error';
  Errors?: MailjetSendError[];
}

interface MailjetSendResponse {
  Messages?: MailjetSendResult[];
}

function toMailjetAddress(address: Address): MailjetAddress {
  return typeof address === 'string'
    ? { Email: address }
    : { Email: address.address, Name: address.name };
}

function toMailjetAddresses(
  addresses: AddressLike | undefined,
): MailjetAddress[] | undefined {
  if (!addresses) {
    return undefined;
  }

  const list = Array.isArray(addresses) ? addresses : [addresses];
  return list.map(toMailjetAddress);
}

async function toBase64(content: MailAttachment['content']): Promise<string> {
  if (typeof content === 'string') {
    return Buffer.from(content).toString('base64');
  }

  if (Buffer.isBuffer(content)) {
    return content.toString('base64');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of content as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('base64');
}

async function toMailjetAttachments(
  attachments: MailAttachment[] | undefined,
): Promise<MailjetAttachment[] | undefined> {
  if (!attachments || attachments.length === 0) {
    return undefined;
  }

  return Promise.all(
    attachments.map(async (attachment) => ({
      ContentType: attachment.contentType ?? 'application/octet-stream',
      Filename: attachment.filename,
      Base64Content: await toBase64(attachment.content),
    })),
  );
}

async function buildMessage(payload: BuiltMail): Promise<MailjetMessage> {
  const to = toMailjetAddresses(payload.to);
  if (!to) {
    throw new Error('Mailjet requires at least one "to" recipient.');
  }

  return {
    From: payload.from ? toMailjetAddress(payload.from) : undefined,
    To: to,
    Cc: toMailjetAddresses(payload.cc),
    Bcc: toMailjetAddresses(payload.bcc),
    ReplyTo: Array.isArray(payload.replyTo)
      ? toMailjetAddress(payload.replyTo[0])
      : payload.replyTo
        ? toMailjetAddress(payload.replyTo)
        : undefined,
    Subject: payload.subject,
    HTMLPart: payload.html,
    TextPart: payload.text,
    Headers: payload.headers,
    // Echoed back verbatim in webhook events, so it doubles as the bounce
    // correlation key — see bounce.types.ts.
    CustomID: payload.messageId,
    Attachments: await toMailjetAttachments(payload.attachments),
  };
}

export class MailjetMailer implements IMailer {
  private readonly authHeader: string;
  // Pushed by `MailService.onBounce()`, not pulled from it — see
  // `IMailer.setBounceHandler`.
  private bounceHandler: BounceHandler | undefined;

  constructor() {
    const mailjet = config.email.mailjet;
    if (!mailjet) {
      throw new Error(
        'Mailjet mailer is not configured. Set MAILJET_API_KEY and MAILJET_API_SECRET.',
      );
    }

    this.authHeader = `Basic ${Buffer.from(`${mailjet.apiKey}:${mailjet.apiSecret}`).toString('base64')}`;
  }

  name(): string {
    return 'Mailjet-Mailer';
  }

  async sendMail(payload: BuiltMail): Promise<SendMailResult> {
    const message = await buildMessage(payload);

    let response: Response;
    try {
      response = await fetch(MAILJET_SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Messages: [message] }),
      });
    } catch (error) {
      throw new Error(`Mailjet send request failed: ${describeError(error)}`, {
        cause: error,
      });
    }

    const body = (await response.json().catch(() => undefined)) as
      MailjetSendResponse | undefined;

    if (!response.ok || !body) {
      throw new Error(
        `Mailjet send request failed with status ${String(response.status)}.`,
      );
    }

    const result = body.Messages?.[0];
    if (result?.Status !== 'success') {
      const reason =
        result?.Errors?.map((error) => error.ErrorMessage).join('; ') ??
        'unknown error';
      throw new Error(`Mailjet rejected the message: ${reason}`);
    }

    // Unlike an SMTP server's per-recipient RCPT rejection, Mailjet's v3.1
    // API accepts or rejects a message as a whole, so there is no partial
    // rejection to report here.
    return { rejected: [] };
  }

  async verify(): Promise<void> {
    const response = await fetch(MAILJET_APIKEY_URL, {
      headers: { Authorization: this.authHeader },
    });

    if (!response.ok) {
      throw new Error(
        `Mailjet credential check failed with status ${String(response.status)}.`,
      );
    }
  }

  close(): void {
    // Stateless HTTP client — nothing to close.
  }

  setBounceHandler(handler: BounceHandler): void {
    this.bounceHandler = handler;
  }

  getBounceWebhook(): BounceWebhook | undefined {
    const secret = config.email.mailjet?.webhookSecret;
    if (!secret) {
      return undefined;
    }

    return {
      // Relative to MailModule's shared `/webhooks` prefix.
      path: '/mailjet/:secret',
      // Reads `this.bounceHandler` fresh on every request rather than
      // closing over a snapshot, so a handler swapped via
      // `MailService.onBounce()` later is picked up immediately.
      handler: createMailjetWebhookHandler(async (results) => {
        await this.bounceHandler?.(results);
      }),
    };
  }
}
