import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '#generated/prisma/client';
import { MessageDeliveryService } from '#app/messageDelivery/message-delivery.service';
import type { FileService } from '#app/file/file.service';
import type { Registration } from '#generated/prisma/client';

const registration = { id: 'registration-1' } as Registration;

const notFoundError = new Prisma.PrismaClientKnownRequestError(
  'An operation failed because it depends on one or more records that were required but not found.',
  { code: 'P2025', clientVersion: 'test' },
);

function createService() {
  const prismaMock = {
    messageDelivery: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  };
  const fileServiceMock = {
    getFileCreateManyInput: vi
      .fn()
      .mockReturnValue({ createMany: { data: [] } }),
  } as unknown as FileService;

  const service = new MessageDeliveryService(fileServiceMock);
  (service as unknown as { prisma: typeof prismaMock }).prisma = prismaMock;

  return { service, prismaMock };
}

describe('MessageDeliveryService.createDelivery', () => {
  it('connects the delivery to the source message when it still exists', async () => {
    const { service, prismaMock } = createService();
    prismaMock.messageDelivery.create.mockResolvedValueOnce({
      id: 'delivery-1',
    });

    await service.createDelivery(
      registration,
      { kind: 'message', id: 'message-1', attachments: [] },
      { subject: 'Hi', body: 'Body', priority: 'normal' },
    );

    expect(prismaMock.messageDelivery.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.messageDelivery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          message: { connect: { id: 'message-1' } },
        }),
      }),
    );
  });

  it('falls back to a null messageId when the source message was deleted in the meantime', async () => {
    const { service, prismaMock } = createService();
    prismaMock.messageDelivery.create
      .mockRejectedValueOnce(notFoundError)
      .mockResolvedValueOnce({ id: 'delivery-1' });

    const result = await service.createDelivery(
      registration,
      { kind: 'message', id: 'deleted-message', attachments: [] },
      { subject: 'Hi', body: 'Body', priority: 'normal' },
    );

    expect(result).toEqual({ id: 'delivery-1' });
    expect(prismaMock.messageDelivery.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.messageDelivery.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          registrationId: registration.id,
          messageId: null,
          templateId: undefined,
        }),
      }),
    );
  });

  it('falls back to a null templateId when the source template was deleted in the meantime', async () => {
    const { service, prismaMock } = createService();
    prismaMock.messageDelivery.create
      .mockRejectedValueOnce(notFoundError)
      .mockResolvedValueOnce({ id: 'delivery-1' });

    await service.createDelivery(
      registration,
      { kind: 'template', id: 'deleted-template', attachments: [] },
      { subject: 'Hi', body: 'Body', priority: 'normal' },
    );

    expect(prismaMock.messageDelivery.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          templateId: null,
          messageId: undefined,
        }),
      }),
    );
  });

  it('re-throws errors unrelated to a missing parent record', async () => {
    const { service, prismaMock } = createService();
    const otherError = new Error('connection lost');
    prismaMock.messageDelivery.create.mockRejectedValueOnce(otherError);

    await expect(
      service.createDelivery(
        registration,
        { kind: 'message', id: 'message-1', attachments: [] },
        { subject: 'Hi', body: 'Body', priority: 'normal' },
      ),
    ).rejects.toThrow(otherError);
    expect(prismaMock.messageDelivery.create).toHaveBeenCalledTimes(1);
  });
});

describe('MessageDeliveryService.markBounced', () => {
  it('marks the delivery bounced when it exists and is not already bounced', async () => {
    const { service, prismaMock } = createService();
    prismaMock.messageDelivery.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.messageDelivery.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'delivery-1',
      bouncedAt: new Date(),
    });

    const result = await service.markBounced('delivery-1', 'rejected');

    expect(prismaMock.messageDelivery.updateMany).toHaveBeenCalledWith({
      where: { id: 'delivery-1', bouncedAt: null },
      data: expect.objectContaining({ bounceReason: 'rejected' }),
    });
    expect(result).toEqual({ id: 'delivery-1', bouncedAt: expect.any(Date) });
  });

  it('is idempotent: returns null without a second write when already bounced', async () => {
    const { service, prismaMock } = createService();
    prismaMock.messageDelivery.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await service.markBounced('delivery-1', 'rejected');

    expect(result).toBeNull();
    expect(prismaMock.messageDelivery.findUniqueOrThrow).not.toHaveBeenCalled();
  });
});

describe('MessageDeliveryService.markBouncedByCorrelationId', () => {
  it('returns null when no delivery matches the correlation id', async () => {
    const { service, prismaMock } = createService();
    prismaMock.messageDelivery.findUnique.mockResolvedValueOnce(null);

    const result = await service.markBouncedByCorrelationId(
      'unknown@example.com',
      'DSN report: failed',
    );

    expect(result).toBeNull();
    expect(prismaMock.messageDelivery.updateMany).not.toHaveBeenCalled();
  });

  it('marks the matching delivery bounced', async () => {
    const { service, prismaMock } = createService();
    prismaMock.messageDelivery.findUnique.mockResolvedValueOnce({
      id: 'delivery-1',
    });
    prismaMock.messageDelivery.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.messageDelivery.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'delivery-1',
      bouncedAt: new Date(),
    });

    const result = await service.markBouncedByCorrelationId(
      'abc123@example.com',
      'DSN report: failed',
    );

    expect(prismaMock.messageDelivery.findUnique).toHaveBeenCalledWith({
      where: { bounceCorrelationId: 'abc123@example.com' },
    });
    expect(prismaMock.messageDelivery.updateMany).toHaveBeenCalledWith({
      where: { id: 'delivery-1', bouncedAt: null },
      data: expect.objectContaining({ bounceReason: 'DSN report: failed' }),
    });
    expect(result).toEqual({ id: 'delivery-1', bouncedAt: expect.any(Date) });
  });
});
