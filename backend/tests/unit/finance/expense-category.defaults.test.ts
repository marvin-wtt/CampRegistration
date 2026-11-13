import { describe, expect, it } from 'vitest';
import { defaultExpenseCategoriesForCountries } from '#app/expenseCategory/expense-category.defaults';

describe('defaultExpenseCategoriesForCountries', () => {
  it('stores a single language as a plain string', () => {
    const categories = defaultExpenseCategoriesForCountries(['de']);

    expect(categories[0]).toEqual({ name: 'Fahrtkosten', position: 0 });
  });

  it('carries exactly the event languages', () => {
    const [travel] = defaultExpenseCategoriesForCountries(['cz', 'de']);

    expect(travel?.name).toEqual({ de: 'Fahrtkosten', cs: 'Doprava' });
  });

  it('keeps the list order as positions', () => {
    const positions = defaultExpenseCategoriesForCountries(['gb']).map(
      (c) => c.position,
    );

    expect(positions).toEqual([0, 1, 2, 3, 4, 5]);
  });
});
