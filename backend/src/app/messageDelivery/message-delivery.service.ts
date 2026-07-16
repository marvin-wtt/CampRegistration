import { Prisma } from '#generated/prisma/client.js';
import type { Registration, File } from '#generated/prisma/client.js';
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

  async getDeliveryWithCampById(id: string) {
    return this.prisma.messageDelivery.findUnique({
      where: {
        id,
        registrationId: { not: null },
      },
      include: {
        // `campId` lives on the registration row directly — no camp JOIN needed.
        registration: { select: { campId: true } },
        attachments: true,
      },
    });
  }
}
