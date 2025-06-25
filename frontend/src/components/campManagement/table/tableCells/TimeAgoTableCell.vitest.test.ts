import { describe, it, vi, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TimeAgoTableCell from 'components/campManagement/table/tableCells/TimeAgoTableCell.vue';
import type { TableCellProps } from 'components/campManagement/table/tableCells/TableCellProps';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';

installQuasarPlugin();

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, n: number) => `${n} ${key}`,
    d: (val: string) => `${val}`,
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
    startAt: '2023-01-01T00:00:00Z',
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

const createCamp = (
  overrides: Partial<TableCellProps['camp']> = {},
): TableCellProps['camp'] => ({
  id: crypto.randomUUID(),
  name: 'Test Camp',
  active: true,
  public: true,
  countries: [],
  organizer: 'Organizer Name',
  contactEmail: '',
  maxParticipants: 100,
  startAt: '2023-01-01T00:00:00Z',
  endAt: '2023-01-10T00:00:00Z',
  minAge: 18,
  maxAge: 30,
  price: 50,
  location: 'Test Location',
  freePlaces: 10,
  ...overrides,
});

const tooltipStub = {
  template: `<span class="tooltip"><slot /></span>`,
};

describe('TimeAgoTableCell', () => {
  it('should mount', () => {
    mount(TimeAgoTableCell, {
      props: {
        camp: createCamp(),
        printing: false,
        props: createCellProps(),
      },
    });
  });

  it('correctly shows seconds ago', () => {
    // 3 seconds ago
    const threeSecAgo = new Date(new Date().getTime() - 3000).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        camp: createCamp(),
        printing: false,
        props: createCellProps({ value: threeSecAgo }),
      },
    });

    expect(wrapper.text().startsWith('3 second')).toBe(true);
  });

  it('correctly shows minutes ago', () => {
    // 5 minutes ago
    const fiveMinAgo = new Date(
      new Date().getTime() - 5 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        camp: createCamp(),
        printing: false,
        props: createCellProps({ value: fiveMinAgo }),
      },
    });
    expect(wrapper.text().startsWith('5 minute')).toBe(true);
  });

  it('correctly shows weeks ago', () => {
    // 2 weeks ago
    const twoWeeksAgo = new Date(
      new Date().getTime() - 2 * 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        camp: createCamp(),
        printing: false,
        props: createCellProps({ value: twoWeeksAgo }),
      },
    });

    expect(wrapper.text().startsWith('2 week')).toBe(true);
  });

  it('correctly shows months ago', () => {
    const fourMonthAgo = new Date(
      new Date().getTime() - 4 * 31 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        camp: createCamp(),
        printing: false,
        props: createCellProps({ value: fourMonthAgo }),
      },
    });

    console.log(wrapper.text());

    expect(wrapper.text()).toBe('4 month');
  });

  it('correctly shows years ago', () => {
    const eightYearsAgo = new Date(
      new Date().getTime() - 8 * 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        camp: createCamp(),
        printing: false,
        props: createCellProps({ value: eightYearsAgo }),
      },
    });

    expect(wrapper.text()).toBe('8 year');
  });

  it('renders plain date in tooltip', () => {
    const now = new Date('2023-01-01T00:00:05Z');
    vi.setSystemTime(now);

    const oneYearAgo = new Date(
      now.getTime() - 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const wrapper = mount(TimeAgoTableCell, {
      props: {
        camp: createCamp(),
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
        camp: createCamp(),
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
        camp: createCamp(),
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
