import { describe, expect, it } from 'vitest';
import {
  balanceOf,
  buildLedger,
  fairnessOverview,
  type LedgerDuty,
  type OccurrenceSpec,
  pickForOccurrence,
  planOccurrences,
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
