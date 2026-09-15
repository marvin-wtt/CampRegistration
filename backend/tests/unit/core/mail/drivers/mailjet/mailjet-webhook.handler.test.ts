import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { BounceHandler } from '#core/mail/bounce.types';

vi.mock('#config/index', () => ({
  default: {
    email: {
      mailjet: { webhookSecret: 'topsecret' },
    },
  },
}));

vi.mock('#core/logger', () => ({
  default: { warn: vi.fn(), error: vi.fn() },
}));

const { createMailjetWebhookHandler } =
  await import('#core/mail/drivers/mailjet/mailjet-webhook.handler');

function mockRes(): Response {
  return { sendStatus: vi.fn() } as unknown as Response;
}

function mockReq(secret: string, body: unknown): Request {
  return { params: { secret }, body } as unknown as Request;
}

function mockBounceHandler(): BounceHandler {
  return vi.fn().mockResolvedValue(undefined);
}

describe('mailjetWebhookHandler', () => {
  it('rejects a request with the wrong secret without invoking the handler', async () => {
    const bounceHandler = mockBounceHandler();
    const handler = createMailjetWebhookHandler(bounceHandler);
    const res = mockRes();

    await handler(mockReq('wrong', []), res, vi.fn());

    expect(res.sendStatus).toHaveBeenCalledWith(404);
    expect(bounceHandler).not.toHaveBeenCalled();
  });

  it('acks 200 and forwards only hard bounces and blocked events, keyed by CustomID', async () => {
    const bounceHandler = mockBounceHandler();
    const handler = createMailjetWebhookHandler(bounceHandler);
    const res = mockRes();

    await handler(
      mockReq('topsecret', [
        { event: 'bounce', hard_bounce: true, CustomID: 'a@example.com' },
        { event: 'bounce', hard_bounce: false, CustomID: 'b@example.com' },
        { event: 'blocked', CustomID: 'c@example.com' },
        { event: 'spam', CustomID: 'd@example.com' },
        { event: 'bounce', hard_bounce: true }, // no CustomID, skipped
      ]),
      res,
      vi.fn(),
    );

    expect(res.sendStatus).toHaveBeenCalledWith(200);
    expect(bounceHandler).toHaveBeenCalledWith([
      { correlationId: 'a@example.com', action: 'failed' },
      { correlationId: 'c@example.com', action: 'failed' },
    ]);
  });

  it('does not invoke the handler when there are no bounce events', async () => {
    const bounceHandler = mockBounceHandler();
    const handler = createMailjetWebhookHandler(bounceHandler);
    const res = mockRes();

    await handler(mockReq('topsecret', [{ event: 'open' }]), res, vi.fn());

    expect(res.sendStatus).toHaveBeenCalledWith(200);
    expect(bounceHandler).not.toHaveBeenCalled();
  });

  it('swallows a handler failure since the response is already sent', async () => {
    const bounceHandler: BounceHandler = vi
      .fn()
      .mockRejectedValue(new Error('db down'));
    const handler = createMailjetWebhookHandler(bounceHandler);
    const res = mockRes();

    await expect(
      handler(
        mockReq('topsecret', [{ event: 'blocked', CustomID: 'a@example.com' }]),
        res,
        vi.fn(),
      ),
    ).resolves.toBeUndefined();

    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });
});
