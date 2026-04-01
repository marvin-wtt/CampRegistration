import { type Prisma, type Registration } from '#generated/prisma/client.js';
import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';

export type RegistrationSnapshot = Record<string, unknown>;

@injectable()
export class RegistrationLogService extends BaseService {
  async getLogsByRegistrationId(campId: string, registrationId: string) {
    return this.prisma.registrationLog.findMany({
      where: { registrationId, campId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async logCreate(
    tx: Prisma.TransactionClient,
    registration: Registration,
    userId: string | null,
  ) {
    await tx.registrationLog.create({
      data: {
        registrationId: registration.id,
        campId: registration.campId,
        action: 'CREATE',
        before: null,
        after: this.toSnapshot(registration),
        note: null,
        userId,
      },
    });
  }

  async logUpdate(
    tx: Prisma.TransactionClient,
    before: Registration,
    after: Registration,
    userId: string | null,
    note: string | null | undefined,
  ) {
    await tx.registrationLog.create({
      data: {
        registrationId: after.id,
        campId: after.campId,
        action: 'UPDATE',
        before: this.toSnapshot(before),
        after: this.toSnapshot(after),
        note: note ?? null,
        userId,
      },
    });
  }

  async logDelete(
    registration: Registration,
    userId: string | null,
    note: string | null | undefined,
  ) {
    await this.prisma.registrationLog.create({
      data: {
        registrationId: registration.id,
        campId: registration.campId,
        action: 'DELETE',
        before: this.toSnapshot(registration),
        after: null,
        note: note ?? null,
        userId,
      },
    });
  }

  private toSnapshot(registration: Registration): RegistrationSnapshot {
    return {
      status: registration.status,
      data: registration.data,
      customData: registration.customData,
      firstName: registration.firstName,
      lastName: registration.lastName,
      role: registration.role,
      gender: registration.gender,
      dateOfBirth: registration.dateOfBirth?.toISOString() ?? null,
      emails: registration.emails,
      street: registration.street,
      city: registration.city,
      zipCode: registration.zipCode,
      country: registration.country,
      locale: registration.locale,
    };
  }
}
