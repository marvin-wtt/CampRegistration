import { describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { TableCellRenderer } from '@/components/event/table/TableCellRenderer';
import type { ComponentRegistryEntry } from '@/components/event/table/ComponentRegistry';
import type { CTableColumnTemplate } from '@/types/CTableTemplate';
import type { TableCellProps } from '@/components/event/table/tableCells/TableCellProps';
import type { CsvFormatContext } from '@/utils/csvValueFormatter';

const dummyComponent = {} as Component<TableCellProps>;

function makeColumn(
  overrides: Partial<CTableColumnTemplate> = {},
): CTableColumnTemplate {
  return {
    name: 'field',
    label: 'Field',
    field: 'field',
    fieldName: 'field',
    ...overrides,
  };
}

function makeCtx(overrides: Partial<CsvFormatContext> = {}): CsvFormatContext {
  return {
    translate: (value) => (typeof value === 'string' ? value : ''),
    translateCountry: (country) => country,
    getFormSelectOptions: () => undefined,
    ...overrides,
  };
}

describe('TableCellRenderer.toCsv', () => {
  it('delegates to the registered toCsv hook with the column attached', () => {
    const toCsv = vi.fn().mockReturnValue('formatted');
    const entry: ComponentRegistryEntry = {
      component: dummyComponent,
      options: { toCsv },
    };
    const column = makeColumn({ fieldName: 'computedData.emails' });
    const renderer = new TableCellRenderer(entry, column);
    const ctx = makeCtx();

    expect(renderer.toCsv('raw', ctx)).toBe('formatted');
    expect(toCsv).toHaveBeenCalledWith('raw', ctx, column);
  });

  it('returns undefined when the renderer has no CSV hook', () => {
    const entry: ComponentRegistryEntry = {
      component: dummyComponent,
      options: {},
    };
    const renderer = new TableCellRenderer(entry, makeColumn());

    expect(renderer.toCsv('raw', makeCtx())).toBeUndefined();
  });
});

describe('TableCellRenderer.isArray', () => {
  it('reflects the column isArray flag', () => {
    const entry: ComponentRegistryEntry = {
      component: dummyComponent,
      options: {},
    };

    expect(
      new TableCellRenderer(entry, makeColumn({ isArray: true })).isArray(),
    ).toBe(true);
    expect(
      new TableCellRenderer(entry, makeColumn({ isArray: false })).isArray(),
    ).toBe(false);
    expect(new TableCellRenderer(entry, makeColumn()).isArray()).toBe(false);
  });
});

describe('TableCellRenderer.isVisible', () => {
  const entry: ComponentRegistryEntry = {
    component: dummyComponent,
    options: {},
  };

  it('is visible with no showIf/hideIf configured', () => {
    const renderer = new TableCellRenderer(entry, makeColumn());
    expect(renderer.isVisible({ status: 'PENDING' })).toBe(true);
  });

  it('respects showIf', () => {
    const renderer = new TableCellRenderer(
      entry,
      makeColumn({ showIf: "{status} = 'ACCEPTED'" }),
    );

    expect(renderer.isVisible({ status: 'ACCEPTED' })).toBe(true);
    expect(renderer.isVisible({ status: 'PENDING' })).toBe(false);
  });

  it('respects hideIf', () => {
    const renderer = new TableCellRenderer(
      entry,
      makeColumn({ hideIf: "{status} = 'WAITLISTED'" }),
    );

    expect(renderer.isVisible({ status: 'WAITLISTED' })).toBe(false);
    expect(renderer.isVisible({ status: 'ACCEPTED' })).toBe(true);
  });

  it('combines showIf and hideIf when both are configured', () => {
    const renderer = new TableCellRenderer(
      entry,
      makeColumn({
        showIf: "{status} = 'ACCEPTED'",
        hideIf: '{archived} = true',
      }),
    );

    expect(renderer.isVisible({ status: 'ACCEPTED', archived: false })).toBe(
      true,
    );
    expect(renderer.isVisible({ status: 'PENDING', archived: false })).toBe(
      false,
    );
    expect(renderer.isVisible({ status: 'ACCEPTED', archived: true })).toBe(
      false,
    );
  });
});
