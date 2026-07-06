import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import { QSelect } from 'quasar';
import ContactSelect from '@/components/campManagement/contact/ContactSelect.vue';
import type { Registration } from '@camp-registration/common/entities';
import type { Contact } from '@/components/campManagement/contact/Contact';

installQuasarPlugin();

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

  it('excludes PENDING registrations from options', () => {
    const pending = createRegistration({ status: 'PENDING' });
    const accepted = createRegistration({ status: 'ACCEPTED' });

    const options = getOptions(mountContactSelect([pending, accepted]));
    const allIds = options.flatMap((o) =>
      o.type === 'group'
        ? o.registrations.map((r) => r.id)
        : [o.registration.id],
    );

    expect(allIds).not.toContain(pending.id);
    expect(allIds).toContain(accepted.id);
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

  it('creates separate groups for registrations with different countries', () => {
    const r1 = createRegistration({
      computedData: {
        ...baseComputedData(),
        address: { street: null, city: null, zipCode: null, country: 'DE' },
      },
    });
    const r2 = createRegistration({
      computedData: {
        ...baseComputedData(),
        address: { street: null, city: null, zipCode: null, country: 'FR' },
      },
    });

    const options = getOptions(mountContactSelect([r1, r2]));
    expect(options.filter((o) => o.type === 'group')).toHaveLength(2);
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
