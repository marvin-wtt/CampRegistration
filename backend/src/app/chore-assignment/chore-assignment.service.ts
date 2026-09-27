import { BaseService } from '#core/base/BaseService';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import { injectable } from 'inversify';
import type {
  ChoreAssignmentBulkDeleteQuery,
  ChoreAssignmentCreateData,
  ChoreAssignmentMemberData,
  ChoreAssignmentSuggestions,
  ChoreAssignmentUpdateData,
  ChoreAutoFillData,
  ChoreFairnessEntry,
  ChoreMemberRole,
  ChoreMemberRemovalQuery,
  ChoreMemberRemovalResult,
  ChoreRebalanceChange,
  ChoreRotationUnit,
  ChoreSeriesPlanData,
  ChoreSeriesPlanResult,
} from '@camp-registration/common/entities';
import type { ChoreSlot, Prisma } from '#generated/prisma/client.js';
import {
  buildLedger,
  eligibleFor,
  type ExistingMember,
  fairnessOverview,
  groupAverages,
  type LedgerDuty,
  type MemberPick,
  type MovableDuty,
  type OccurrenceSpec,
  pickForOccurrence,
  planOccurrences,
  planRebalance,
  type PoolPerson,
  rankPeople,
  rankRooms,
  recordDuty,
  toPersonCandidates,
  toRoomCandidates,
} from '#app/chore-assignment/chore-planner';
import type { ChoreAssignmentWithRelations } from '#app/chore-assignment/chore-assignment.types';
import type { ChoreWithSlots } from '#app/chore/chore.types';
import { ulid } from '#utils/ulid';
import { eachDate, toDateString, toDbDate, weekdayOf } from '#utils/date';

const CHORE_ASSIGNMENT_INCLUDE = {
  chore: true,
  members: { orderBy: { id: 'asc' } },
} as const satisfies Prisma.ChoreAssignmentInclude;

const REBALANCE_INCLUDE = {
  chore: { select: { effort: true, eligibility: true } },
  choreSlot: { select: { effort: true } },
  members: true,
} as const satisfies Prisma.ChoreAssignmentInclude;

const LEDGER_INCLUDE = {
  chore: { select: { effort: true } },
  choreSlot: { select: { effort: true } },
  members: true,
} as const satisfies Prisma.ChoreAssignmentInclude;

@injectable()
export class ChoreAssignmentService extends BaseService {
  async getChoreAssignmentById(eventId: string, id: string) {
    return this.prisma.choreAssignment.findFirst({
      where: { id, eventId },
      include: CHORE_ASSIGNMENT_INCLUDE,
    });
  }

  async queryChoreAssignments(eventId: string) {
    return this.prisma.choreAssignment.findMany({
      where: { eventId },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      include: CHORE_ASSIGNMENT_INCLUDE,
    });
  }

  async createChoreAssignment(
    eventId: string,
    chore: ChoreWithSlots,
    data: ChoreAssignmentCreateData,
  ) {
    return this.transaction(async (tx) => {
      let members: MemberPick[] = normalizeMembers(data.members ?? []);
      if (data.autoFill) {
        const [ledger, pool] = await Promise.all([
          this.loadLedger(eventId),
          this.loadPool(eventId),
        ]);
        const spec = occurrenceSpec(
          chore,
          findSlot(chore, data.slotId),
          data.date,
          data.rotationUnit,
        );
        members = [
          ...members,
          ...pickForOccurrence(ledger, pool, spec, members),
        ];
      }

      return tx.choreAssignment.create({
        data: {
          eventId,
          choreId: chore.id,
          slotId: data.slotId ?? null,
          rotationUnit: data.rotationUnit,
          date: toDbDate(data.date),
          note: data.note ?? null,
          members: { createMany: { data: members } },
        },
        include: CHORE_ASSIGNMENT_INCLUDE,
      });
    });
  }

  async updateChoreAssignmentById(id: string, data: ChoreAssignmentUpdateData) {
    const { members, date, ...rest } = data;

    return this.transaction(async (tx) => {
      if (members !== undefined) {
        await tx.choreAssignmentMember.deleteMany({
          where: { choreAssignmentId: id },
        });
      }

      return tx.choreAssignment.update({
        where: { id },
        data: {
          ...rest,
          ...(date !== undefined ? { date: toDbDate(date) } : {}),
          ...(members !== undefined
            ? { members: { createMany: { data: normalizeMembers(members) } } }
            : {}),
        },
        include: CHORE_ASSIGNMENT_INCLUDE,
      });
    });
  }

  async deleteChoreAssignmentById(id: string) {
    await this.prisma.choreAssignment.delete({ where: { id } });
  }

  /** Tops the assignment up to its headcount and supervisor count. */
  async fillChoreAssignment(eventId: string, id: string) {
    return this.transaction(async (tx) => {
      const before = await tx.choreAssignment.findUniqueOrThrow({
        where: { id },
        include: {
          ...CHORE_ASSIGNMENT_INCLUDE,
          chore: { include: { slots: true } },
        },
      });
      const [ledger, pool] = await Promise.all([
        this.loadLedger(eventId),
        this.loadPool(eventId),
      ]);
      const spec = occurrenceSpec(
        before.chore,
        findSlot(before.chore, before.slotId),
        toDateString(before.date),
        before.rotationUnit,
      );
      const picks = pickForOccurrence(ledger, pool, spec, before.members);

      await tx.choreAssignmentMember.createMany({
        data: picks.map((pick) => ({ ...pick, choreAssignmentId: id })),
      });
      return tx.choreAssignment.findUniqueOrThrow({
        where: { id },
        include: CHORE_ASSIGNMENT_INCLUDE,
      });
    });
  }

  /**
   * The members auto-fill would add, without saving — for the edit dialog,
   * where the stored members of the assignment are being replaced anyway.
   */
  async autoFillMembers(
    eventId: string,
    chore: ChoreWithSlots,
    data: ChoreAutoFillData,
  ): Promise<MemberPick[]> {
    const [ledger, pool] = await Promise.all([
      this.loadLedger(eventId, data.assignmentId ? [data.assignmentId] : []),
      this.loadPool(eventId),
    ]);
    const spec = occurrenceSpec(
      chore,
      findSlot(chore, data.slotId),
      data.date,
      data.rotationUnit,
    );

    return pickForOccurrence(
      ledger,
      pool,
      {
        ...spec,
        headcount: data.headcount ?? spec.headcount,
        supervisorCount: data.supervisorCount ?? spec.supervisorCount,
      },
      normalizeMembers(data.members),
    );
  }

  /**
   * Plans one occurrence per selected day and slot, fairly, in date order.
   * Existing occurrences are skipped, topped up or replaced; only planned ones
   * are ever touched — done or cancelled duties are history.
   */
  async planSeries(
    eventId: string,
    chore: ChoreWithSlots,
    data: ChoreSeriesPlanData,
  ): Promise<ChoreSeriesPlanResult> {
    const dates = eachDate(data.from, data.to).filter(
      (date) => !data.weekdays || data.weekdays.includes(weekdayOf(date)),
    );
    const slots: (ChoreSlot | null)[] =
      data.slotIds.length > 0
        ? chore.slots.filter((slot) => data.slotIds.includes(slot.id))
        : [null];

    return this.transaction(async (tx) => {
      const existing = await tx.choreAssignment.findMany({
        where: {
          eventId,
          choreId: chore.id,
          date: { gte: toDbDate(data.from), lte: toDbDate(data.to) },
        },
        include: CHORE_ASSIGNMENT_INCLUDE,
        orderBy: { createdAt: 'asc' },
      });
      const existingByKey = new Map<string, ChoreAssignmentWithRelations>();
      for (const assignment of existing) {
        const key = occurrenceKey(
          toDateString(assignment.date),
          assignment.slotId,
        );
        if (!existingByKey.has(key)) {
          existingByKey.set(key, assignment);
        }
      }

      let skipped = 0;
      const replaced: ChoreAssignmentWithRelations[] = [];
      const occurrences: {
        spec: OccurrenceSpec;
        existing: ExistingMember[];
        slotId: string | null;
        target: ChoreAssignmentWithRelations | null;
      }[] = [];

      for (const date of dates) {
        for (const slot of slots) {
          const slotId = slot?.id ?? null;
          const current = existingByKey.get(occurrenceKey(date, slotId));
          if (
            current &&
            (data.onConflict === 'SKIP' || current.status !== 'PLANNED')
          ) {
            skipped++;
            continue;
          }
          if (current && data.onConflict === 'REPLACE') {
            replaced.push(current);
          }

          const fill = current && data.onConflict === 'FILL';
          occurrences.push({
            spec: occurrenceSpec(chore, slot, date, data.rotationUnit),
            existing: fill ? current.members : [],
            slotId,
            target: fill ? current : null,
          });
        }
      }

      const [ledger, pool] = await Promise.all([
        this.loadLedger(
          eventId,
          replaced.map((assignment) => assignment.id),
        ),
        this.loadPool(eventId),
      ]);
      const picks = planOccurrences(ledger, pool, occurrences);

      await tx.choreAssignment.deleteMany({
        where: { id: { in: replaced.map((assignment) => assignment.id) } },
      });

      const batchId = occurrences.some((o) => !o.target) ? ulid() : null;
      let created = 0;
      let filled = 0;

      for (const [index, occurrence] of occurrences.entries()) {
        const members = picks[index] ?? [];
        const target = occurrence.target;

        if (target) {
          if (members.length === 0) {
            continue;
          }
          await tx.choreAssignmentMember.createMany({
            data: members.map((m) => ({ ...m, choreAssignmentId: target.id })),
          });
          filled++;
          continue;
        }

        await tx.choreAssignment.create({
          data: {
            eventId,
            choreId: chore.id,
            slotId: occurrence.slotId,
            batchId,
            rotationUnit: data.rotationUnit,
            date: toDbDate(occurrence.spec.date),
            members: { createMany: { data: members } },
          },
        });
        created++;
      }

      return {
        batchId: created > 0 ? batchId : null,
        created,
        filled,
        skipped,
      };
    });
  }

  async deleteChoreAssignments(
    eventId: string,
    query: ChoreAssignmentBulkDeleteQuery,
  ): Promise<number> {
    const { count } = await this.prisma.choreAssignment.deleteMany({
      where: {
        eventId,
        batchId: query.batchId,
        choreId: query.choreId ? { in: [query.choreId].flat() } : undefined,
        slotId: query.slotId,
        date:
          query.from || query.to
            ? {
                gte: query.from ? toDbDate(query.from) : undefined,
                lte: query.to ? toDbDate(query.to) : undefined,
              }
            : undefined,
      },
    });

    return count;
  }

  /**
   * Takes a person off every planned duty in the range — for illness or an
   * early departure — optionally refilling each spot with the next-fairest
   * person. Nothing about their absence is stored.
   */
  async removeMember(
    eventId: string,
    registrationId: string,
    query: ChoreMemberRemovalQuery,
  ): Promise<ChoreMemberRemovalResult> {
    return this.transaction(async (tx) => {
      const assignments = await tx.choreAssignment.findMany({
        where: {
          eventId,
          status: 'PLANNED',
          date: {
            gte: toDbDate(query.from),
            lte: query.to ? toDbDate(query.to) : undefined,
          },
          members: { some: { registrationId } },
        },
        include: {
          ...CHORE_ASSIGNMENT_INCLUDE,
          chore: { include: { slots: true } },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      });

      const [ledger, fullPool] = await Promise.all([
        this.loadLedger(
          eventId,
          assignments.map((assignment) => assignment.id),
        ),
        this.loadPool(eventId),
      ]);
      const pool = fullPool.filter((person) => person.id !== registrationId);

      let replaced = 0;
      for (const before of assignments) {
        const remaining = before.members.filter(
          (member) => member.registrationId !== registrationId,
        );
        const removed = before.members.find(
          (member) => member.registrationId === registrationId,
        );

        let picks: MemberPick[] = [];
        if (query.replace && removed && !removed.missed) {
          const spec = occurrenceSpec(
            before.chore,
            findSlot(before.chore, before.slotId),
            toDateString(before.date),
            'PERSON',
          );
          // Exactly one spot, in the removed person's role.
          const count = (role: ChoreMemberRole) =>
            remaining.filter((m) => m.role === role && !m.missed).length +
            (removed.role === role ? 1 : 0);
          picks = pickForOccurrence(
            ledger,
            pool,
            {
              ...spec,
              headcount: count('MEMBER'),
              supervisorCount: count('SUPERVISOR'),
            },
            remaining,
          );
        }
        for (const member of [...remaining, ...picks]) {
          if (!('missed' in member) || !member.missed) {
            recordDuty(
              ledger,
              member.registrationId,
              {
                choreId: before.choreId,
                date: toDateString(before.date),
                effort: effortOf(
                  before.chore,
                  findSlot(before.chore, before.slotId),
                ),
              },
              member.role,
            );
          }
        }

        await tx.choreAssignmentMember.deleteMany({
          where: {
            choreAssignmentId: before.id,
            registrationId,
          },
        });
        await tx.choreAssignmentMember.createMany({
          data: picks.map((pick) => ({
            ...pick,
            choreAssignmentId: before.id,
          })),
        });
        replaced += picks.length;
      }

      return { removed: assignments.length, replaced };
    });
  }

  async getSuggestions(
    eventId: string,
    chore: ChoreWithSlots,
    query: {
      unit: ChoreRotationUnit;
      role: ChoreMemberRole;
      date?: string | undefined;
      assignmentId?: string | undefined;
    },
  ): Promise<ChoreAssignmentSuggestions> {
    const [ledger, pool] = await Promise.all([
      this.loadLedger(eventId, query.assignmentId ? [query.assignmentId] : []),
      this.loadPool(eventId),
    ]);
    const candidates = eligibleFor(pool, query.role, chore.eligibility);
    const averages = groupAverages(ledger, pool);
    const ctx = {
      choreId: chore.id,
      date: query.date,
      balanceCountries: query.role === 'MEMBER' && chore.balanceCountries,
    };

    const unit = query.role === 'SUPERVISOR' ? 'PERSON' : query.unit;
    return {
      unit,
      role: query.role,
      candidates:
        unit === 'ROOM'
          ? toRoomCandidates(rankRooms(ledger, candidates, ctx), averages)
          : toPersonCandidates(rankPeople(ledger, candidates, ctx), averages),
    };
  }

  async getFairness(eventId: string): Promise<ChoreFairnessEntry[]> {
    const [ledger, pool] = await Promise.all([
      this.loadLedger(eventId, [], toDateString(new Date())),
      this.loadPool(eventId),
    ]);
    return fairnessOverview(ledger, pool);
  }

  /**
   * Swaps that even out the load, without saving them. Only upcoming planned
   * duties staffed by person may change hands — today's are left alone.
   */
  async previewRebalance(eventId: string): Promise<ChoreRebalanceChange[]> {
    const today = toDateString(new Date());
    const [assignments, pool] = await Promise.all([
      this.db.choreAssignment.findMany({
        where: { eventId },
        include: REBALANCE_INCLUDE,
      }),
      this.loadPool(eventId),
    ]);

    const fixed: LedgerDuty[] = [];
    const movable: MovableDuty[] = [];
    for (const assignment of assignments) {
      const duty: LedgerDuty = {
        choreId: assignment.choreId,
        date: toDateString(assignment.date),
        effort: assignment.choreSlot?.effort ?? assignment.chore.effort,
        status: assignment.status,
        members: assignment.members,
      };
      if (
        assignment.status === 'PLANNED' &&
        assignment.rotationUnit === 'PERSON' &&
        duty.date > today
      ) {
        movable.push({
          ...duty,
          id: assignment.id,
          eligibility: assignment.chore.eligibility,
        });
      } else {
        fixed.push(duty);
      }
    }

    return planRebalance(fixed, movable, pool);
  }

  // Applies a preview; refused whole if the duties changed since.
  async applyRebalance(
    eventId: string,
    changes: ChoreRebalanceChange[],
  ): Promise<number> {
    const byAssignment = Map.groupBy(changes, (change) => change.assignmentId);

    await this.transaction(async (tx) => {
      for (const [assignmentId, group] of byAssignment) {
        const assignment = await tx.choreAssignment.findFirst({
          where: { id: assignmentId, eventId, status: 'PLANNED' },
          include: { members: true },
        });
        const current = new Set(
          assignment?.members.map((m) => m.registrationId) ?? [],
        );
        const leaving = new Set(group.map((c) => c.fromRegistrationId));
        const stale =
          !assignment ||
          group.some(
            (c) =>
              !assignment.members.some(
                (m) =>
                  m.registrationId === c.fromRegistrationId &&
                  m.role === c.role,
              ) ||
              (current.has(c.toRegistrationId) &&
                !leaving.has(c.toRegistrationId)),
          );
        if (stale) {
          throw new ApiError(
            httpStatus.CONFLICT,
            'The duties changed in the meantime',
          );
        }

        // Out first, then in, so people trading places within a duty don't
        // collide on the unique member key.
        await tx.choreAssignmentMember.deleteMany({
          where: {
            choreAssignmentId: assignmentId,
            registrationId: { in: [...leaving] },
          },
        });
        await tx.choreAssignmentMember.createMany({
          data: group.map((change) => ({
            choreAssignmentId: assignmentId,
            registrationId: change.toRegistrationId,
            role: change.role,
          })),
        });
      }
    });

    return changes.length;
  }

  private async loadLedger(
    eventId: string,
    excludeIds: string[] = [],
    today?: string,
  ) {
    const assignments = await this.db.choreAssignment.findMany({
      where: { eventId, id: { notIn: excludeIds } },
      include: LEDGER_INCLUDE,
    });

    return buildLedger(
      assignments.map((assignment): LedgerDuty => ({
        choreId: assignment.choreId,
        date: toDateString(assignment.date),
        effort: assignment.choreSlot?.effort ?? assignment.chore.effort,
        status: assignment.status,
        members: assignment.members,
      })),
      today,
    );
  }

  private async loadPool(eventId: string): Promise<PoolPerson[]> {
    const registrations = await this.db.registration.findMany({
      where: { eventId, status: 'ACCEPTED' },
      select: {
        id: true,
        role: true,
        country: true,
        bed: { select: { roomId: true } },
      },
    });

    return registrations.map((registration) => ({
      id: registration.id,
      // A registration without a role is a participant.
      staff: registration.role !== null && registration.role !== 'participant',
      country: registration.country,
      roomId: registration.bed?.roomId ?? null,
    }));
  }
}

function occurrenceSpec(
  chore: ChoreWithSlots,
  slot: ChoreSlot | null,
  date: string,
  unit: ChoreRotationUnit,
): OccurrenceSpec {
  return {
    choreId: chore.id,
    date,
    unit,
    effort: effortOf(chore, slot),
    eligibility: chore.eligibility,
    balanceCountries: chore.balanceCountries,
    headcount: slot?.headcount ?? chore.defaultCount ?? 0,
    supervisorCount: slot?.supervisorCount ?? chore.supervisorCount,
  };
}

function effortOf(chore: ChoreWithSlots, slot: ChoreSlot | null) {
  return slot?.effort ?? chore.effort;
}

function findSlot(
  chore: ChoreWithSlots,
  slotId: string | null | undefined,
): ChoreSlot | null {
  return chore.slots.find((slot) => slot.id === slotId) ?? null;
}

// Duplicates collapse to the first entry.
function normalizeMembers(members: ChoreAssignmentMemberData[]) {
  const seen = new Set<string>();
  return members
    .filter(({ registrationId }) => {
      if (seen.has(registrationId)) {
        return false;
      }
      seen.add(registrationId);
      return true;
    })
    .map((member) => ({
      registrationId: member.registrationId,
      role: member.role ?? 'MEMBER',
      missed: member.missed ?? false,
    }));
}

function occurrenceKey(date: string, slotId: string | null): string {
  return `${date}|${slotId ?? ''}`;
}
