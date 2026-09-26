import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineAsyncComponent, defineComponent, h } from 'vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import PrintTablesPage from '@/pages/print/PrintTablesPage.vue';
import TableComponentRegistry from '@/components/event/table/ComponentRegistry';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import type { PrintTablesPayload } from '@/components/event/table/PrintTablesPayload';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';

installQuasarPlugin();

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { key: STORAGE_KEY } }),
}));

// Only used inside filters of the hidden local templates, which are not
// printed here; avoids pulling in the stores (and with them router and API).
vi.mock('@/composables/registrationHelper', () => ({
  useRegistrationHelper: () => ({}),
}));

const STORAGE_KEY = 'print:tables:test';
const CELL_TYPE = 'print_test_async';

// A cell renderer whose chunk only "arrives" once the test releases it, like
// a lazily loaded cell type on a cold cache.
let releaseCellChunk: () => void;

function registerAsyncCell(): void {
  const chunk = new Promise<void>((resolve) => (releaseCellChunk = resolve));

  TableComponentRegistry.register(
    CELL_TYPE,
    defineAsyncComponent(async () => {
      await chunk;
      return defineComponent<TableCellProps>(
        (p) => () => h('span', { class: 'async-cell' }, String(p.props.value)),
        { props: ['props', 'event', 'options', 'printing', 'gridMode'] },
      );
    }),
  );
}

function registration(firstName: string): Registration {
  return {
    id: firstName,
    locale: 'en',
    data: {},
    computedData: { firstName } as Registration['computedData'],
    customData: {},
    status: 'ACCEPTED',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

function payload(): PrintTablesPayload {
  return {
    locale: 'en',
    timestamp: '2026-01-01T00:00:00Z',
    questions: [],
    registrations: [registration('Alice'), registration('Bob')],
    event: {
      id: 'event',
      name: 'Summer Event',
      countries: [],
      form: {},
    } as unknown as EventDetails,
    templates: [
      {
        id: 'template',
        title: 'Participants',
        order: 0,
        actions: false,
        columns: [
          {
            name: 'first_name',
            field: 'computedData.firstName',
            label: 'First name',
            renderAs: CELL_TYPE,
          },
        ],
      },
    ],
  };
}

describe('PrintTablesPage', () => {
  let renderedCellsAtPrint: string[] | undefined;
  let print: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registerAsyncCell();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload()));

    renderedCellsAtPrint = undefined;
    // happy-dom does not implement print(); record what would be printed.
    print = vi.fn(() => {
      renderedCellsAtPrint = Array.from(
        document.querySelectorAll('.async-cell'),
      ).map((cell) => cell.textContent ?? '');
    });
    vi.stubGlobal('print', print);
  });

  afterEach(() => {
    TableComponentRegistry.remove(CELL_TYPE);
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('does not print before async cell renderers have loaded', async () => {
    mount(PrintTablesPage, { attachTo: document.body });
    await flushPromises();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(print).not.toHaveBeenCalled();

    releaseCellChunk();

    await vi.waitFor(() => expect(print).toHaveBeenCalledOnce());
    expect(renderedCellsAtPrint).toEqual(['Alice', 'Bob']);
  });

  it('prints every selected template with its header', async () => {
    releaseCellChunk();

    const wrapper = mount(PrintTablesPage, { attachTo: document.body });

    await vi.waitFor(() => expect(print).toHaveBeenCalledOnce());
    expect(wrapper.findAll('.print-sheet')).toHaveLength(1);
    expect(wrapper.find('.print-header__title').text()).toBe('Participants');
    expect(wrapper.find('.print-header__meta').text()).toBe('Summer Event');
  });
});
