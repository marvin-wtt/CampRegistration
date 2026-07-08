import type { Camp, File, Prisma } from '#generated/prisma/client.js';
import { ulid } from '#utils/ulid';
import { replaceUrlsInObject } from '#utils/replaceUrls';
import type { OptionalByKeys } from '#types/utils';
import type { AppConfig } from '#config';
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

type CampRegistrationStatusFilter = 'open' | 'upcoming' | 'closed';

// A 1-character query LIKE-matches a large share of camps (scanned via a
// leading-wildcard, un-indexable raw query), turning `campIdsMatchingName`
// into a near-full-table scan whose `id IN (...)` result set is nearly as
// large as the table itself. Below this length, skip the name filter
// entirely rather than pay that cost for a query that isn't selective yet.
const MIN_NAME_FILTER_LENGTH = 2;

interface CampQueryArgs {
  public?: boolean | undefined;
  name?: string | undefined;
  age?: number | undefined;
  startAt?: Date | string | undefined;
  endAt?: Date | string | undefined;
  country?: string | undefined;
  status?: CampRegistrationStatusFilter | undefined;
  managerUserId?: string | undefined;
}

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

  /**
   * Build the registration-status filter as date conditions on the
   * registration window, mirroring the shared status derivation.
   */
  private campStatusWhere(
    status: CampRegistrationStatusFilter,
    now: Date,
  ): Prisma.CampWhereInput {
    switch (status) {
      case 'upcoming':
        return {
          AND: [
            { registrationOpensAt: { gt: now } },
            // Check for invariant where close is before open
            {
              OR: [
                { registrationClosesAt: null },
                { registrationClosesAt: { gt: now } },
              ],
            },
          ],
        };
      case 'closed':
        return {
          OR: [
            { registrationOpensAt: null, registrationClosesAt: null },
            { registrationClosesAt: { lte: now } },
          ],
        };
      case 'open':
        return {
          AND: [
            {
              OR: [
                { registrationOpensAt: { not: null } },
                { registrationClosesAt: { not: null } },
              ],
            },
            {
              OR: [
                { registrationOpensAt: null },
                { registrationOpensAt: { lte: now } },
              ],
            },
            {
              OR: [
                { registrationClosesAt: null },
                { registrationClosesAt: { gt: now } },
              ],
            },
          ],
        };
    }
  }

  /**
   * Resolve camp ids whose translated `name` JSON matches the query in any
   * locale. Matching the serialized JSON with LIKE covers every locale value
   * without needing per-locale JSON paths.
   */
  private async campIdsMatchingName(name: string): Promise<string[]> {
    const escaped = name
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM camps
      WHERE JSON_SEARCH(name, 'one', ${`%${escaped}%`}) IS NOT NULL
    `;

    return rows.map((row) => row.id);
  }

  private async buildCampWhere(
    filter: CampQueryArgs,
  ): Promise<Prisma.CampWhereInput> {
    const where: Prisma.CampWhereInput = {
      public: filter.public,
      minAge: { lte: filter.age },
      maxAge: { gte: filter.age },
      startAt: { gte: filter.startAt },
      endAt: { lte: filter.endAt },
      countries: { array_contains: filter.country },
      ...(filter.managerUserId
        ? { campManager: { some: { userId: filter.managerUserId } } }
        : {}),
      ...(filter.status ? this.campStatusWhere(filter.status, new Date()) : {}),
    };

    const name = filter.name?.trim();
    if (name && name.length >= MIN_NAME_FILTER_LENGTH) {
      where.id = { in: await this.campIdsMatchingName(name) };
    }

    return where;
  }

  async queryCamps(
    filter: CampQueryArgs = {},
    options: {
      limit?: number;
      cursor?: string;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    } = {},
  ) {
    const limit = options.limit ?? 25;
    const sortBy = options.sortBy ?? 'startAt';
    const sortType = options.sortType ?? 'desc';

    const where = await this.buildCampWhere(filter);

    // Over-fetch by one to detect whether a further page exists. The `id`
    // tiebreaker keeps the cursor stable when the sort column has duplicates.
    const items = await this.prisma.camp.findMany({
      where,
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      orderBy: [{ [sortBy]: sortType }, { id: sortType }],
      include: { ...this.campRegistrationInclude() },
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;
    // Only pay for the count on the first (uncursored) request.
    const total = options.cursor
      ? undefined
      : await this.prisma.camp.count({ where });

    return { camps: page.map(enrichFreePlaces), nextCursor, limit, total };
  }

  async getOverviewCounts() {
    const now = new Date();
    const [total, open, upcoming, closed] = await this.prisma.$transaction([
      this.prisma.camp.count(),
      this.prisma.camp.count({ where: this.campStatusWhere('open', now) }),
      this.prisma.camp.count({ where: this.campStatusWhere('upcoming', now) }),
      this.prisma.camp.count({ where: this.campStatusWhere('closed', now) }),
    ]);

    return { total, open, upcoming, closed };
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
    freePlaces: camp.registrations.reduce(
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
