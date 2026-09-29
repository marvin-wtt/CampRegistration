import type {
  Chore,
  ChoreAssignment,
  ChoreAssignmentMember,
  ChoreEffort,
  ChoreMemberRole,
  ChoreSlot,
} from '@camp-registration/common/entities';

export function findSlot(
  chore: Chore | undefined,
  slotId: string | null | undefined,
): ChoreSlot | undefined {
  return slotId ? chore?.slots.find((slot) => slot.id === slotId) : undefined;
}

// A slot's own values win; the chore's are the fallback.
export function requiredCount(
  chore: Chore | undefined,
  slot: ChoreSlot | undefined,
  role: ChoreMemberRole,
): number {
  return role === 'SUPERVISOR'
    ? (slot?.supervisorCount ?? chore?.supervisorCount ?? 0)
    : (slot?.headcount ?? chore?.defaultCount ?? 0);
}

export function effortOf(
  chore: Chore | undefined,
  slot: ChoreSlot | undefined,
): ChoreEffort {
  return slot?.effort ?? chore?.effort ?? 'NORMAL';
}

export function membersWithRole(
  members: ChoreAssignmentMember[],
  role: ChoreMemberRole,
): ChoreAssignmentMember[] {
  return members.filter((member) => member.role === role);
}

// Spots still to fill — missed members leave theirs open again. Done and
// cancelled duties are history: nothing is open on them any more.
export function openSpots(
  assignment: ChoreAssignment,
  chore: Chore | undefined,
  role: ChoreMemberRole,
): number {
  if (assignment.status !== 'PLANNED') {
    return 0;
  }
  const filled = membersWithRole(assignment.members, role).filter(
    (member) => !member.missed,
  ).length;
  const required = requiredCount(
    chore,
    findSlot(chore, assignment.slotId),
    role,
  );
  return Math.max(required - filled, 0);
}

// By date, then in the order chores and their slots are listed.
export function compareAssignments(
  a: ChoreAssignment,
  b: ChoreAssignment,
  choreById: Map<string, Chore>,
): number {
  const choreA = choreById.get(a.choreId);
  const choreB = choreById.get(b.choreId);
  const slotA = findSlot(choreA, a.slotId);
  const slotB = findSlot(choreB, b.slotId);

  return (
    a.date.localeCompare(b.date) ||
    (choreA?.sortOrder ?? 0) - (choreB?.sortOrder ?? 0) ||
    (slotA?.sortOrder ?? -1) - (slotB?.sortOrder ?? -1)
  );
}

export function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const date = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (date <= end) {
    dates.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return dates;
}

// A fixed display order: members are recreated on every save, so the order
// they come back in isn't stable.
export function sortByName<T extends { registrationId: string }>(
  members: T[],
  names: Map<string, string>,
): T[] {
  return [...members].sort(
    (a, b) =>
      (names.get(a.registrationId) ?? '').localeCompare(
        names.get(b.registrationId) ?? '',
      ) || a.registrationId.localeCompare(b.registrationId),
  );
}
