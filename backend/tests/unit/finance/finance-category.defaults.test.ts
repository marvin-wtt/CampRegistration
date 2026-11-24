import { describe, expect, it } from 'vitest';
import { defaultFinanceCategoriesForCountries } from '#app/financeCategory/finance-category.defaults';

describe('defaultFinanceCategoriesForCountries', () => {
  it('stores a single language as a plain string', () => {
    const categories = defaultFinanceCategoriesForCountries(['de']);

    expect(categories[0]).toEqual({ name: 'Fahrtkosten', position: 0 });
  });

  it('carries exactly the event languages', () => {
    const [travel] = defaultFinanceCategoriesForCountries(['cz', 'de']);

    expect(travel?.name).toEqual({ de: 'Fahrtkosten', cs: 'Doprava' });
  });

  it('keeps the list order as positions', () => {
    const positions = defaultFinanceCategoriesForCountries(['gb']).map(
      (c) => c.position,
    );

    expect(positions).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('has a list of its own for income', () => {
    const names = defaultFinanceCategoriesForCountries(['de'], 'INCOME').map(
      (c) => c.name,
    );

    expect(names).toEqual(['Zuschüsse', 'Spenden', 'Eigenmittel', 'Sonstiges']);
  });
});
