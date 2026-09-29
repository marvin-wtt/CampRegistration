import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineAsyncComponent, defineComponent, h } from 'vue';
import { installQuasarPlugin } from '@/../test/vitest/utils/quasar';
import type * as PrintMarginBoxes from '@/utils/printMarginBoxes';
import PrintTablesPage from '@/pages/print/PrintTablesPage.vue';
import TableComponentRegistry from '@/components/event/table/ComponentRegistry';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import type { PrintTablesPayload } from '@/components/event/table/PrintTablesPayload';
import type {
  EventDetails,
  Registration,
} from '@camp-registration/common/entities';

installQuasarPlugin();

// Only used inside filters of the hidden local templates, which are not
// printed here; avoids pulling in the stores (and with them router and API).
vi.mock('@/composables/registrationHelper', () => ({
  useRegistrationHelper: () => ({}),
}));

// The shared mock's d() echoes its Date argument; margin boxes need a string.
vi.mock('vue-i18n', async () => {
  const { ref } = await import('vue');
  return {
    useI18n: () => ({
      t: (key: string) => key,
      d: (value: Date) => value.toISOString(),
      locale: ref('en'),
    }),
  };
});

const marginBoxSupport = vi.hoisted(() => ({ value: true }));
vi.mock('@/utils/printMarginBoxes', async (importOriginal) => ({
  ...(await importOriginal<typeof PrintMarginBoxes>()),
  supportsMarginBoxes: () => marginBoxSupport.value,
}));

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

    // Standalone window in happy-dom: the opener answers the payload request.
    const opener = {
      postMessage: (msg: { type: string }) => {
        if (msg.type !== 'PRINT_TABLES:REQUEST') {
          return;
        }
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: 'PRINT_TABLES:PAYLOAD',
              payload: JSON.stringify(payload()),
            },
            origin: window.location.origin,
            source: opener as unknown as Window,
          }),
        );
      },
    };
    vi.stubGlobal('opener', opener);

    marginBoxSupport.value = true;
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
    expect(wrapper.find('.print-table-end').exists()).toBe(true);
  });

  it('moves event, template title and page numbers into margin boxes', async () => {
    releaseCellChunk();

    const wrapper = mount(PrintTablesPage, { attachTo: document.body });

    await vi.waitFor(() => expect(print).toHaveBeenCalledOnce());
    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');

    expect(wrapper.find('.print-sheet').attributes('style')).toContain(
      'page: table-0',
    );
    expect(css).toContain('@top-left { content: "Summer Event"; }');
    expect(css).toMatch(
      /@page table-0 \{ size: A4 (portrait|landscape); .*@bottom-left \{ content: "Participants"; \}/,
    );
    expect(wrapper.find('.print-header__meta').exists()).toBe(false);
    expect(wrapper.find('.print-footer').exists()).toBe(false);
    wrapper.unmount();
  });

  it('keeps the in-flow header meta and footer without margin box support', async () => {
    marginBoxSupport.value = false;
    releaseCellChunk();

    const wrapper = mount(PrintTablesPage, { attachTo: document.body });

    await vi.waitFor(() => expect(print).toHaveBeenCalledOnce());
    expect(wrapper.find('.print-header__meta').text()).toBe('Summer Event');
    expect(wrapper.find('.print-footer__left').text()).toBe('Participants');
  });
});
