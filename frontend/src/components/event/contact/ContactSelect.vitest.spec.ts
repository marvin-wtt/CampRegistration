import { beforeEach, describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { QSelect } from 'quasar';
import ContactSelect from '@/components/event/contact/ContactSelect.vue';
import type { Registration } from '@camp-registration/common/entities';
import type { Contact } from '@/components/event/contact/Contact';

installQuasarPlugin();

// Whether the event is held across several countries.
const multiCountryEvent = ref(false);

vi.mock('@/composables/eventStatistics', () => ({
  useEventStatistics: () => ({ multiCountryEvent }),
}));

beforeEach(() => {
  multiCountryEvent.value = false;
});

vi.mock('@/composables/registrationHelper', () => ({
  useRegistrationHelper: () => ({
    fullName: (r: Registration): string | undefined => {
      const parts = [r.computedData.firstName, r.computedData.lastName].filter(
        Boolean,
      );
      return parts.length > 0 ? parts.join(' ') : undefined;
    },
    role: (r: Registration): string | undefined =>
      r.computedData.role ?? undefined,
    country: (r: Registration): string | undefined =>
      r.computedData.address?.country ?? undefined,
  }),
}));

function baseComputedData(): Registration['computedData'] {
  return {
    firstName: 'John',
    lastName: 'Doe',
    role: null,
    dateOfBirth: null,
    gender: null,
    address: { street: null, city: null, zipCode: null, country: null },
    emails: [],
  };
}

function createRegistration(
  overrides: Partial<Registration> = {},
): Registration {
  return {
    id: crypto.randomUUID(),
    locale: 'en',
    data: {},
    computedData: baseComputedData(),
    customData: {},
    status: 'ACCEPTED',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function mountContactSelect(
  registrations: Registration[],
  modelValue: Contact[] = [],
) {
  return mount(ContactSelect, {
    props: { registrations, modelValue },
  });
}

function getOptions(wrapper: ReturnType<typeof mountContactSelect>): Contact[] {
  return wrapper.findComponent(QSelect).props('options') as Contact[];
}

describe('ContactSelect', () => {
  it('mounts without errors', () => {
    expect(mountContactSelect([]).exists()).toBe(true);
  });

  it('never offers PENDING registrations, alone or in a group', () => {
    const pending = createRegistration({ status: 'PENDING' });
    const accepted = createRegistration({ status: 'ACCEPTED' });

    const options = getOptions(mountContactSelect([pending, accepted]));
    const offeredIds = options.flatMap((o) =>
      o.type === 'group'
        ? o.registrations.map((r) => r.id)
        : [o.registration.id],
    );

    expect(offeredIds).not.toContain(pending.id);
    expect(offeredIds).toContain(accepted.id);
  });

  it('creates an individual contact for each non-PENDING registration', () => {
    const r1 = createRegistration({ status: 'ACCEPTED' });
    const r2 = createRegistration({ status: 'WAITLISTED' });

    const options = getOptions(mountContactSelect([r1, r2]));
    expect(options.filter((o) => o.type !== 'group')).toHaveLength(2);
  });

  it('assigns participant type when ACCEPTED registration has no role', () => {
    const r = createRegistration({ status: 'ACCEPTED' });
    const options = getOptions(mountContactSelect([r]));

    const individual = options.find((o) => o.type !== 'group');
    expect(individual?.type).toBe('participant');
  });

  it('assigns participant type when ACCEPTED registration has participant role', () => {
    const r = createRegistration({
      status: 'ACCEPTED',
      computedData: { ...baseComputedData(), role: 'participant' },
    });
    const options = getOptions(mountContactSelect([r]));

    const individual = options.find((o) => o.type !== 'group');
    expect(individual?.type).toBe('participant');
  });

  it('assigns counselor type when ACCEPTED registration has counselor role', () => {
    const r = createRegistration({
      status: 'ACCEPTED',
      computedData: { ...baseComputedData(), role: 'counselor' },
    });
    const options = getOptions(mountContactSelect([r]));

    const individual = options.find((o) => o.type !== 'group');
    expect(individual?.type).toBe('counselor');
  });

  it('assigns waitingList type for WAITLISTED registrations', () => {
    const r = createRegistration({ status: 'WAITLISTED' });
    const options = getOptions(mountContactSelect([r]));

    const individual = options.find((o) => o.type !== 'group');
    expect(individual?.type).toBe('waitingList');
  });

  it('creates a group for registrations sharing the same role, country, and waitlist status', () => {
    const r1 = createRegistration({ status: 'ACCEPTED' });
    const r2 = createRegistration({ status: 'ACCEPTED' });

    const options = getOptions(mountContactSelect([r1, r2]));
    const groups = options.filter((o) => o.type === 'group');

    expect(groups).toHaveLength(1);
    const group = groups[0] as Extract<Contact, { type: 'group' }>;
    expect(group.registrations).toHaveLength(2);
  });

  function inCountry(
    code: string | null,
    overrides: Partial<Registration> = {},
  ): Registration {
    return createRegistration({
      ...overrides,
      computedData: {
        ...baseComputedData(),
        ...overrides.computedData,
        address: { street: null, city: null, zipCode: null, country: code },
      },
    });
  }

  function groups(options: Contact[]) {
    return options.filter(
      (o): o is Extract<Contact, { type: 'group' }> => o.type === 'group',
    );
  }

  it('offers a group across countries and one per country', () => {
    multiCountryEvent.value = true;
    const de1 = inCountry('DE');
    const de2 = inCountry('DE');
    const fr = inCountry('FR');

    const result = groups(getOptions(mountContactSelect([de1, de2, fr])));

    // Countries follow their translated names: France before Germany.
    expect(result.map((g) => [g.country, g.registrations.length])).toEqual([
      [undefined, 3],
      ['FR', 1],
      ['DE', 2],
    ]);
  });

  it('gives registrations without a country a group of their own, listed last', () => {
    multiCountryEvent.value = true;
    const result = groups(
      getOptions(mountContactSelect([inCountry(null), inCountry('DE')])),
    );

    expect(result.map((g) => g.country)).toEqual([undefined, 'DE', null]);
  });

  it('offers only the country group for a role within a single country', () => {
    multiCountryEvent.value = true;
    const participantDe = inCountry('DE');
    const participantFr = inCountry('FR');
    const counselorDe = inCountry('DE', {
      computedData: { ...baseComputedData(), role: 'counselor' },
    });

    const result = groups(
      getOptions(
        mountContactSelect([participantDe, participantFr, counselorDe]),
      ),
    );
    const counselorGroups = result.filter((g) =>
      g.registrations.some((r) => r.id === counselorDe.id),
    );

    expect(counselorGroups).toHaveLength(1);
    expect(counselorGroups[0]?.country).toBe('DE');
  });

  it('ignores address countries in an event held in one country', () => {
    const result = groups(
      getOptions(
        mountContactSelect([inCountry('DE'), inCountry('AT'), inCountry(null)]),
      ),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.country).toBeUndefined();
  });

  it('labels the group with its country while an international event has registrations from one', () => {
    multiCountryEvent.value = true;
    const result = groups(
      getOptions(mountContactSelect([inCountry('DE'), inCountry('DE')])),
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.country).toBe('DE');
  });

  it('drops a country group once the group across countries is selected', async () => {
    const de = inCountry('DE');
    const fr = inCountry('FR');
    const countryGroup: Contact = {
      type: 'group',
      name: 'Participant',
      country: 'DE',
      registrations: [de],
    };
    const wholeGroup: Contact = {
      type: 'group',
      name: 'Participant',
      registrations: [de, fr],
    };

    const wrapper = mountContactSelect([de, fr], [countryGroup]);
    await wrapper.setProps({ modelValue: [countryGroup, wholeGroup] });
    await nextTick();

    const emitted = wrapper.emitted('update:modelValue') as [Contact[]][];
    expect(emitted.at(-1)![0]).toEqual([wholeGroup]);
  });

  it('names the waitlist group by its status, adding the role only when several roles wait', () => {
    const waitingParticipant = createRegistration({ status: 'WAITLISTED' });
    const waitingCounselor = createRegistration({
      status: 'WAITLISTED',
      computedData: { ...baseComputedData(), role: 'counselor' },
    });

    // Tests run without the component's translations, so `t` returns keys.
    const single = groups(getOptions(mountContactSelect([waitingParticipant])));
    expect(single.map((g) => g.name)).toEqual(['type.waitingList']);

    const both = groups(
      getOptions(mountContactSelect([waitingParticipant, waitingCounselor])),
    );
    expect(both.map((g) => g.name)).toEqual([
      'type.waitingList (type.participant)',
      'type.waitingList (counselor)',
    ]);
  });

  it('lists waitlist groups after every other group', () => {
    const waiting = createRegistration({ status: 'WAITLISTED' });
    const counselor = createRegistration({
      computedData: { ...baseComputedData(), role: 'counselor' },
    });

    const result = groups(getOptions(mountContactSelect([waiting, counselor])));
    expect(result.at(-1)?.registrations[0]?.id).toBe(waiting.id);
  });

  it('finds groups by country name', async () => {
    multiCountryEvent.value = true;
    const wrapper = mountContactSelect([inCountry('DE'), inCountry('FR')]);
    const filterFn = wrapper.findComponent(QSelect).props('onFilter') as (
      val: string,
      done: (fn: () => void) => void,
    ) => void;

    filterFn('france', (fn) => fn());
    await nextTick();

    const result = groups(getOptions(wrapper));
    expect(result.map((g) => g.country)).toEqual(['FR']);
  });

  it('creates separate groups for registrations with different roles', () => {
    const participant = createRegistration({ status: 'ACCEPTED' });
    const counselor = createRegistration({
      status: 'ACCEPTED',
      computedData: { ...baseComputedData(), role: 'counselor' },
    });

    const options = getOptions(mountContactSelect([participant, counselor]));
    expect(options.filter((o) => o.type === 'group')).toHaveLength(2);
  });

  it('orders options: groups before individuals, then by type (participant, counselor, waitingList)', () => {
    const participant = createRegistration({ status: 'ACCEPTED' });
    const counselor = createRegistration({
      status: 'ACCEPTED',
      computedData: { ...baseComputedData(), role: 'counselor' },
    });
    const waitlisted = createRegistration({ status: 'WAITLISTED' });

    const options = getOptions(
      mountContactSelect([waitlisted, counselor, participant]),
    );
    const types = options.map((o) => o.type);

    const lastGroupIdx = types.lastIndexOf('group');
    const firstParticipantIdx = types.indexOf('participant');
    const firstCounselorIdx = types.indexOf('counselor');
    const firstWaitingListIdx = types.indexOf('waitingList');

    expect(lastGroupIdx).toBeLessThan(firstParticipantIdx);
    expect(firstParticipantIdx).toBeLessThan(firstCounselorIdx);
    expect(firstCounselorIdx).toBeLessThan(firstWaitingListIdx);
  });

  it('sorts individual contacts of the same type alphabetically by name', () => {
    const zelda = createRegistration({
      computedData: {
        ...baseComputedData(),
        firstName: 'Zelda',
        lastName: null,
      },
    });
    const alice = createRegistration({
      computedData: {
        ...baseComputedData(),
        firstName: 'Alice',
        lastName: null,
      },
    });

    const options = getOptions(mountContactSelect([zelda, alice]));
    const individuals = options.filter((o) => o.type === 'participant');

    expect(individuals[0]?.name).toBe('Alice');
    expect(individuals[1]?.name).toBe('Zelda');
  });

  it('formats contact name using formatPersonName (capitalises first letters)', () => {
    const r = createRegistration({
      computedData: {
        ...baseComputedData(),
        firstName: 'john',
        lastName: 'doe',
      },
    });

    const options = getOptions(mountContactSelect([r]));
    const individual = options.find((o) => o.type !== 'group');

    expect(individual?.name).toBe('John Doe');
  });

  it('filters options by name query', async () => {
    const alice = createRegistration({
      computedData: {
        ...baseComputedData(),
        firstName: 'Alice',
        lastName: 'Smith',
      },
    });
    const bob = createRegistration({
      computedData: {
        ...baseComputedData(),
        firstName: 'Bob',
        lastName: 'Jones',
      },
    });

    const wrapper = mountContactSelect([alice, bob]);
    const qSelect = wrapper.findComponent(QSelect);
    const filterFn = qSelect.props('onFilter') as (
      val: string,
      done: (fn: () => void) => void,
    ) => void;

    filterFn('alice', (fn) => fn());
    await nextTick();

    const options = getOptions(wrapper);
    const individuals = options.filter((o) => o.type !== 'group');
    expect(individuals).toHaveLength(1);
    expect(individuals[0]?.name).toContain('Alice');
  });

  it('clears filter when empty string is passed', async () => {
    const alice = createRegistration({
      computedData: {
        ...baseComputedData(),
        firstName: 'Alice',
        lastName: null,
      },
    });
    const bob = createRegistration({
      computedData: { ...baseComputedData(), firstName: 'Bob', lastName: null },
    });

    const wrapper = mountContactSelect([alice, bob]);
    const qSelect = wrapper.findComponent(QSelect);
    const filterFn = qSelect.props('onFilter') as (
      val: string,
      done: (fn: () => void) => void,
    ) => void;

    filterFn('alice', (fn) => fn());
    await nextTick();
    filterFn('', (fn) => fn());
    await nextTick();

    const options = getOptions(wrapper);
    const individuals = options.filter((o) => o.type !== 'group');
    expect(individuals).toHaveLength(2);
  });

  it('excludes already-selected individual from options', () => {
    const r = createRegistration();
    const selected: Contact = {
      type: 'participant',
      name: 'John Doe',
      registration: r,
    };

    const options = getOptions(mountContactSelect([r], [selected]));
    const found = options
      .filter((o) => o.type !== 'group')
      .find((o) => o.registration.id === r.id);

    expect(found).toBeUndefined();
  });

  it('excludes already-selected group from options', () => {
    const r1 = createRegistration({ status: 'ACCEPTED' });
    const r2 = createRegistration({ status: 'ACCEPTED' });
    const selectedGroup: Contact = {
      type: 'group',
      name: 'All',
      registrations: [r1, r2],
    };

    const options = getOptions(mountContactSelect([r1, r2], [selectedGroup]));
    expect(options.filter((o) => o.type === 'group')).toHaveLength(0);
  });

  it('excludes individuals whose registration is already covered by a selected group', () => {
    const r1 = createRegistration();
    const r2 = createRegistration();
    // Group covers r1 only — r2 remains uncovered
    const selectedGroup: Contact = {
      type: 'group',
      name: 'Group',
      registrations: [r1],
    };

    const options = getOptions(mountContactSelect([r1, r2], [selectedGroup]));
    const individuals = options.filter((o) => o.type !== 'group');

    expect(
      individuals.find((o) => o.registration.id === r1.id),
    ).toBeUndefined();
    expect(individuals.find((o) => o.registration.id === r2.id)).toBeDefined();
  });

  it('removes individual from model when a group containing it is added', async () => {
    const r = createRegistration();
    const individual: Contact = {
      type: 'participant',
      name: 'John Doe',
      registration: r,
    };
    const group: Contact = { type: 'group', name: 'All', registrations: [r] };

    const wrapper = mountContactSelect([r], [individual]);
    await wrapper.setProps({ modelValue: [individual, group] });
    await nextTick();

    const emitted = wrapper.emitted('update:modelValue') as [Contact[]][];

    expect(emitted).toBeDefined();
    const lastEmit = emitted[emitted.length - 1]![0];
    expect(lastEmit).toHaveLength(1);
    expect(lastEmit[0]?.type).toBe('group');
  });

  it('does not modify model when no individual overlaps with selected groups', async () => {
    const r1 = createRegistration();
    const r2 = createRegistration();
    const c1: Contact = {
      type: 'participant',
      name: 'Alice',
      registration: r1,
    };
    const c2: Contact = { type: 'participant', name: 'Bob', registration: r2 };

    const wrapper = mountContactSelect([r1, r2]);
    await wrapper.setProps({ modelValue: [c1, c2] });
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
