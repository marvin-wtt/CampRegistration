import { describe, expect, it } from 'vitest';
import TableComponentRegistry from '@/components/event/table/ComponentRegistry';
import registerTableCells from '@/components/event/table/tableCells';
import type { CsvFormatContext } from '@/utils/csvValueFormatter';

// ComponentRegistry.ts calls this itself on import, but call it again here to
// make the test independent of module import order/caching.
registerTableCells();

function makeContext(
  overrides: Partial<CsvFormatContext> = {},
): CsvFormatContext {
  return {
    translate: (value) =>
      typeof value === 'string' ? value : (value?.en ?? ''),
    translateCountry: (country) => country.toUpperCase(),
    getFormSelectOptions: () => undefined,
    ...overrides,
  };
}

describe('tableCells CSV export wiring', () => {
  it.each([
    ['date', '2010-05-01T00:00:00.000Z', '2010-05-01'],
    ['age', '2010-05-01T00:00:00.000Z', '2010-05-01'],
    ['time_ago', '2010-05-01T00:00:00.000Z', '2010-05-01'],
  ])('%s formats its value as a plain ISO date', (name, value, expected) => {
    const toCsv = TableComponentRegistry.get(name)?.options.toCsv;
    expect(toCsv).toBeDefined();
    expect(toCsv?.(value, makeContext(), { fieldName: 'x' })).toBe(expected);
  });

  it('address joins the parts via formatAddress', () => {
    const toCsv = TableComponentRegistry.get('address')?.options.toCsv;
    expect(
      toCsv?.({ city: 'Springfield', country: 'us' }, makeContext(), {
        fieldName: 'computedData.address',
      }),
    ).toBe('Springfield, US');
  });

  it('translated_value translates a translation record', () => {
    const toCsv = TableComponentRegistry.get('translated_value')?.options.toCsv;
    expect(
      toCsv?.({ en: 'Room A', de: 'Raum A' }, makeContext(), {
        fieldName: 'room',
      }),
    ).toBe('Room A');
  });

  it('form_select resolves the option label for data.* fields', () => {
    const toCsv = TableComponentRegistry.get('form_select')?.options.toCsv;
    const ctx = makeContext({
      getFormSelectOptions: () => ({ opt1: { en: 'Option 1' } }),
    });

    expect(toCsv?.('opt1', ctx, { fieldName: 'data.favoriteColor' })).toBe(
      'Option 1',
    );
  });

  it.each(['status', 'gender', 'name', 'phone_number', 'email'])(
    '%s has no special CSV behaviour (exporter falls back to the raw value)',
    (name) => {
      expect(TableComponentRegistry.get(name)?.options.toCsv).toBeUndefined();
    },
  );
});
