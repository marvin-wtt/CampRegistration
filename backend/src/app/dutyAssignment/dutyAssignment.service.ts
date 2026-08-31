import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import type {
  DutyAssignmentSuggestionCandidate,
  DutyAssignmentSuggestions,
} from '@camp-registration/common/entities';

const DUTY_ASSIGNMENT_INCLUDE = {
  duty: true,
  members: true,
} as const;

interface DutyAssignmentDto {
  dutyId: string;
  date: string;
  slot?: string | null;
  registrationIds?: string[];
}

@injectable()
export class DutyAssignmentService extends BaseService {
  async getDutyAssignmentById(eventId: string, id: string) {
    return this.prisma.dutyAssignment.findFirst({
      where: { id, eventId },
      include: DUTY_ASSIGNMENT_INCLUDE,
    });
  }

  async queryDutyAssignments(eventId: string) {
    return this.prisma.dutyAssignment.findMany({
      where: { eventId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: DUTY_ASSIGNMENT_INCLUDE,
    });
  }

  async createDutyAssignment(eventId: string, data: DutyAssignmentDto) {
    return this.prisma.dutyAssignment.create({
      data: {
        eventId,
        dutyId: data.dutyId,
        date: data.date,
        slot: data.slot,
        members: {
          createMany: {
            data: (data.registrationIds ?? []).map((registrationId) => ({
              registrationId,
            })),
          },
        },
      },
      include: DUTY_ASSIGNMENT_INCLUDE,
    });
  }

  async updateDutyAssignmentById(id: string, data: Partial<DutyAssignmentDto>) {
    const { registrationIds, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      if (registrationIds !== undefined) {
        await tx.dutyAssignmentMember.deleteMany({
          where: { dutyAssignmentId: id },
        });
      }

      return tx.dutyAssignment.update({
        where: { id },
        data: {
          ...rest,
          ...(registrationIds !== undefined
            ? {
                members: {
                  createMany: {
                    data: registrationIds.map((registrationId) => ({
                      registrationId,
                    })),
                  },
                },
              }
            : {}),
        },
        include: DUTY_ASSIGNMENT_INCLUDE,
      });
    });
  }

  async deleteDutyAssignmentById(id: string) {
    await this.prisma.dutyAssignment.delete({ where: { id } });
  }

  /**
   * Ranked candidates for the *next* occurrence of a duty: least-often /
   * least-recently assigned first. Computed on demand from history —
   * per-event data volume is small enough that this never needs caching.
   */
  async getSuggestions(
    eventId: string,
    dutyId: string,
  ): Promise<DutyAssignmentSuggestions | null> {
    const duty = await this.prisma.duty.findFirst({
      where: { id: dutyId, eventId },
    });
    if (!duty) {
      return null;
    }

    const members = await this.prisma.dutyAssignmentMember.findMany({
      where: { dutyAssignment: { dutyId } },
      include: {
        dutyAssignment: { select: { date: true } },
        registration: { include: { bed: true } },
      },
    });

    const stats = new Map<
      string,
      { count: number; lastAssignedAt: string | null }
    >();

    const record = (key: string, date: string) => {
      const entry = stats.get(key) ?? { count: 0, lastAssignedAt: null };
      entry.count++;
      if (!entry.lastAssignedAt || date > entry.lastAssignedAt) {
        entry.lastAssignedAt = date;
      }
      stats.set(key, entry);
    };

    if (duty.rotationUnit === 'ROOM') {
      for (const member of members) {
        const roomId = member.registration.bed?.roomId;
        if (roomId) {
          record(roomId, member.dutyAssignment.date);
        }
      }

      const rooms = await this.prisma.room.findMany({
        where: { eventId },
        select: { id: true },
      });

      return {
        unit: 'ROOM',
        candidates: rankCandidates(rooms, stats),
      };
    }

    for (const member of members) {
      record(member.registrationId, member.dutyAssignment.date);
    }

    const registrations = await this.prisma.registration.findMany({
      where: { eventId, status: 'ACCEPTED' },
      select: { id: true },
    });

    return {
      unit: 'PARTICIPANT',
      candidates: rankCandidates(registrations, stats),
    };
  }
}

function rankCandidates(
  entities: { id: string }[],
  stats: Map<string, { count: number; lastAssignedAt: string | null }>,
): DutyAssignmentSuggestionCandidate[] {
  return entities
    .map((entity) => {
      const stat = stats.get(entity.id);
      return {
        id: entity.id,
        assignmentCount: stat?.count ?? 0,
        lastAssignedAt: stat?.lastAssignedAt ?? null,
      };
    })
    .sort((a, b) => {
      if (a.assignmentCount !== b.assignmentCount) {
        return a.assignmentCount - b.assignmentCount;
      }
      return (a.lastAssignedAt ?? '').localeCompare(b.lastAssignedAt ?? '');
    });
}
