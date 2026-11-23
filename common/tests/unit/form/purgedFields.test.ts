import { describe, expect, it } from 'vitest';
import { specialCategoryFieldTest } from '../../../src/form/index.js';

const form = {
  elements: [
    { type: 'text', name: 'name' },
    { type: 'text', name: 'meds' },
    {
      type: 'checkbox',
      name: 'allergies',
      privacyCategory: 'allergies',
      choices: ['nuts'],
      showOtherItem: true,
    },
    {
      type: 'paneldynamic',
      name: 'kids',
      templateElements: [
        { type: 'text', name: 'name' },
        { type: 'text', name: 'meds', privacyCategory: 'medication' },
      ],
    },
    {
      type: 'paneldynamic',
      name: 'parents',
      templateElements: [{ type: 'text', name: 'meds' }],
    },
    {
      type: 'paneldynamic',
      name: 'health',
      privacyCategory: 'health',
      templateElements: [{ type: 'text', name: 'note' }],
    },
    {
      type: 'matrixdropdown',
      name: 'rows',
      rows: ['anna', '1'],
      columns: [
        { name: 'diet', cellType: 'text' },
        { name: 'meds', cellType: 'text', privacyCategory: 'medication' },
      ],
    },
    {
      type: 'matrixdynamic',
      name: 'list',
      columns: [
        { name: 'meds', cellType: 'text', privacyCategory: 'medication' },
      ],
    },
  ],
};

describe('specialCategoryFieldTest', () => {
  const isSensitive = specialCategoryFieldTest(form);

  it('reaches a tagged question and what it stores beneath', () => {
    expect(isSensitive('allergies')).toBe(true);
    expect(isSensitive('allergies.*')).toBe(true);
    expect(isSensitive('allergies.0')).toBe(true);
  });

  it('reaches a tagged question in every dynamic panel entry', () => {
    expect(isSensitive('kids.*.meds')).toBe(true);
    expect(isSensitive('kids.0.meds')).toBe(true);
    expect(isSensitive('kids.12.meds')).toBe(true);
  });

  it('reaches everything inside a tagged container', () => {
    expect(isSensitive('health')).toBe(true);
    expect(isSensitive('health.0.note')).toBe(true);
  });

  it('reaches the comment of a tagged question', () => {
    expect(isSensitive('allergies-Comment')).toBe(true);
    expect(isSensitive('name-Comment')).toBe(false);
  });

  it('reaches tagged matrix columns, by row name or entry', () => {
    expect(isSensitive('rows.anna.meds')).toBe(true);
    // A row named like an index.
    expect(isSensitive('rows.1.meds')).toBe(true);
    expect(isSensitive('rows.anna.diet')).toBe(false);
    expect(isSensitive('list.0.meds')).toBe(true);
    expect(isSensitive('list.*.meds')).toBe(true);
  });

  it('matches whole paths, not a name that recurs elsewhere', () => {
    expect(isSensitive('meds')).toBe(false);
    expect(isSensitive('parents.0.meds')).toBe(false);
    expect(isSensitive('kids.0.name')).toBe(false);
    expect(isSensitive('kids')).toBe(false);
  });

  it('knows nothing of fields the form does not store', () => {
    expect(isSensitive('unknown')).toBe(false);
    expect(isSensitive('unknown.meds')).toBe(false);
  });
});
