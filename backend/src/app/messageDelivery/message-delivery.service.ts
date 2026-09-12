import { Prisma } from '#generated/prisma/client.js';
import type {
  Registration,
  File,
  MessageDelivery,
} from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';

export interface DeliverySource {
  kind: 'message' | 'template';
  id: string;
  attachments: File[];
}

@injectable()
export class MessageDeliveryService extends BaseService {
  constructor(@inject(FileService) private readonly fileService: FileService) {
    super();
  }

  async createDelivery(
    registration: Registration,
    source: DeliverySource,
    data: Omit<
      Prisma.MessageDeliveryCreateInput,
      | 'id'
      | 'template'
      | 'message'
      | 'registration'
      | 'createdAt'
      | 'attachments'
    >,
  ) {
    const createArgs = {
      include: { attachments: true },
    } as const;

    try {
      return await this.prisma.messageDelivery.create({
        data: {
          ...data,
          registration: { connect: { id: registration.id } },
          ...(source.kind === 'message'
            ? { message: { connect: { id: source.id } } }
            : { template: { connect: { id: source.id } } }),
          attachments: this.fileService.getFileCreateManyInput(
            source.attachments,
          ),
        },
        ...createArgs,
      });
    } catch (err) {
      // The source Message/MessageTemplate can be deleted between enqueueing
      // this delivery and it actually being sent. The delivery is still
      // valid — just record it without the (now-gone) parent relation.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        return this.prisma.messageDelivery.create({
          data: {
            ...data,
            registrationId: registration.id,
            messageId: source.kind === 'message' ? null : undefined,
            templateId: source.kind === 'template' ? null : undefined,
            attachments: this.fileService.getFileCreateManyInput(
              source.attachments,
            ),
          } satisfies Prisma.MessageDeliveryUncheckedCreateInput,
          ...createArgs,
        });
      }

      throw err;
    }
  }

  async getDeliveryWithEventById(id: string) {
    return this.prisma.messageDelivery.findUnique({
      where: { id },
      include: {
        // `eventId` lives on the registration row directly — no event JOIN needed.
        registration: { select: { eventId: true } },
        attachments: true,
      },
    });
  }

  /**
   * Idempotent: an already-bounced delivery is left alone so a duplicate
   * report never re-fires bounce handling. Returns `null` when there was
   * nothing to do — unknown id, or already bounced.
   */
  async markBounced(
    id: string,
    reason: string,
  ): Promise<MessageDelivery | null> {
    const { count } = await this.prisma.messageDelivery.updateMany({
      where: { id, bouncedAt: null },
      data: { bouncedAt: new Date(), bounceReason: reason },
    });

    if (count === 0) {
      return null;
    }

    return this.prisma.messageDelivery.findUniqueOrThrow({ where: { id } });
  }

  async markBouncedByCorrelationId(
    bounceCorrelationId: string,
    reason: string,
  ): Promise<MessageDelivery | null> {
    const delivery = await this.prisma.messageDelivery.findUnique({
      where: { bounceCorrelationId },
    });
    if (!delivery) {
      return null;
    }

    return this.markBounced(delivery.id, reason);
  }
}
