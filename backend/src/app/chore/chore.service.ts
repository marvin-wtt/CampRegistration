import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import httpStatus from 'http-status';
import ApiError from '#utils/ApiError';
import type {
  ChoreCreateData,
  ChoreSlotData,
  ChoreUpdateData,
} from '@camp-registration/common/entities';
import type { PrismaTransaction } from '#core/database/transaction';

const CHORE_INCLUDE = {
  slots: { orderBy: { sortOrder: 'asc' } },
} as const;

@injectable()
export class ChoreService extends BaseService {
  async getChoreById(eventId: string, id: string) {
    return this.prisma.chore.findFirst({
      where: { id, eventId },
      include: CHORE_INCLUDE,
    });
  }

  async queryChores(eventId: string) {
    return this.prisma.chore.findMany({
      where: { eventId },
      orderBy: { sortOrder: 'asc' },
      include: CHORE_INCLUDE,
    });
  }

  async createChore(eventId: string, data: ChoreCreateData) {
    const { slots, ...rest } = data;

    return this.prisma.chore.create({
      data: {
        ...rest,
        eventId,
        slots: { createMany: { data: (slots ?? []).map(toSlotRow) } },
      },
      include: CHORE_INCLUDE,
    });
  }

  async updateChoreById(id: string, data: ChoreUpdateData) {
    const { slots, ...rest } = data;

    return this.transaction(async (tx) => {
      if (slots !== undefined) {
        await syncSlots(tx, id, slots);
      }

      return tx.chore.update({
        where: { id },
        data: rest,
        include: CHORE_INCLUDE,
      });
    });
  }

  async deleteChoreById(id: string) {
    await this.prisma.chore.delete({ where: { id } });
  }
}

function toSlotRow(slot: ChoreSlotData, index: number) {
  return {
    name: slot.name,
    time: slot.time ?? null,
    headcount: slot.headcount ?? null,
    supervisorCount: slot.supervisorCount ?? null,
    effort: slot.effort ?? null,
    sortOrder: index,
  };
}

// Slots missing from the list are deleted — unless duties still use them.
async function syncSlots(
  tx: PrismaTransaction,
  choreId: string,
  slots: ChoreSlotData[],
) {
  const existing = await tx.choreSlot.findMany({
    where: { choreId },
    include: { _count: { select: { assignments: true } } },
  });
  const keptIds = new Set(slots.flatMap((slot) => (slot.id ? [slot.id] : [])));

  const removed = existing.filter((slot) => !keptIds.has(slot.id));
  if (removed.some((slot) => slot._count.assignments > 0)) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'A time slot that is still used by duties cannot be removed',
    );
  }
  await tx.choreSlot.deleteMany({
    where: { id: { in: removed.map((slot) => slot.id) } },
  });

  const existingIds = new Set(existing.map((slot) => slot.id));
  for (const [index, slot] of slots.entries()) {
    const row = toSlotRow(slot, index);
    if (slot.id && existingIds.has(slot.id)) {
      await tx.choreSlot.update({ where: { id: slot.id }, data: row });
    } else {
      await tx.choreSlot.create({ data: { ...row, choreId } });
    }
  }
}
