import { describe, it, vi, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TimeAgoTableCell from '@/components/event/table/tableCells/TimeAgoTableCell.vue';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';

installQuasarPlugin();

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    d: (val: string) => `${val}`,
    locale: { value: 'en' },
  }),
}));

const createCellProps = (
  overrides: Partial<TableCellProps['props']> = {},
): TableCellProps['props'] => ({
  key: 'startAt',
  color: 'primary',
  value: '2023-01-01T00:00:00Z',
  sort: () => {},
  row: {
    id: '',
    locale: '',
    data: {},
    computedData: {} as Registration['computedData'],
    customData: {},
    status: 'ACCEPTED',
    createdAt: '2023-01-01T00:00:00Z',
  },
  rowIndex: 0,
  pageIndex: 0,
  col: {
    field: 'startAt',
    name: 'startAt',
    label: 'Start At',
  },
  cols: [],
  colsMap: {},
  dense: false,
  expand: false,
  selected: false,
  ...overrides,
});

const createEvent = (
  overrides: Partial<TableCellProps['event']> = {},
): TableCellProps['event'] => ({
  id: crypto.randomUUID(),
  organizationId: crypto.randomUUID(),
  organizationName: 'Test Organization',
  organizationVerificationStatus: 'VERIFIED',
  name: 'Test Event',
  confirmationMode: 'AUTOMATIC' as const,
  listed: true,
  registrationOpensAt: null,
  registrationClosesAt: null,
  countries: [],
  locales: [],
  organizer: 'Organizer Name',
  contactEmail: '',
  maxParticipants: 100,
  startAt: '2023-01-01T00:00:00Z',
  endAt: '2023-01-10T00:00:00Z',
  timezone: 'UTC',
  minAge: 18,
  maxAge: 30,
  price: 50,
  location: 'Test Location',
  freePlaces: 10,
  freePlacesTotal: 10,
  registrationStatus: 'closed' as const,
  logo: null,
  banner: null,
  form: {} as EventDetails['form'],
  themes: {},
  ...overrides,
});

const tooltipStub = {
  template: `<span class="tooltip"><slot /></span>`,
};

describe('TimeAgoTableCell', () => {
  it('should mount', () => {
    mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps(),
      },
    });
  });

  it('correctly shows less than a minute ago', () => {
    // 3 seconds ago
    const threeSecAgo = new Date(new Date().getTime() - 3000).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: threeSecAgo }),
      },
    });

    expect(wrapper.text()).toContain('lessThanMinute');
  });

  it('correctly shows minutes ago', () => {
    // 5 minutes ago
    const fiveMinAgo = new Date(
      new Date().getTime() - 5 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: fiveMinAgo }),
      },
    });
    expect(wrapper.text()).toBe('5 minutes ago');
  });

  it('correctly shows weeks ago', () => {
    // 2 weeks ago
    const twoWeeksAgo = new Date(
      new Date().getTime() - 2 * 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: twoWeeksAgo }),
      },
    });

    expect(wrapper.text()).toBe('2 weeks ago');
  });

  it('correctly shows months ago', () => {
    const fourMonthAgo = new Date(
      new Date().getTime() - 4 * 31 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: fourMonthAgo }),
      },
    });

    expect(wrapper.text()).toBe('4 months ago');
  });

  it('correctly shows years ago', () => {
    const eightYearsAgo = new Date(
      new Date().getTime() - 8 * 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: eightYearsAgo }),
      },
    });

    expect(wrapper.text()).toBe('8 years ago');
  });

  it('correctly shows less than a minute for near-future dates', () => {
    // 3 seconds in the future
    const threeSecFromNow = new Date(new Date().getTime() + 3000).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: threeSecFromNow }),
      },
    });

    expect(wrapper.text()).toContain('inLessThanMinute');
  });

  it('correctly shows minutes for near-future dates instead of "less than a minute"', () => {
    // 5 minutes in the future
    const fiveMinFromNow = new Date(
      new Date().getTime() + 5 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: fiveMinFromNow }),
      },
    });

    expect(wrapper.text()).toBe('in 5 minutes');
  });

  it('correctly shows years for far-future dates instead of "less than a minute"', () => {
    // 8 years in the future
    const eightYearsFromNow = new Date(
      new Date().getTime() + 8 * 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: eightYearsFromNow }),
      },
    });

    expect(wrapper.text()).toBe('in 8 years');
  });

  it('renders plain date in tooltip', () => {
    const now = new Date('2023-01-01T00:00:05Z');
    vi.setSystemTime(now);

    const oneYearAgo = new Date(
      now.getTime() - 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: oneYearAgo }),
      },
      global: {
        stubs: { 'q-tooltip': tooltipStub },
      },
    });

    expect(wrapper.find('.tooltip').text()).toBe('2022-01-01T00:00:05.000Z');
  });

  it('renders "?" and raw non-string value', () => {
    const rawValue = 12345;

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: rawValue }),
      },
      global: {
        stubs: { 'q-tooltip': tooltipStub },
      },
    });

    expect(wrapper.text().startsWith('?')).toBe(true);

    expect(wrapper.find('.tooltip').text()).toBe(String(rawValue));
  });

  it('renders "X" for invalid date string', () => {
    const invalid = 'not-a-date';

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        event: createEvent(),
        printing: false,
        props: createCellProps({ value: invalid }),
      },
      global: {
        stubs: { 'q-tooltip': tooltipStub },
      },
    });

    expect(wrapper.find('.tooltip').text()).toBe(String(invalid));
  });
});
