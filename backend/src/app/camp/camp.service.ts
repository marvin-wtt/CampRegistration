import type { Camp, Prisma } from '@prisma/client';
import prisma from '#client.js';
import { ulid } from '#utils/ulid';
import registrationService from '#app/registration/registration.service';
import { replaceUrlsInObject } from '#utils/replaceUrls';
import type { OptionalByKeys } from '#types/utils';
import config from '#config/index';

class CampService {
  async getCampById(id: string) {
    return prisma.camp.findFirst({
      where: { id },
    });
  }

  async getCampsByUserId(userId: string) {
    return prisma.camp.findMany({
      where: {
        campManager: {
          some: { userId },
        },
      },
    });
  }

  async queryCamps(
    filter: {
      active?: boolean;
      public?: boolean;
      name?: string;
      age?: number;
      startAt?: Date | string;
      entAt?: Date | string;
      country?: string;
    } = {},
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    } = {},
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'startAt';
    const sortType = options.sortType ?? 'desc';

    const where: Prisma.CampWhereInput = {
      // Only show active, public camps by default
      public: filter.public,
      active: filter.active,
      // FIXME Name filter not working for translated names
      // OR: filter.name
      //   ? [
      //       { name: { string_contains: filter.name } },
      //       {
      //         name: {
      //           path: dbJsonPath('*'),
      //           string_contains: filter.name,
      //         },
      //       },
      //     ]
      //   : undefined,
      minAge: { lte: filter.age },
      maxAge: { gte: filter.age },
      startAt: { gte: filter.startAt },
      endAt: { lte: filter.entAt },
      countries: { array_contains: filter.country },
    };

    return prisma.camp.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined,
    });
  }

  async createCamp(
    userId: string,
    data: Omit<Prisma.CampCreateInput, 'id' | 'freePlaces'>,
    tableTemplates: TableTemplateCreateData = [],
    messageTemplates: MessageTemplateCreateData = [],
    files: FileCreateData = [],
  ) {
    const freePlaces = data.maxParticipants;

    const fileIds = files.map((f) => f.id).filter((f) => f != null);
    const fileIdMap = new Map<string, string>();
    const form = this.replaceFormFileUrls(data.form, fileIds, fileIdMap);

    // Copy files from reference camp with new id
    const fileData = files.map((file) => ({
      ...file,
      // Use id from file map if present
      id: file.id ? fileIdMap.get(file.id) : undefined,
      // Override camp id
      campId: undefined,
    }));

    return prisma.camp.create({
      data: {
        freePlaces,
        ...data,
        form,
        campManager: { create: { userId } },
        tableTemplates: { createMany: { data: this.stripIds(tableTemplates) } },
        messageTemplates: {
          createMany: { data: this.stripIds(messageTemplates) },
        },
        files: { createMany: { data: fileData } },
      },
    });
  }

  /**
   * Removes the id and the camp id of the relational data.
   * These fields are replaced by prisma during insertion.
   * @param data The create data
   */
  private stripIds<T extends { id?: string; campId?: string }>(
    data: T[],
  ): (T & { id: undefined; campId: undefined })[] {
    return data.map((value) => ({
      ...value,
      // Override id and camp id
      id: undefined,
      campId: undefined,
    }));
  }

  private replaceFormFileUrls(
    form: Record<string, unknown>,
    fileIds: string[],
    fileIdMap: Map<string, string>,
  ): Record<string, unknown> {
    return replaceUrlsInObject(form, (url) => {
      const urlObj = new URL(url);

      // Only replace app urls
      if (urlObj.origin !== config.origin) {
        return url;
      }

      const pathSegments = urlObj.pathname.split('/').filter(Boolean);

      // Replace all url params
      for (const fileId of fileIds) {
        const index = pathSegments.indexOf(fileId);
        if (index === -1) {
          continue;
        }

        // Replace the id with the new one
        const id = fileIdMap.get(fileId) ?? ulid();
        pathSegments[index] = id;
        fileIdMap.set(fileId, id);
      }

      // Reconstruct the URL with the updated path
      urlObj.pathname = pathSegments.join('/');

      return urlObj.toString();
    });
  }

  async updateCamp(
    camp: Camp,
    data: Omit<Prisma.CampUpdateInput, 'id' | 'freePlaces'>,
  ) {
    const freePlaces =
      data.maxParticipants !== undefined
        ? await this.getCampFreePlaces(
            camp.id,
            data.maxParticipants ?? camp.maxParticipants,
            data.countries ?? camp.countries,
          )
        : undefined;

    return prisma.camp.update({
      where: { id: camp.id },
      data: {
        ...data,
        freePlaces,
      },
    });
  }

  async deleteCampById(id: string) {
    // TODO All files need to be deleted

    await prisma.camp.delete({ where: { id } });
  }

  private async getCampFreePlaces(
    id: string,
    maxParticipants: Camp['maxParticipants'],
    countries: Camp['countries'],
  ) {
    // Simple query for national camps
    if (typeof maxParticipants === 'number') {
      const participants = await registrationService.getParticipantsCount(id);

      return Math.max(0, maxParticipants - participants);
    }

    const countByCountry =
      await registrationService.getParticipantsCountByCountry(id, countries);

    return Object.entries(maxParticipants).reduce<Record<string, number>>(
      (result, [country, maxParticipants]) => {
        const free =
          country in countByCountry
            ? maxParticipants - countByCountry[country]
            : maxParticipants;

        result[country] = Math.max(0, free);
        return result;
      },
      {},
    );
  }
}

type TableTemplateCreateData = OptionalByKeys<
  Prisma.TableTemplateCreateManyCampInput,
  'id'
>[];
type MessageTemplateCreateData = OptionalByKeys<
  Prisma.MessageTemplateCreateManyCampInput,
  'id'
>[];
type FileCreateData = OptionalByKeys<Prisma.FileCreateManyCampInput, 'id'>[];

export default new CampService();
