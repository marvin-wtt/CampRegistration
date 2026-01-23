import type { Camp, File, Prisma } from '@prisma/client';
import { ulid } from '#utils/ulid';
import { replaceUrlsInObject } from '#utils/replaceUrls';
import type { OptionalByKeys } from '#types/utils';
import type { AppConfig } from '#config/index';
import { BaseService } from '#core/base/BaseService';
import { inject, injectable } from 'inversify';
import { Config } from '#core/ioc/decorators';
import { FileService } from '#app/file/file.service.js';

export interface CampWithFreePlaces extends Camp {
  freePlaces: number | Record<string, number>;
}

type TableTemplateCreateData = OptionalByKeys<
  Prisma.TableTemplateCreateManyCampInput,
  'id'
>[];
type MessageTemplateCreateData = (OptionalByKeys<
  Prisma.MessageTemplateCreateManyCampInput,
  'id'
> & { attachments?: File[] })[];
type FileCreateData = OptionalByKeys<Prisma.FileCreateManyCampInput, 'id'>[];

@injectable()
export class CampService extends BaseService {
  constructor(
    @Config() private readonly config: AppConfig,
    @inject(FileService) private readonly fileService: FileService,
  ) {
    super();
  }

  async getCampById(id: string) {
    const camp = await this.prisma.camp.findFirst({
      where: { id },
      include: { ...this.campRegistrationInclude() },
    });

    return camp === null ? null : enrichFreePlaces(camp);
  }

  async getCampsByUserId(userId: string) {
    const camps = await this.prisma.camp.findMany({
      where: {
        campManager: {
          some: { userId },
        },
      },
      include: { ...this.campRegistrationInclude() },
    });

    return camps.map(enrichFreePlaces);
  }

  private campRegistrationInclude(): Prisma.CampInclude {
    return {
      registrations: {
        where: {
          OR: [{ role: 'participant' }, { role: null }],
        },
        select: { country: true },
      },
    };
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

    const camps = await this.prisma.camp.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortType } : undefined,
      include: { ...this.campRegistrationInclude() },
    });

    return camps.map(enrichFreePlaces);
  }

  async createCamp(
    userId: string,
    data: Omit<Prisma.CampCreateInput, 'id'>,
    tableTemplates: TableTemplateCreateData = [],
    messageTemplates: MessageTemplateCreateData = [],
    files: FileCreateData = [],
  ) {
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
      createdAt: undefined,
    }));

    const messageTemplateData = messageTemplates.map((template) => ({
      ...template,
      attachments:
        template.attachments && template.attachments.length > 0
          ? this.fileService.getFileCreateManyInput(template.attachments)
          : undefined,
    }));

    const camp = await this.prisma.camp.create({
      data: {
        ...data,
        form,
        campManager: {
          create: {
            userId,
            role: 'DIRECTOR',
          },
        },
        tableTemplates: {
          createMany: { data: this.stripIds(tableTemplates) },
        },
        messageTemplates: {
          createMany: { data: this.stripIds(messageTemplateData) },
        },
        files: { createMany: { data: fileData } },
      },
      include: { ...this.campRegistrationInclude() },
    });

    return {
      ...camp,
      freePlaces: data.maxParticipants,
    };
  }

  /**
   * Removes the id and the camp id of the relational data.
   * These fields are replaced by prisma during insertion.
   * @param data The create data
   */
  private stripIds<T extends object>(
    data: T[],
  ): (T & { id: undefined; campId: undefined; createdAt: undefined })[] {
    return data.map((value) => ({
      ...value,
      // Override id and camp id
      id: undefined,
      campId: undefined,
      createdAt: undefined,
      updatedAt: undefined,
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
      if (urlObj.origin !== this.config.origin) {
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

  async updateCamp(camp: Camp, data: Omit<Prisma.CampUpdateInput, 'id'>) {
    const updatedCamp = await this.prisma.camp.update({
      where: { id: camp.id },
      data: {
        ...data,
      },
      include: { ...this.campRegistrationInclude() },
    });

    return enrichFreePlaces(updatedCamp);
  }

  async deleteCampById(id: string) {
    await this.prisma.camp.delete({ where: { id } });
  }
}

const enrichFreePlaces = (
  camp: Camp & { registrations: { country: string | null }[] },
): CampWithFreePlaces => {
  if (typeof camp.maxParticipants === 'number') {
    return {
      ...camp,
      freePlaces: Math.max(0, camp.maxParticipants - camp.registrations.length),
    };
  }

  return {
    ...camp,
    freePlaces: camp.registrations.reduce<Record<string, number>>(
      (acc, { country }) => {
        // Skip invalid registrations
        if (country === null || !(country in acc)) {
          return acc;
        }
        acc[country] = Math.max(0, acc[country] - 1);

        return acc;
      },
      { ...camp.maxParticipants },
    ),
  };
};
