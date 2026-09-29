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
  days: Map<string, DayStats>;
}

export interface DayStats {
  dutyCount: number;
  load: number;
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
  days: new Map(),
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
      days: new Map(),
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
  const effort = EFFORT_POINTS[duty.effort];
  const day = stats.days.get(duty.date) ?? { dutyCount: 0, load: 0 };
  stats.load += effort;
  stats.days.set(duty.date, {
    dutyCount: day.dutyCount + 1,
    load: day.load + effort,
  });

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
  // Load already carried on the day being planned.
  dayLoad: number;
  load: number;
  choreCount: number;
  last: string;
  country: string;
}

function compareRanked(a: Ranked, b: Ranked): number {
  return (
    a.dayLoad - b.dayLoad ||
    a.load - b.load ||
    a.choreCount - b.choreCount ||
    a.last.localeCompare(b.last)
  );
}

/**
 * Fairest first: least already carried that day — so a second duty goes to
 * whoever has the lightest one — then lowest load across all chores, then
 * fewest times on this chore, then longest ago — ties shuffled. With country
 * balancing, the country seen least so far goes first among candidates
 * equally loaded — never ahead of a fairer one.
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
    (a, b) => a.dayLoad === b.dayLoad && a.load === b.load,
    (item) => item.country,
    ctx.countryCounts,
  );
}

function dayLoadOf(stats: PersonStats, date: string | undefined): number {
  return date === undefined ? 0 : (stats.days.get(date)?.load ?? 0);
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
      const dayLoad = dayLoadOf(stats, ctx.date);
      return {
        person,
        stats,
        busy: dayLoad > 0,
        dayLoad,
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
      // The busiest occupant, as the room goes together.
      const dayLoad = Math.max(...stats.map((s) => dayLoadOf(s, ctx.date)));
      return {
        roomId,
        memberIds: occupants.map((person) => person.id),
        busy: dayLoad > 0,
        dayLoad,
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
  unit: ChoreRotationUnit;
  // People it needs: a smaller room may take it over, but never below this.
  headcount: number;
}

type Member = MovableDuty['members'][number];

// Who a duty passes between: one person, or a room doing it together.
interface Holder {
  kind: ChoreRotationUnit;
  id: string;
  // Whose load the holder is measured by.
  people: PoolPerson[];
  // Who would take a duty over.
  occupants: PoolPerson[];
}

// What one holder does of a duty, handed to another: one person each on a
// person duty, whole rooms — of any size — on a room duty.
interface Transfer {
  duty: MovableDuty;
  role: ChoreMemberRole;
  leaving: string[];
  joining: string[];
}

/**
 * Evens out loads with as few changes as possible: one upcoming duty at a
 * time passes from a more loaded holder to a less loaded one — or two trade
 * places — as long as one of them is outside the average band. Room duties
 * move by whole rooms. `fixed` duties only count; `movable` ones may change
 * hands.
 */
export function planRebalance(
  fixed: LedgerDuty[],
  movable: MovableDuty[],
  pool: PoolPerson[],
  maxMoves = 200,
): ChoreRebalanceChange[] {
  const duties = movable.map((duty) => ({
    ...duty,
    members: [...duty.members],
  }));
  const roomOf = new Map(pool.map((person) => [person.id, person.roomId]));

  // Every move narrows the spread around the averages; the cap is a guard.
  for (let step = 0; step < maxMoves; step++) {
    const ledger = buildLedger([...fixed, ...duties]);
    const transfers = findTransfers(ledger, duties, pool, roomOf);
    if (!transfers) {
      break;
    }
    for (const { duty, role, leaving, joining } of transfers) {
      duty.members = [
        ...duty.members.filter(
          (member) =>
            member.role !== role || !leaving.includes(member.registrationId),
        ),
        ...joining.map((registrationId) => ({
          registrationId,
          role,
          missed: false,
        })),
      ];
    }
  }

  // Per duty and role, so one that changed hands twice is a single change.
  return movable.flatMap((original, index) => {
    const final = duties[index] ?? original;
    return (['MEMBER', 'SUPERVISOR'] as const).flatMap((role) => {
      const idsOf = (members: Member[]) =>
        members.filter((m) => m.role === role).map((m) => m.registrationId);
      const before = idsOf(original.members);
      const after = idsOf(final.members);
      const from = before.filter((id) => !after.includes(id));
      const to = after.filter((id) => !before.includes(id));
      return from.length + to.length > 0
        ? [
            {
              assignmentId: original.id,
              role,
              fromRegistrationIds: from,
              toRegistrationIds: to,
            },
          ]
        : [];
    });
  });
}

function holdersOf(pool: PoolPerson[], staff: boolean): Holder[][] {
  const people = pool.filter((person) => person.staff === staff);
  const rooms = Map.groupBy(
    people.filter((person) => person.roomId !== null),
    (person) => person.roomId ?? '',
  );
  return [
    people.map((person) => ({
      kind: 'PERSON',
      id: person.id,
      people: [person],
      occupants: [person],
    })),
    [...rooms].map(([roomId, members]) => ({
      kind: 'ROOM',
      id: roomId,
      people: members,
      occupants: pool.filter((person) => person.roomId === roomId),
    })),
  ];
}

// The most uneven pair first; within it, the change that evens loads out best.
function findTransfers(
  ledger: ChoreLedger,
  duties: MovableDuty[],
  pool: PoolPerson[],
  roomOf: ReadonlyMap<string, string | null>,
): Transfer[] | undefined {
  const averages = groupAverages(ledger, pool);
  const staffIds = new Set(
    pool.filter((person) => person.staff).map((person) => person.id),
  );
  const averageOf = (id: string) =>
    staffIds.has(id) ? averages.staff : averages.participants;
  const loadOf = (holder: Holder) =>
    mean(holder.people.map((person) => statsOf(ledger, person.id).load));

  for (const staff of [false, true]) {
    const average = staff ? averages.staff : averages.participants;
    for (const holders of holdersOf(pool, staff)) {
      const sorted = holders.sort((a, b) => loadOf(b) - loadOf(a));

      for (const over of sorted) {
        for (const under of [...sorted].reverse()) {
          if (loadOf(over) <= loadOf(under)) {
            break;
          }
          const outOfBand =
            balanceOf(loadOf(over), average).balance === 'ABOVE' ||
            balanceOf(loadOf(under), average).balance === 'BELOW';
          if (!outOfBand) {
            continue;
          }
          const best = bestTransfers(
            ledger,
            duties,
            roomOf,
            averageOf,
            over,
            under,
          );
          if (best) {
            return best;
          }
        }
      }
    }
  }
  return undefined;
}

// A hand-over from `over` to `under`, or a swap of a heavier for a lighter duty.
function bestTransfers(
  ledger: ChoreLedger,
  duties: MovableDuty[],
  roomOf: ReadonlyMap<string, string | null>,
  averageOf: (id: string) => number,
  over: Holder,
  under: Holder,
): Transfer[] | undefined {
  const outgoing = duties.flatMap(
    (duty) => transfer(duty, over, under, roomOf) ?? [],
  );
  const incoming = duties.flatMap(
    (duty) => transfer(duty, under, over, roomOf) ?? [],
  );

  let best: { transfers: Transfer[]; gain: number } | undefined;
  const consider = (transfers: Transfer[]) => {
    const gain = gainOf(ledger, transfers, averageOf);
    if (gain > 0 && (!best || gain > best.gain)) {
      best = { transfers, gain };
    }
  };

  for (const give of outgoing) {
    consider([give]);
    for (const take of incoming) {
      if (EFFORT_POINTS[take.duty.effort] < EFFORT_POINTS[give.duty.effort]) {
        consider([give, take]);
      }
    }
  }
  return best?.transfers;
}

// What `from` holds of the duty, handed to `to` — whole rooms on room duties.
function transfer(
  duty: MovableDuty,
  from: Holder,
  to: Holder,
  roomOf: ReadonlyMap<string, string | null>,
): Transfer | undefined {
  const byRoom = (member: Member) =>
    duty.unit === 'ROOM' &&
    member.role === 'MEMBER' &&
    !!roomOf.get(member.registrationId);
  const leaving = duty.members.filter(
    (member) =>
      !member.missed &&
      (from.kind === 'ROOM'
        ? byRoom(member) && roomOf.get(member.registrationId) === from.id
        : !byRoom(member) && member.registrationId === from.id),
  );
  const first = leaving.at(0);
  if (!first) {
    return undefined;
  }

  const takers = eligibleFor(to.occupants, first.role, duty.eligibility);
  if (
    takers.length === 0 ||
    takers.some((taker) =>
      duty.members.some((member) => member.registrationId === taker.id),
    )
  ) {
    return undefined;
  }

  // A room of another size may take over, but the duty keeps the people it
  // needs — or, if it was short already, at least those it had.
  if (to.kind === 'ROOM') {
    const active = duty.members.filter(
      (member) => member.role === 'MEMBER' && !member.missed,
    ).length;
    if (
      active - leaving.length + takers.length <
      Math.min(duty.headcount, active)
    ) {
      return undefined;
    }
  }

  return {
    duty,
    role: first.role,
    leaving: leaving.map((member) => member.registrationId),
    joining: takers.map((taker) => taker.id),
  };
}

/**
 * How much the change evens out loads, as the drop in their squared distance
 * from each person's group average — against the average rather than zero,
 * so a smaller room is not favoured just for doing a duty with fewer people.
 * Zero if it would give anyone more duties on a day than they had already,
 * unless they were free.
 */
function gainOf(
  ledger: ChoreLedger,
  transfers: Transfer[],
  averageOf: (id: string) => number,
): number {
  const loadDelta = new Map<string, number>();
  const dayDelta = new Map<string, number>();
  const add = <K>(map: Map<K, number>, key: K, value: number) =>
    map.set(key, (map.get(key) ?? 0) + value);

  for (const { duty, leaving, joining } of transfers) {
    const effort = EFFORT_POINTS[duty.effort];
    for (const id of leaving) {
      add(loadDelta, id, -effort);
      add(dayDelta, `${id}|${duty.date}`, -1);
    }
    for (const id of joining) {
      add(loadDelta, id, effort);
      add(dayDelta, `${id}|${duty.date}`, 1);
    }
  }

  for (const [key, delta] of dayDelta) {
    const [id = '', date = ''] = key.split('|');
    const before = statsOf(ledger, id).days.get(date)?.dutyCount ?? 0;
    if (delta > 0 && before + delta > Math.max(before, 1)) {
      return 0;
    }
  }

  let gain = 0;
  for (const [id, delta] of loadDelta) {
    const offset = statsOf(ledger, id).load - averageOf(id);
    gain += offset * offset - (offset + delta) * (offset + delta);
  }
  return gain;
}
