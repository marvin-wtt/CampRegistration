import type {
  ChoreAssignmentStatus,
  ChoreAssignmentSuggestionCandidate,
  ChoreBalance,
  ChoreEffort,
  ChoreEligibility,
  ChoreFairnessEntry,
  ChoreMemberRole,
  ChoreRebalanceChange,
  ChoreRotationUnit,
} from '@camp-registration/common/entities';
import { shuffleTiedRuns, spreadWithinTies } from '#utils/ordering';

// Kept out of the UI: people only ever see Light / Normal / Heavy.
export const EFFORT_POINTS: Record<ChoreEffort, number> = {
  LIGHT: 1,
  NORMAL: 2,
  HEAVY: 3,
};

export interface LedgerDuty {
  choreId: string;
  date: string;
  effort: ChoreEffort;
  status: ChoreAssignmentStatus;
  members: { registrationId: string; role: ChoreMemberRole; missed: boolean }[];
}

export interface PersonStats {
  load: number;
  doneLoad: number;
  dutyCount: number;
  doneDutyCount: number;
  heavyCount: number;
  supervisionCount: number;
  missedCount: number;
  choreCounts: Map<string, number>;
  lastByChore: Map<string, string>;
  busyDates: Set<string>;
}

export type ChoreLedger = Map<string, PersonStats>;

export interface PoolPerson {
  id: string;
  staff: boolean;
  country: string | null;
  roomId: string | null;
}

export interface MemberPick {
  registrationId: string;
  role: ChoreMemberRole;
}

// Missed members keep their place but no longer fill a spot.
export type ExistingMember = MemberPick & { missed?: boolean };

export interface OccurrenceSpec {
  choreId: string;
  date: string;
  effort: ChoreEffort;
  unit: ChoreRotationUnit;
  eligibility: ChoreEligibility;
  balanceCountries: boolean;
  headcount: number;
  supervisorCount: number;
}

interface RankContext {
  choreId: string;
  date?: string | undefined;
  balanceCountries?: boolean | undefined;
  // Countries already on the duty, so balancing continues from them.
  countryCounts?: ReadonlyMap<string, number> | undefined;
  random?: (() => number) | undefined;
}

const EMPTY_STATS: PersonStats = {
  load: 0,
  doneLoad: 0,
  dutyCount: 0,
  doneDutyCount: 0,
  heavyCount: 0,
  supervisionCount: 0,
  missedCount: 0,
  choreCounts: new Map(),
  lastByChore: new Map(),
  busyDates: new Set(),
};

function statsOf(ledger: ChoreLedger, id: string): PersonStats {
  return ledger.get(id) ?? EMPTY_STATS;
}

function mutableStatsOf(ledger: ChoreLedger, id: string): PersonStats {
  let stats = ledger.get(id);
  if (!stats) {
    stats = {
      ...EMPTY_STATS,
      choreCounts: new Map(),
      lastByChore: new Map(),
      busyDates: new Set(),
    };
    ledger.set(id, stats);
  }
  return stats;
}

/**
 * Who has done how much, across every chore. Cancelled duties and missed
 * entries don't count; planned ones do, whether past or ahead — ticking
 * duties off is optional, and planning ahead must see what's already planned.
 * With `today`, duties marked done or dated before it also count as done.
 */
export function buildLedger(
  duties: Iterable<LedgerDuty>,
  today?: string,
): ChoreLedger {
  const ledger: ChoreLedger = new Map();
  for (const duty of duties) {
    if (duty.status === 'CANCELLED') {
      continue;
    }
    const done =
      duty.status === 'DONE' || (today !== undefined && duty.date < today);
    for (const member of duty.members) {
      const stats = mutableStatsOf(ledger, member.registrationId);
      if (member.missed) {
        stats.missedCount++;
        continue;
      }
      recordDuty(ledger, member.registrationId, duty, member.role);
      if (done) {
        stats.doneLoad += EFFORT_POINTS[duty.effort];
        if (member.role === 'MEMBER') {
          stats.doneDutyCount++;
        }
      }
    }
  }
  return ledger;
}

export function recordDuty(
  ledger: ChoreLedger,
  registrationId: string,
  duty: Pick<LedgerDuty, 'choreId' | 'date' | 'effort'>,
  role: ChoreMemberRole,
) {
  const stats = mutableStatsOf(ledger, registrationId);
  stats.load += EFFORT_POINTS[duty.effort];
  stats.busyDates.add(duty.date);

  if (role === 'SUPERVISOR') {
    stats.supervisionCount++;
    return;
  }

  stats.dutyCount++;
  if (duty.effort === 'HEAVY') {
    stats.heavyCount++;
  }
  stats.choreCounts.set(
    duty.choreId,
    (stats.choreCounts.get(duty.choreId) ?? 0) + 1,
  );
  const last = stats.lastByChore.get(duty.choreId);
  if (!last || duty.date > last) {
    stats.lastByChore.set(duty.choreId, duty.date);
  }
}

// Supervisors are always staff.
export function eligibleFor(
  pool: PoolPerson[],
  role: ChoreMemberRole,
  eligibility: ChoreEligibility,
): PoolPerson[] {
  if (role === 'SUPERVISOR' || eligibility === 'STAFF') {
    return pool.filter((person) => person.staff);
  }
  return eligibility === 'PARTICIPANTS'
    ? pool.filter((person) => !person.staff)
    : pool;
}

interface Ranked {
  busy: boolean;
  load: number;
  choreCount: number;
  last: string;
  country: string;
}

function compareRanked(a: Ranked, b: Ranked): number {
  return (
    Number(a.busy) - Number(b.busy) ||
    a.load - b.load ||
    a.choreCount - b.choreCount ||
    a.last.localeCompare(b.last)
  );
}

/**
 * Fairest first: not already on a duty that day, then lowest load across all
 * chores, then fewest times on this chore, then longest ago — ties shuffled.
 * With country balancing, the country seen least so far goes first among
 * candidates equally busy and loaded — never ahead of a fairer one.
 */
function rank<T extends Ranked>(items: T[], ctx: RankContext): T[] {
  const sorted = shuffleTiedRuns(
    [...items].sort(compareRanked),
    (a, b) => compareRanked(a, b) === 0,
    ctx.random,
  );
  if (!ctx.balanceCountries) {
    return sorted;
  }

  return spreadWithinTies(
    sorted,
    (a, b) => a.busy === b.busy && a.load === b.load,
    (item) => item.country,
    ctx.countryCounts,
  );
}

export interface RankedPerson extends Ranked {
  person: PoolPerson;
  stats: PersonStats;
}

export function rankPeople(
  ledger: ChoreLedger,
  people: PoolPerson[],
  ctx: RankContext,
): RankedPerson[] {
  return rank(
    people.map((person) => {
      const stats = statsOf(ledger, person.id);
      return {
        person,
        stats,
        busy: ctx.date !== undefined && stats.busyDates.has(ctx.date),
        load: stats.load,
        choreCount: stats.choreCounts.get(ctx.choreId) ?? 0,
        last: stats.lastByChore.get(ctx.choreId) ?? '',
        country: person.country ?? '',
      };
    }),
    ctx,
  );
}

export interface RankedRoom extends Ranked {
  roomId: string;
  memberIds: string[];
  dutyCount: number;
}

// A room ranks by the average of the occupants who'd do the duty.
export function rankRooms(
  ledger: ChoreLedger,
  people: PoolPerson[],
  ctx: RankContext,
): RankedRoom[] {
  const rooms = new Map<string, PoolPerson[]>();
  for (const person of people) {
    if (person.roomId) {
      rooms.set(person.roomId, [...(rooms.get(person.roomId) ?? []), person]);
    }
  }

  return rank(
    [...rooms].map(([roomId, occupants]) => {
      const stats = occupants.map((person) => statsOf(ledger, person.id));
      const mean = (value: (s: PersonStats) => number) =>
        stats.reduce((sum, s) => sum + value(s), 0) / stats.length;
      return {
        roomId,
        memberIds: occupants.map((person) => person.id),
        busy:
          ctx.date !== undefined &&
          stats.some((s) => s.busyDates.has(ctx.date ?? '')),
        load: mean((s) => s.load),
        dutyCount: Math.round(mean((s) => s.dutyCount)),
        choreCount: mean((s) => s.choreCounts.get(ctx.choreId) ?? 0),
        last: stats.reduce((latest, s) => {
          const last = s.lastByChore.get(ctx.choreId) ?? '';
          return last > latest ? last : latest;
        }, ''),
        country: '',
      };
    }),
    ctx,
  );
}

/**
 * The people to add so the occurrence reaches its headcount and supervisor
 * count. Only fills gaps — who is already assigned is never changed. By room,
 * whole rooms are added until the headcount is covered.
 */
export function pickForOccurrence(
  ledger: ChoreLedger,
  pool: PoolPerson[],
  spec: OccurrenceSpec,
  existing: ExistingMember[],
  random?: () => number,
): MemberPick[] {
  const taken = new Set(existing.map((member) => member.registrationId));
  const picks: MemberPick[] = [];
  const ctx: RankContext = {
    choreId: spec.choreId,
    date: spec.date,
    balanceCountries: spec.balanceCountries,
    countryCounts: countriesOf(pool, existing),
    random,
  };

  const filled = (role: ChoreMemberRole) =>
    existing.filter((m) => m.role === role && !m.missed).length;
  let missing = spec.headcount - filled('MEMBER');
  const candidates = eligibleFor(pool, 'MEMBER', spec.eligibility).filter(
    (person) => !taken.has(person.id),
  );

  if (spec.unit === 'ROOM') {
    for (const room of rankRooms(ledger, candidates, ctx)) {
      if (missing <= 0) {
        break;
      }
      picks.push(
        ...room.memberIds.map((id) => ({
          registrationId: id,
          role: 'MEMBER' as const,
        })),
      );
      missing -= room.memberIds.length;
    }
  } else if (missing > 0) {
    picks.push(
      ...rankPeople(ledger, candidates, ctx)
        .slice(0, missing)
        .map(({ person }) => ({
          registrationId: person.id,
          role: 'MEMBER' as const,
        })),
    );
  }

  for (const pick of picks) {
    taken.add(pick.registrationId);
  }

  const missingSupervisors = spec.supervisorCount - filled('SUPERVISOR');
  if (missingSupervisors > 0) {
    const supervisors = eligibleFor(
      pool,
      'SUPERVISOR',
      spec.eligibility,
    ).filter((person) => !taken.has(person.id));
    picks.push(
      ...rankPeople(ledger, supervisors, { ...ctx, balanceCountries: false })
        .slice(0, missingSupervisors)
        .map(({ person }) => ({
          registrationId: person.id,
          role: 'SUPERVISOR' as const,
        })),
    );
  }

  return picks;
}

function countriesOf(
  pool: PoolPerson[],
  existing: ExistingMember[],
): Map<string, number> {
  const countryById = new Map(pool.map((p) => [p.id, p.country ?? '']));
  const counts = new Map<string, number>();
  for (const member of existing) {
    if (member.role === 'MEMBER' && !member.missed) {
      const country = countryById.get(member.registrationId) ?? '';
      counts.set(country, (counts.get(country) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Picks every occurrence in the given (chronological) order, recording each
 * pick in the ledger so later occurrences see the earlier ones.
 */
export function planOccurrences(
  ledger: ChoreLedger,
  pool: PoolPerson[],
  occurrences: { spec: OccurrenceSpec; existing: ExistingMember[] }[],
  random?: () => number,
): MemberPick[][] {
  return occurrences.map(({ spec, existing }) => {
    const picks = pickForOccurrence(ledger, pool, spec, existing, random);
    for (const pick of picks) {
      recordDuty(ledger, pick.registrationId, spec, pick.role);
    }
    return picks;
  });
}

function mean(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Average load per group — participants and staff are compared among
 * themselves, since their duties differ. The mean, not the median: early on
 * most people have no duty yet, and a median of 0 would put anyone with a
 * single duty "above average".
 */
export function groupAverages(
  ledger: ChoreLedger,
  pool: PoolPerson[],
): { participants: number; staff: number } {
  const loads = (staff: boolean) =>
    pool
      .filter((person) => person.staff === staff)
      .map((person) => statsOf(ledger, person.id).load);
  return { participants: mean(loads(false)), staff: mean(loads(true)) };
}

// Smoothed by one point, so a single duty early on isn't "far above average".
export function balanceOf(
  load: number,
  groupAverage: number,
): { share: number; balance: ChoreBalance } {
  const share = (load + 1) / (groupAverage + 1);
  const balance: ChoreBalance =
    share < 0.75 ? 'BELOW' : share > 1.35 ? 'ABOVE' : 'AVERAGE';
  return { share, balance };
}

export function toPersonCandidates(
  ranked: RankedPerson[],
  averages: { participants: number; staff: number },
): ChoreAssignmentSuggestionCandidate[] {
  return ranked.map((entry) => ({
    id: entry.person.id,
    assignmentCount: entry.choreCount,
    dutyCount: entry.stats.dutyCount,
    lastAssignedAt: entry.last || null,
    busy: entry.busy,
    balance: balanceOf(
      entry.load,
      entry.person.staff ? averages.staff : averages.participants,
    ).balance,
  }));
}

export function toRoomCandidates(
  ranked: RankedRoom[],
  averages: { participants: number; staff: number },
): ChoreAssignmentSuggestionCandidate[] {
  return ranked.map((entry) => ({
    id: entry.roomId,
    assignmentCount: Math.round(entry.choreCount),
    dutyCount: entry.dutyCount,
    lastAssignedAt: entry.last || null,
    busy: entry.busy,
    balance: balanceOf(entry.load, averages.participants).balance,
  }));
}

export function fairnessOverview(
  ledger: ChoreLedger,
  pool: PoolPerson[],
): ChoreFairnessEntry[] {
  const averages = groupAverages(ledger, pool);
  return pool.map((person) => {
    const stats = statsOf(ledger, person.id);
    return {
      registrationId: person.id,
      dutyCount: stats.dutyCount,
      heavyCount: stats.heavyCount,
      supervisionCount: stats.supervisionCount,
      missedCount: stats.missedCount,
      load: stats.load,
      doneLoad: stats.doneLoad,
      doneDutyCount: stats.doneDutyCount,
      ...balanceOf(
        stats.load,
        person.staff ? averages.staff : averages.participants,
      ),
    };
  });
}

export interface MovableDuty extends LedgerDuty {
  id: string;
  eligibility: ChoreEligibility;
}

// A working copy of a spot on a duty, remembering who held it at first.
type Spot = MovableDuty['members'][number] & { originalId: string };

type WorkingDuty = Omit<MovableDuty, 'members'> & { members: Spot[] };

interface Move {
  spot: Spot;
  to: string;
}

/**
 * Evens out loads with as few changes as possible: one upcoming duty at a
 * time passes from a more loaded person to a less loaded one who can take it,
 * as long as that narrows their gap and one of them is outside the average
 * band. `fixed` duties only count; `movable` ones may change hands.
 */
export function planRebalance(
  fixed: LedgerDuty[],
  movable: MovableDuty[],
  pool: PoolPerson[],
  maxMoves = 200,
): ChoreRebalanceChange[] {
  const duties: WorkingDuty[] = movable.map((duty) => ({
    ...duty,
    members: duty.members.map((member) => ({
      ...member,
      originalId: member.registrationId,
    })),
  }));

  // Every move shrinks the spread of loads, so this ends; the cap is a guard.
  for (let step = 0; step < maxMoves; step++) {
    const move = findMove(buildLedger([...fixed, ...duties]), duties, pool);
    if (!move) {
      break;
    }
    move.spot.registrationId = move.to;
  }

  // Per spot, so one that changed hands twice is a single change.
  return duties.flatMap((duty) =>
    duty.members
      .filter((spot) => spot.registrationId !== spot.originalId)
      .map((spot) => ({
        assignmentId: duty.id,
        role: spot.role,
        fromRegistrationId: spot.originalId,
        toRegistrationId: spot.registrationId,
      })),
  );
}

// The most uneven pair first; within it, the duty that evens them out best.
function findMove(
  ledger: ChoreLedger,
  duties: WorkingDuty[],
  pool: PoolPerson[],
): Move | undefined {
  const averages = groupAverages(ledger, pool);
  const loadOf = (person: PoolPerson) => statsOf(ledger, person.id).load;

  for (const staff of [false, true]) {
    const average = staff ? averages.staff : averages.participants;
    const group = pool
      .filter((person) => person.staff === staff)
      .sort((a, b) => loadOf(b) - loadOf(a));

    for (const over of group) {
      for (const under of [...group].reverse()) {
        const gap = loadOf(over) - loadOf(under);
        if (gap <= 0) {
          break;
        }
        const outOfBand =
          balanceOf(loadOf(over), average).balance === 'ABOVE' ||
          balanceOf(loadOf(under), average).balance === 'BELOW';
        if (!outOfBand) {
          continue;
        }
        const move = bestMove(ledger, duties, over, under, gap);
        if (move) {
          return move;
        }
      }
    }
  }
  return undefined;
}

function bestMove(
  ledger: ChoreLedger,
  duties: WorkingDuty[],
  over: PoolPerson,
  under: PoolPerson,
  gap: number,
): Move | undefined {
  const busy = statsOf(ledger, under.id).busyDates;
  let best: (Move & { remaining: number }) | undefined;

  for (const duty of duties) {
    const effort = EFFORT_POINTS[duty.effort];
    // Only if it narrows the gap — otherwise it would just flip it.
    if (gap <= effort || busy.has(duty.date)) {
      continue;
    }
    if (duty.members.some((m) => m.registrationId === under.id)) {
      continue;
    }
    const spot = duty.members.find(
      (m) => m.registrationId === over.id && !m.missed,
    );
    if (
      !spot ||
      eligibleFor([under], spot.role, duty.eligibility).length === 0
    ) {
      continue;
    }
    const remaining = Math.abs(gap - 2 * effort);
    if (!best || remaining < best.remaining) {
      best = { spot, to: under.id, remaining };
    }
  }
  return best;
}
