import { describe, expect, it } from 'vitest';
import { formSelectLabels } from '@/utils/formatters/formSelectLabels';

const options = {
  vegetarian: { en: 'Vegetarian' },
  vegan: { en: 'Vegan' },
  no_pork: 'No pork',
};

describe('formSelectLabels', () => {
  it('resolves a single value', () => {
    expect(formSelectLabels('vegan', options)).toEqual([{ en: 'Vegan' }]);
  });

  it('resolves several selections in the form choice order', () => {
    expect(formSelectLabels(['no_pork', 'vegetarian'], options)).toEqual([
      { en: 'Vegetarian' },
      'No pork',
    ]);
  });

  it('keeps values without a choice after the labels', () => {
    expect(formSelectLabels(['halal', 'vegan'], options)).toEqual([
      { en: 'Vegan' },
      'halal',
    ]);
  });

  it('returns undefined when no value matches a choice', () => {
    expect(formSelectLabels('halal', options)).toBeUndefined();
    expect(formSelectLabels(['halal'], options)).toBeUndefined();
  });

  it('returns undefined without options or a value', () => {
    expect(formSelectLabels('vegan', undefined)).toBeUndefined();
    expect(formSelectLabels(null, options)).toBeUndefined();
    expect(formSelectLabels(undefined, options)).toBeUndefined();
  });
});
