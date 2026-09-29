import { describe, expect, it } from 'vitest';
import type { ChoreRebalanceChange } from '@camp-registration/common/entities';
import {
  balanceOf,
  buildLedger,
  fairnessOverview,
  type LedgerDuty,
  type MovableDuty,
  type OccurrenceSpec,
  pickForOccurrence,
  planOccurrences,
  planRebalance,
  type PoolPerson,
  rankPeople,
} from '#app/chore-assignment/chore-planner';

const participant = (
  id: string,
  extra: Partial<PoolPerson> = {},
): PoolPerson => ({ id, staff: false, country: null, roomId: null, ...extra });
const staff = (id: string, extra: Partial<PoolPerson> = {}): PoolPerson =>
  participant(id, { staff: true, ...extra });

const duty = (
  registrationIds: string[],
  extra: Partial<LedgerDuty> = {},
): LedgerDuty => ({
  choreId: 'kitchen',
  date: '2026-07-01',
  effort: 'NORMAL',
  status: 'PLANNED',
  members: registrationIds.map((registrationId) => ({
    registrationId,
    role: 'MEMBER',
    missed: false,
  })),
  ...extra,
});

const spec = (extra: Partial<OccurrenceSpec> = {}): OccurrenceSpec => ({
  choreId: 'kitchen',
  date: '2026-07-10',
  effort: 'NORMAL',
  unit: 'PERSON',
  eligibility: 'PARTICIPANTS',
  balanceCountries: false,
  headcount: 1,
  supervisorCount: 0,
  ...extra,
});

const ids = (picks: { registrationId: string }[]) =>
  picks.map((pick) => pick.registrationId);

describe('buildLedger', () => {
  it('weights duties by effort across all chores', () => {
    const ledger = buildLedger([
      duty(['a'], { effort: 'HEAVY', choreId: 'dishes' }),
      duty(['a'], { effort: 'LIGHT' }),
      duty(['b'], { effort: 'NORMAL' }),
    ]);

    expect(ledger.get('a')?.load).toBe(4);
    expect(ledger.get('a')?.dutyCount).toBe(2);
    expect(ledger.get('a')?.heavyCount).toBe(1);
    expect(ledger.get('b')?.load).toBe(2);
  });

  it('ignores cancelled duties and missed members', () => {
    const ledger = buildLedger([
      duty(['a'], { status: 'CANCELLED' }),
      {
        ...duty([]),
        members: [{ registrationId: 'b', role: 'MEMBER', missed: true }],
      },
    ]);

    expect(ledger.get('a')).toBeUndefined();
    expect(ledger.get('b')?.load).toBe(0);
    expect(ledger.get('b')?.missedCount).toBe(1);
  });

  it('counts supervision as load, not as a duty', () => {
    const ledger = buildLedger([
      {
        ...duty([]),
        members: [{ registrationId: 's', role: 'SUPERVISOR', missed: false }],
      },
    ]);

    expect(ledger.get('s')?.load).toBe(2);
    expect(ledger.get('s')?.dutyCount).toBe(0);
    expect(ledger.get('s')?.supervisionCount).toBe(1);
  });
});

describe('rankPeople', () => {
  it('prefers people who are free that day, then the lowest load', () => {
    const ledger = buildLedger([
      duty(['busy'], { date: '2026-07-10', choreId: 'trash', effort: 'LIGHT' }),
      duty(['heavy'], { effort: 'HEAVY', choreId: 'dishes' }),
      duty(['light'], { effort: 'LIGHT', choreId: 'dishes' }),
    ]);
    const pool = ['busy', 'heavy', 'light', 'fresh'].map((id) =>
      participant(id),
    );

    const ranked = rankPeople(ledger, pool, {
      choreId: 'kitchen',
      date: '2026-07-10',
    });

    expect(ranked.map((r) => r.person.id)).toEqual([
      'fresh',
      'light',
      'heavy',
      'busy',
    ]);
  });

  it('interleaves countries without disturbing the order within one', () => {
    const ledger = buildLedger([duty(['de2']), duty(['de3']), duty(['de3'])]);
    const pool = [
      participant('de1', { country: 'de' }),
      participant('de2', { country: 'de' }),
      participant('de3', { country: 'de' }),
      participant('fr1', { country: 'fr' }),
    ];

    const order = rankPeople(ledger, pool, {
      choreId: 'kitchen',
      balanceCountries: true,
    }).map((r) => r.person.id);

    expect(order.slice(0, 2).sort()).toEqual(['de1', 'fr1']);
    expect(order.indexOf('de2')).toBeLessThan(order.indexOf('de3'));
  });

  it('never balances countries at the expense of fairness', () => {
    const ledger = buildLedger([duty(['fr1']), duty(['fr1']), duty(['fr1'])]);
    const pool = [
      participant('de1', { country: 'de' }),
      participant('de2', { country: 'de' }),
      participant('fr1', { country: 'fr' }),
    ];

    const order = rankPeople(ledger, pool, {
      choreId: 'kitchen',
      balanceCountries: true,
    }).map((r) => r.person.id);

    expect(order.at(-1)).toBe('fr1');
  });
});

describe('pickForOccurrence', () => {
  it('balances countries against the members already on the duty', () => {
    const pool = [
      participant('de1', { country: 'de' }),
      participant('de2', { country: 'de' }),
      participant('fr1', { country: 'fr' }),
    ];

    const picks = pickForOccurrence(
      buildLedger([]),
      pool,
      spec({ headcount: 2, balanceCountries: true }),
      [{ registrationId: 'de1', role: 'MEMBER' }],
    );

    expect(ids(picks)).toEqual(['fr1']);
  });

  it('only fills the gaps', () => {
    const pool = ['a', 'b', 'c'].map((id) => participant(id));

    const picks = pickForOccurrence(
      buildLedger([]),
      pool,
      spec({ headcount: 2 }),
      [{ registrationId: 'a', role: 'MEMBER' }],
    );

    expect(picks).toHaveLength(1);
    expect(ids(picks)).not.toContain('a');
  });

  it('replaces a missed member without picking them again', () => {
    const pool = ['a', 'b'].map((id) => participant(id));

    const picks = pickForOccurrence(buildLedger([]), pool, spec(), [
      { registrationId: 'a', role: 'MEMBER', missed: true },
    ]);

    expect(ids(picks)).toEqual(['b']);
  });

  it('respects eligibility and takes supervisors from staff', () => {
    const pool = [participant('p1'), participant('p2'), staff('s1')];

    const picks = pickForOccurrence(
      buildLedger([]),
      pool,
      spec({ headcount: 5, supervisorCount: 1 }),
      [],
    );

    expect(ids(picks.filter((p) => p.role === 'MEMBER')).sort()).toEqual([
      'p1',
      'p2',
    ]);
    expect(picks.filter((p) => p.role === 'SUPERVISOR')).toEqual([
      { registrationId: 's1', role: 'SUPERVISOR' },
    ]);
  });

  it('picks only staff for a staff duty', () => {
    const pool = [participant('p1'), staff('s1'), staff('s2')];

    const picks = pickForOccurrence(
      buildLedger([]),
      pool,
      spec({ headcount: 2, eligibility: 'STAFF' }),
      [],
    );

    expect(ids(picks).sort()).toEqual(['s1', 's2']);
  });

  it('adds whole rooms until the headcount is covered', () => {
    const pool = [
      participant('a1', { roomId: 'a' }),
      participant('a2', { roomId: 'a' }),
      participant('b1', { roomId: 'b' }),
      participant('c1', { roomId: 'c' }),
    ];
    const ledger = buildLedger([
      duty(['c1']),
      duty(['b1'], { effort: 'LIGHT' }),
    ]);

    const picks = pickForOccurrence(
      ledger,
      pool,
      spec({ unit: 'ROOM', headcount: 3 }),
      [],
    );

    expect(ids(picks)).toEqual(['a1', 'a2', 'b1']);
  });

  it('never adds staff occupants of a room to a participant duty', () => {
    const pool = [
      participant('p1', { roomId: 'r' }),
      staff('s1', { roomId: 'r' }),
    ];

    const picks = pickForOccurrence(
      buildLedger([]),
      pool,
      spec({ unit: 'ROOM', headcount: 2 }),
      [],
    );

    expect(ids(picks)).toEqual(['p1']);
  });
});

describe('planOccurrences', () => {
  it('spreads a series evenly', () => {
    const pool = ['a', 'b', 'c', 'd', 'e'].map((id) => participant(id));
    const occurrences = Array.from({ length: 12 }, (_, day) => ({
      spec: spec({
        date: `2026-07-${String(day + 1).padStart(2, '0')}`,
        headcount: 2,
      }),
      existing: [],
    }));

    const ledger = buildLedger([]);
    planOccurrences(ledger, pool, occurrences);

    const counts = pool.map((person) => ledger.get(person.id)?.dutyCount ?? 0);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it('balances effort across chores', () => {
    const pool = ['a', 'b'].map((id) => participant(id));
    const ledger = buildLedger([
      duty(['a'], { effort: 'HEAVY', choreId: 'dishes' }),
    ]);

    const [picks = []] = planOccurrences(ledger, pool, [
      { spec: spec({ effort: 'LIGHT' }), existing: [] },
    ]);

    expect(ids(picks)).toEqual(['b']);
  });

  it('avoids two duties on the same day when possible', () => {
    const pool = ['a', 'b', 'c', 'd'].map((id) => participant(id));

    const [first = [], second = []] = planOccurrences(buildLedger([]), pool, [
      { spec: spec({ headcount: 2 }), existing: [] },
      { spec: spec({ headcount: 2, choreId: 'dishes' }), existing: [] },
    ]);

    expect(ids(first).filter((id) => ids(second).includes(id))).toEqual([]);
  });

  it('gives a second duty that day to whoever has the lightest one', () => {
    const pool = ['a', 'b', 'c'].map((id) => participant(id));
    const ledger = buildLedger([
      duty(['a'], { date: '2026-07-10', choreId: 'dishes', effort: 'LIGHT' }),
      duty(['b'], { date: '2026-07-10', choreId: 'trash', effort: 'HEAVY' }),
      duty(['c'], { date: '2026-07-10', choreId: 'hall', effort: 'NORMAL' }),
      // The most overall, but the least today.
      duty(['a'], { date: '2026-07-01', effort: 'HEAVY' }),
    ]);

    const [picks = []] = planOccurrences(ledger, pool, [
      { spec: spec({ date: '2026-07-10' }), existing: [] },
    ]);

    expect(ids(picks)).toEqual(['a']);
  });

  it('spreads a day across rooms even when their history differs', () => {
    const rooms = Array.from({ length: 9 }, (_, index) => `r${index}`);
    const occupants = (roomId: string) =>
      [1, 2, 3].map((n) => `${roomId}-${n}`);
    const pool = rooms.flatMap((roomId) =>
      occupants(roomId).map((id) => participant(id, { roomId })),
    );
    // The first four rooms carried more on earlier days.
    const ledger = buildLedger(
      ['r0', 'r1', 'r2', 'r3'].map((roomId) =>
        duty(occupants(roomId), { effort: 'HEAVY', choreId: 'past' }),
      ),
    );
    const occurrence = (choreId: string, effort: 'LIGHT' | 'NORMAL') => ({
      spec: spec({ choreId, effort, unit: 'ROOM', headcount: 3 }),
      existing: [],
    });
    const normal = (i: number) => occurrence(`n${i}`, 'NORMAL');
    const light = (i: number) => occurrence(`l${i}`, 'LIGHT');

    planOccurrences(ledger, pool, [
      ...[0, 1, 2, 3].map(normal),
      ...[0, 1, 2, 3, 4].map(light),
      ...[4, 5, 6, 7, 8].map(normal),
    ]);

    const dayLoads = pool.map(
      (person) => ledger.get(person.id)?.days.get('2026-07-10')?.load,
    );
    expect(new Set(dayLoads)).toEqual(new Set([2, 3]));
  });
});

describe('balance', () => {
  it('bands the load against the group average', () => {
    expect(balanceOf(0, 4).balance).toBe('BELOW');
    expect(balanceOf(4, 4).balance).toBe('AVERAGE');
    expect(balanceOf(10, 4).balance).toBe('ABOVE');
  });

  it('compares against the mean, so one person carrying everything shows', () => {
    // A median of 0 would call the two without duties "about average".
    const pool = ['a', 'b', 'c'].map((id) => participant(id));
    const ledger = buildLedger([
      duty(['a'], { effort: 'HEAVY' }),
      duty(['a'], { effort: 'HEAVY', choreId: 'dishes' }),
    ]);

    const byId = new Map(
      fairnessOverview(ledger, pool).map((e) => [e.registrationId, e]),
    );
    expect(byId.get('a')?.balance).toBe('ABOVE');
    expect(byId.get('b')?.balance).toBe('BELOW');
  });

  it('splits off what is done: marked done, or dated before today', () => {
    const ledger = buildLedger(
      [
        duty(['a'], { date: '2026-06-30' }),
        duty(['a'], { date: '2026-07-01', status: 'DONE' }),
        duty(['a'], { date: '2026-07-01', effort: 'HEAVY' }),
        duty(['a'], { date: '2026-07-02' }),
      ],
      '2026-07-01',
    );

    const [entry] = fairnessOverview(ledger, [participant('a')]);
    expect(entry).toMatchObject({
      dutyCount: 4,
      doneDutyCount: 2,
      load: 9,
      doneLoad: 4,
    });
  });

  it('compares staff and participants only among themselves', () => {
    const ledger = buildLedger([
      duty(['s1'], { effort: 'HEAVY' }),
      duty(['s2'], { effort: 'HEAVY' }),
      duty(['p1'], { effort: 'LIGHT' }),
      duty(['p2'], { effort: 'LIGHT' }),
    ]);
    const pool = [
      staff('s1'),
      staff('s2'),
      participant('p1'),
      participant('p2'),
    ];

    for (const entry of fairnessOverview(ledger, pool)) {
      expect(entry.balance).toBe('AVERAGE');
    }
  });
});

describe('planRebalance', () => {
  const movable = (
    id: string,
    members: string[],
    date: string,
    extra: Partial<MovableDuty> = {},
  ): MovableDuty => ({
    ...duty(members, { date }),
    id,
    eligibility: 'PARTICIPANTS',
    unit: 'PERSON',
    headcount: members.length,
    ...extra,
  });

  // The duties' people once the changes are applied.
  const apply = (duties: MovableDuty[], changes: ChoreRebalanceChange[]) =>
    duties.map((duty) => {
      const mine = changes.filter((c) => c.assignmentId === duty.id);
      const leaving = mine.flatMap((c) => c.fromRegistrationIds);
      return {
        ...duty,
        members: [
          ...duty.members.filter((m) => !leaving.includes(m.registrationId)),
          ...mine.flatMap((c) =>
            c.toRegistrationIds.map((registrationId) => ({
              registrationId,
              role: c.role,
              missed: false,
            })),
          ),
        ],
      };
    });

  it('hands upcoming duties over until the load is even', () => {
    const changes = planRebalance(
      [
        duty(['a'], { date: '2026-07-01' }),
        duty(['a'], { date: '2026-07-02' }),
      ],
      [movable('d1', ['a'], '2026-07-10'), movable('d2', ['a'], '2026-07-11')],
      [participant('a'), participant('b')],
    );

    expect(changes).toHaveLength(2);
    for (const change of changes) {
      expect(change).toMatchObject({
        fromRegistrationIds: ['a'],
        toRegistrationIds: ['b'],
        role: 'MEMBER',
      });
    }
  });

  it('never hands a duty to someone busy that day or not eligible', () => {
    const changes = planRebalance(
      [
        duty(['a'], { date: '2026-07-01' }),
        duty(['a'], { date: '2026-07-02' }),
        duty(['a'], { date: '2026-07-03' }),
        duty(['b'], { date: '2026-07-10', choreId: 'dishes' }),
      ],
      [movable('d1', ['a'], '2026-07-10')],
      [participant('a'), participant('b'), staff('s')],
    );

    expect(changes).toEqual([]);
  });

  it('swaps duties when handing one over would double up a day', () => {
    const changes = planRebalance(
      [],
      [
        movable('n1', ['a'], '2026-07-10', { choreId: 'n1' }),
        movable('n2', ['a'], '2026-07-10', { choreId: 'n2' }),
        movable('l1', ['b'], '2026-07-10', { choreId: 'l1', effort: 'LIGHT' }),
      ],
      [participant('a'), participant('b')],
    );

    expect(changes).toHaveLength(2);
    expect(changes).toContainEqual(
      expect.objectContaining({
        assignmentId: 'l1',
        toRegistrationIds: ['a'],
      }),
    );
    expect(changes).toContainEqual(
      expect.objectContaining({
        fromRegistrationIds: ['a'],
        toRegistrationIds: ['b'],
      }),
    );
  });

  it('moves room duties by whole rooms', () => {
    // Four rooms on two normal chores, four on one light chore.
    const rooms = Array.from({ length: 9 }, (_, index) => `r${index}`);
    const pool = rooms.flatMap((roomId) =>
      [1, 2, 3].map((n) => participant(`${roomId}-${n}`, { roomId })),
    );
    const occupants = (roomId: string) =>
      [1, 2, 3].map((n) => `${roomId}-${n}`);
    const room = (id: string, roomId: string, effort: 'LIGHT' | 'NORMAL') =>
      movable(id, occupants(roomId), '2026-07-10', {
        choreId: id,
        effort,
        unit: 'ROOM',
      });
    const duties = [
      ...['r0', 'r1', 'r2', 'r3'].flatMap((roomId) => [
        room(`${roomId}-a`, roomId, 'NORMAL'),
        room(`${roomId}-b`, roomId, 'NORMAL'),
      ]),
      room('r4-a', 'r4', 'NORMAL'),
      room('r4-b', 'r4', 'LIGHT'),
      ...['r5', 'r6', 'r7', 'r8'].map((roomId) =>
        room(`${roomId}-a`, roomId, 'LIGHT'),
      ),
    ];

    const changes = planRebalance([], duties, pool);

    const after = apply(duties, changes);
    for (const duty of after) {
      const roomsOnDuty = new Set(
        duty.members.map((m) => m.registrationId.split('-')[0]),
      );
      expect(roomsOnDuty.size).toBe(1);
    }
    const ledger = buildLedger(after);
    const loads = pool.map((person) => ledger.get(person.id)?.load ?? 0);
    expect(new Set(loads)).toEqual(new Set([2, 3]));
  });

  it('lets rooms of different sizes swap, keeping the duty staffed', () => {
    // A room of three carries two duties, a room of four none; each needs 3.
    const pool = [
      ...['a1', 'a2', 'a3'].map((id) => participant(id, { roomId: 'a' })),
      ...['b1', 'b2', 'b3', 'b4'].map((id) => participant(id, { roomId: 'b' })),
    ];
    const room = (id: string, date: string) =>
      movable(id, ['a1', 'a2', 'a3'], date, {
        choreId: id,
        unit: 'ROOM',
        headcount: 3,
      });
    const duties = [room('d1', '2026-07-10'), room('d2', '2026-07-11')];

    const changes = planRebalance([], duties, pool);

    expect(changes).toEqual([
      expect.objectContaining({
        fromRegistrationIds: ['a1', 'a2', 'a3'],
        toRegistrationIds: ['b1', 'b2', 'b3', 'b4'],
      }),
    ]);
    for (const duty of apply(duties, changes)) {
      expect(duty.members.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('never lets a smaller room take a duty below its headcount', () => {
    const pool = [
      ...['a1', 'a2', 'a3'].map((id) => participant(id, { roomId: 'a' })),
      ...['b1', 'b2'].map((id) => participant(id, { roomId: 'b' })),
    ];
    const duties = ['d1', 'd2'].map((id, index) =>
      movable(id, ['a1', 'a2', 'a3'], `2026-07-1${index}`, {
        choreId: id,
        unit: 'ROOM',
        headcount: 3,
      }),
    );

    expect(planRebalance([], duties, pool)).toEqual([]);
  });

  it('leaves a balanced plan alone', () => {
    const changes = planRebalance(
      [],
      [movable('d1', ['a'], '2026-07-10'), movable('d2', ['b'], '2026-07-11')],
      [participant('a'), participant('b')],
    );

    expect(changes).toEqual([]);
  });
});
