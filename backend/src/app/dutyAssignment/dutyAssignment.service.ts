import { BaseService } from '#core/base/BaseService';
import { injectable } from 'inversify';
import type {
  DutyAssignmentSuggestionCandidate,
  DutyAssignmentSuggestions,
  DutyRotationUnit,
} from '@camp-registration/common/entities';

const DUTY_ASSIGNMENT_INCLUDE = {
  duty: true,
  members: true,
} as const;

interface DutyAssignmentDto {
  dutyId: string;
  rotationUnit: DutyRotationUnit;
  date: string;
  slot?: string | null;
  registrationIds?: string[];
}

interface Stat {
  count: number;
  lastAssignedAt: string | null;
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
        rotationUnit: data.rotationUnit,
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
   * Ranked candidates for the *next* occurrence of a duty, for the given
   * rotation unit (chosen per occurrence, not fixed on the duty — the same
   * duty's history feeds both a PARTICIPANT and a ROOM view). Computed on
   * demand from history — per-event data volume is small enough that this
   * never needs caching.
   *
   * Ranking: fewest times assigned, then longest since last assigned
   * (fairness) — ties broken randomly, so the same "equally fair" group
   * doesn't always list in the same order. When `duty.balanceCountries` is
   * set, PARTICIPANT candidates are then interleaved by country as a
   * secondary pass — fairness order is preserved *within* each country, only
   * the merge across countries changes.
   */
  async getSuggestions(
    eventId: string,
    dutyId: string,
    unit: DutyRotationUnit,
  ): Promise<DutyAssignmentSuggestions | null> {
    const duty = await this.prisma.duty.findFirst({
      where: { id: dutyId, eventId },
    });
    if (!duty) {
      return null;
    }

    // History is unit-agnostic — a duty's past occurrences may have been
    // assigned by participant or by room, but the stored data is always just
    // a member list, so both views are always computed from the same rows.
    const members = await this.prisma.dutyAssignmentMember.findMany({
      where: { dutyAssignment: { dutyId } },
      include: {
        dutyAssignment: { select: { date: true } },
        registration: { include: { bed: true } },
      },
    });

    if (unit === 'ROOM') {
      // Count each room at most once per occurrence, regardless of how many
      // of its occupants were listed as members that day.
      const roomsByAssignment = new Map<
        string,
        { date: string; roomIds: Set<string> }
      >();
      for (const member of members) {
        const roomId = member.registration.bed?.roomId;
        if (!roomId) {
          continue;
        }
        const entry = roomsByAssignment.get(member.dutyAssignmentId) ?? {
          date: member.dutyAssignment.date,
          roomIds: new Set<string>(),
        };
        entry.roomIds.add(roomId);
        roomsByAssignment.set(member.dutyAssignmentId, entry);
      }

      const stats = new Map<string, Stat>();
      for (const { date, roomIds } of roomsByAssignment.values()) {
        for (const roomId of roomIds) {
          record(stats, roomId, date);
        }
      }

      const rooms = await this.prisma.room.findMany({
        where: { eventId },
        include: {
          beds: { include: { registration: { select: { role: true } } } },
        },
      });

      // An empty room can never satisfy the duty — suggesting it would add
      // no one — so it's excluded regardless of excludeStaff.
      const occupiedRooms = rooms.filter((room) => hasOccupants(room));
      const eligibleRooms = duty.excludeStaff
        ? occupiedRooms.filter((room) => !isStaffOnlyRoom(room))
        : occupiedRooms;

      return {
        unit: 'ROOM',
        candidates: rankCandidates(eligibleRooms, stats),
      };
    }

    const stats = new Map<string, Stat>();
    for (const member of members) {
      record(stats, member.registrationId, member.dutyAssignment.date);
    }

    const registrations = await this.prisma.registration.findMany({
      where: {
        eventId,
        status: 'ACCEPTED',
        ...(duty.excludeStaff ? { role: 'participant' } : {}),
      },
      select: { id: true, country: true },
    });

    let candidates = rankCandidates(registrations, stats);
    if (duty.balanceCountries) {
      const countryById = new Map(registrations.map((r) => [r.id, r.country]));
      candidates = interleaveByCountry(candidates, countryById);
    }

    return { unit: 'PARTICIPANT', candidates };
  }
}

function record(stats: Map<string, Stat>, key: string, date: string) {
  const entry = stats.get(key) ?? { count: 0, lastAssignedAt: null };
  entry.count++;
  if (!entry.lastAssignedAt || date > entry.lastAssignedAt) {
    entry.lastAssignedAt = date;
  }
  stats.set(key, entry);
}

interface RoomWithOccupants {
  id: string;
  beds: { registration: { role: string | null } | null }[];
}

function hasOccupants(room: RoomWithOccupants): boolean {
  return room.beds.some((bed) => bed.registration !== null);
}

/** A room dedicated to staff: it has occupants, and none of them is a participant. */
function isStaffOnlyRoom(room: RoomWithOccupants): boolean {
  const occupants = room.beds
    .map((bed) => bed.registration)
    .filter(
      (registration): registration is { role: string | null } => !!registration,
    );

  return (
    occupants.length > 0 && occupants.every((r) => r.role !== 'participant')
  );
}

function rankCandidates(
  entities: { id: string }[],
  stats: Map<string, Stat>,
): DutyAssignmentSuggestionCandidate[] {
  const ranked = entities.map((entity) => {
    const stat = stats.get(entity.id);
    return {
      id: entity.id,
      assignmentCount: stat?.count ?? 0,
      lastAssignedAt: stat?.lastAssignedAt ?? null,
    };
  });

  ranked.sort((a, b) => {
    if (a.assignmentCount !== b.assignmentCount) {
      return a.assignmentCount - b.assignmentCount;
    }
    return (a.lastAssignedAt ?? '').localeCompare(b.lastAssignedAt ?? '');
  });

  shuffleTiedRuns(
    ranked,
    (a, b) =>
      a.assignmentCount === b.assignmentCount &&
      a.lastAssignedAt === b.lastAssignedAt,
  );

  return ranked;
}

/** Fisher-Yates shuffle applied only within consecutive equal-key runs, so
 * fairness ordering is untouched but ties don't always list the same way. */
function shuffleTiedRuns<T>(items: T[], isTied: (a: T, b: T) => boolean) {
  let start = 0;
  while (start < items.length) {
    const first = items[start];
    if (first === undefined) {
      break;
    }

    let end = start + 1;
    while (end < items.length) {
      const next = items[end];
      if (next === undefined || !isTied(first, next)) {
        break;
      }
      end++;
    }

    for (let i = end - 1; i > start; i--) {
      const j = start + Math.floor(Math.random() * (i - start + 1));
      const a = items[i];
      const b = items[j];
      if (a === undefined || b === undefined) {
        continue;
      }
      items[i] = b;
      items[j] = a;
    }

    start = end;
  }
}

/** Round-robins the (already fairness+randomness ranked) candidates across
 * country groups, preserving each group's internal order — spreads
 * countries across the top of the list without disturbing fairness within
 * a country. */
function interleaveByCountry(
  ranked: DutyAssignmentSuggestionCandidate[],
  countryById: Map<string, string | null>,
): DutyAssignmentSuggestionCandidate[] {
  const groups = new Map<string, DutyAssignmentSuggestionCandidate[]>();
  for (const candidate of ranked) {
    const key = countryById.get(candidate.id) ?? '';
    const group = groups.get(key);
    if (group) {
      group.push(candidate);
    } else {
      groups.set(key, [candidate]);
    }
  }

  const queues = [...groups.values()];
  const result: DutyAssignmentSuggestionCandidate[] = [];
  let took = true;
  while (took) {
    took = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        result.push(next);
        took = true;
      }
    }
  }

  return result;
}
