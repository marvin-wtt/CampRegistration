import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import {
  type Camp,
  Prisma,
  type Registration,
} from '#generated/prisma/client.js';
import { formUtils } from '#utils/form';
import { BaseService } from '#core/base/BaseService';
import { RegistrationCampDataHelper } from '#app/registration/registration.helper';
import { inject, injectable } from 'inversify';
import { FileService } from '#app/file/file.service';
import { AuditService } from '#app/audit/audit.service';
import { registrationAuditPolicy } from '#app/registration/registration.audit';

@injectable()
export class RegistrationService extends BaseService {
  constructor(
    @inject(FileService) private readonly fileService: FileService,
    @inject(AuditService) private readonly audit: AuditService,
  ) {
    super();
  }

  async getRegistrationById(campId: string, id: string) {
    return this.prisma.registration.findFirst({
      where: { id, campId },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async getRegistrationsByIds(campId: string, ids: string[]) {
    return this.prisma.registration.findMany({
      where: {
        id: { in: ids },
        campId,
        status: { not: 'PENDING' },
      },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async getRegistrationWithCampById(id: string) {
    return this.prisma.registration.findUnique({
      where: { id },
      include: {
        camp: { select: { id: true } },
        bed: { include: { room: true } },
      },
    });
  }

  async queryRegistrations(campId: string) {
    return this.prisma.registration.findMany({
      where: { campId },
      include: {
        bed: { include: { room: true } },
      },
    });
  }

  async createRegistration(
    camp: Camp & { freePlaces: number | Record<string, number> },
    data: Pick<Registration, 'data' | 'locale'>,
    fileField: string,
  ) {
    const form = formUtils(camp, data.data);

    const formData = form.data();
    const computedData = this.createComputedData(form.extractCampData());

    if (camp.countries.length > 1 && !computedData.country) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Country data is required for camps with multiple countries. This is likely due to an invalid registration form',
      );
    }

    const fileIds = form.getFileIds();

    const isWaitingList = async (
      transaction: Prisma.TransactionClient,
    ): Promise<boolean> => {
      // Only participants can be placed on the waiting list
      if (computedData.role && computedData.role !== 'participant') {
        return false;
      }

      // Single max participants for all participants
      if (typeof camp.maxParticipants === 'number') {
        const registrationCount = await transaction.registration.count({
          where: {
            campId: camp.id,
            OR: [{ role: 'participant' }, { role: null }],
          },
        });
        return registrationCount >= camp.maxParticipants;
      }

      // Max participants per country
      // Throw error when country is missing
      if (
        !computedData.country ||
        !(computedData.country in camp.maxParticipants)
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Invalid or missing country data',
        );
      }

      const registrationCount = await transaction.registration.count({
        where: {
          campId: camp.id,
          OR: [{ role: 'participant' }, { role: null }],
          country: computedData.country,
        },
      });

      return registrationCount >= camp.maxParticipants[computedData.country];
    };

    return this.prisma.$transaction(
      async (transaction) => {
        const waitingList = await isWaitingList(transaction);

        const status = waitingList
          ? 'WAITLISTED'
          : camp.confirmationMode === 'AUTOMATIC'
            ? 'ACCEPTED'
            : 'PENDING';

        const registration = await transaction.registration.create({
          data: {
            ...data,
            ...computedData,
            id: undefined, // Force new ID generation
            data: formData,
            status,
            camp: { connect: { id: camp.id } },
            files: this.fileService.getFileConnectInput(fileIds, fileField),
          },
        });

        await this.audit.record(transaction, {
          action: 'created',
          entityType: registrationAuditPolicy.entityType,
          entityId: registration.id,
          campId: camp.id,
          // A registration is created by an external party via the public
          // form — always system-attributed, never the logged-in manager who
          // may happen to share the session.
          actorId: null,
        });

        return registration;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateRegistrationById(
    camp: Camp & { freePlaces: number | Record<string, number> },
    registrationId: string,
    data: Pick<
      Prisma.RegistrationUpdateInput,
      'status' | 'data' | 'customData'
    >,
    sessionId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Read the authoritative "before" inside the transaction so the audit diff
      // is race-free and atomic with the write.
      const before = await tx.registration.findUniqueOrThrow({
        where: { id: registrationId },
      });

      let updateData: Prisma.RegistrationUpdateInput = {
        customData: data.customData,
        status: data.status,
      };

      if (data.data) {
        const form = formUtils(camp);
        form.updateData(data.data);
        const computedData = this.createComputedData(form.extractCampData());
        const fileIds = form.getFileIds();
        const files = await this.fileService.syncFilesForOwner(
          tx,
          'registrationId',
          registrationId,
          fileIds,
          sessionId,
        );

        updateData = {
          ...updateData,
          ...computedData,
          data: data.data,
          files,
        };
      }

      const after = await tx.registration.update({
        where: { id: registrationId },
        data: updateData,
        include: {
          bed: { include: { room: true } },
        },
      });

      await this.audit.recordChange(tx, 'updated', registrationAuditPolicy, {
        before,
        after,
        entityId: registrationId,
        campId: camp.id,
      });

      return after;
    });
  }

  async deleteRegistration(registration: Registration) {
    await this.prisma.$transaction(async (tx) => {
      await tx.registration.delete({
        where: { id: registration.id },
      });

      await this.audit.record(tx, {
        action: 'deleted',
        entityType: registrationAuditPolicy.entityType,
        entityId: registration.id,
        campId: registration.campId,
      });
    });
  }

  async updateRegistrationsComputedDataByCamp(
    camp: Camp & { freePlaces: number | Record<string, number> },
  ) {
    const form = formUtils(camp);
    const registrations = await this.queryRegistrations(camp.id);

    const results = registrations.map((registration) => {
      form.updateData(registration.data);
      const computedData = this.createComputedData(form.extractCampData());

      return this.prisma.registration.update({
        where: { id: registration.id },
        data: {
          ...computedData,
        },
        include: {
          bed: { include: { room: true } },
        },
      });
    });

    await Promise.all(results);
  }

  private createComputedData(
    data: Record<string, unknown[]>,
  ): Partial<Prisma.RegistrationCreateInput> {
    const helper = new RegistrationCampDataHelper(data);

    return {
      firstName: helper.firstName() ?? null,
      lastName: helper.lastName() ?? null,
      street: helper.street() ?? null,
      city: helper.city() ?? null,
      zipCode: helper.zipCode() ?? null,
      country: helper.country() ?? null,
      dateOfBirth: helper.dateOfBirth() ?? null,
      emails: helper.emails() ?? [],
      role: helper.role() ?? null,
      gender: helper.gender() ?? null,
      newsletterConsent: helper.newsletterConsent() ?? null,
    };
  }
}
