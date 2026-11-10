import { describe, expect, it } from 'vitest';
import { TableTemplateReferenceChecker } from '../../../src/form/index.js';
import type { TableColumnTemplate } from '../../../src/entities/index.js';

const form = {
  elements: [
    { type: 'text', name: 'first_name' },
    { type: 'text', name: 'birthday', valueName: 'date_of_birth' },
    {
      type: 'radiogroup',
      name: 'leave',
      choices: ['alone', 'group', { value: 'none', text: 'None' }],
    },
    { type: 'radiogroup', name: 'open', choices: ['a'], showOtherItem: true },
    {
      type: 'radiogroup',
      name: 'other_as_value',
      choices: ['a'],
      showOtherItem: true,
      storeOthersAsComment: false,
    },
    {
      type: 'radiogroup',
      name: 'special',
      choices: ['a'],
      showNoneItem: true,
      showRefuseItem: true,
      showDontKnowItem: true,
    },
    {
      type: 'tagbox',
      name: 'custom',
      choices: ['a'],
      allowCustomChoices: true,
    },
    {
      type: 'checkbox',
      name: 'objects',
      choices: ['a'],
      valuePropertyName: 'fruit',
    },
    { type: 'matrix', name: 'numbered', rows: [1, 2], columns: ['a'] },
    {
      type: 'matrixdynamic',
      name: 'empty',
      rowCount: 0,
      columns: [{ name: 'phone', cellType: 'text' }],
    },
    { type: 'boolean', name: 'swim' },
    {
      type: 'paneldynamic',
      name: 'guardian',
      templateElements: [
        { type: 'text', name: 'guardian_name', valueName: 'name' },
        { type: 'dropdown', name: 'kind', choices: ['mother', 'father'] },
      ],
    },
    {
      type: 'matrixdropdown',
      name: 'md',
      rows: ['r1'],
      columns: [{ name: 'c1', cellType: 'dropdown', choices: ['x'] }],
    },
    { type: 'matrix', name: 'm', rows: ['r1'], columns: ['a'] },
    { type: 'matrixdynamic', name: 'mdyn', columns: [{ name: 'c1' }] },
    { type: 'multipletext', name: 'mt', items: [{ name: 'i1' }] },
    { type: 'expression', name: 'fee', expression: '10' },
    { type: 'dropdown', name: 'diet', choices: ['a'], showCommentArea: true },
    { type: 'html', name: 'info', html: 'Hi' },
  ],
  calculatedValues: [
    { name: 'total', expression: '1', includeIntoResult: true },
    { name: 'internal', expression: '1' },
  ],
};

const checker = new TableTemplateReferenceChecker(form);

function column(
  field: string,
  extra: Partial<TableColumnTemplate> = {},
): TableColumnTemplate {
  return { name: 'col', label: 'Col', field, ...extra };
}

function iconMapping(field: string, values: (string | number)[]) {
  return column(field, {
    renderAs: 'icon_mapping',
    renderOptions: {
      mappings: values.map((value) => ({ value, icon: 'x', color: 'y' })),
    },
  });
}

describe('TableTemplateReferenceChecker', () => {
  describe('fields', () => {
    it.each([
      'data.first_name',
      'data.date_of_birth',
      'data.guardian',
      'data.guardian.*',
      'data.guardian.*.name',
      'data.guardian.0.name',
      'computedData.firstName',
      'computedData.address',
      'computedData.address.city',
      'computedData.emails.*',
      'computedData.emails',
      'computedData.phoneNumbers.*',
      'status',
      'createdAt',
      'locale',
      'updatedAt',
      'data.md.r1',
      'data.md.r1.c1',
      'data.m.r1',
      'data.mdyn.*.c1',
      'data.mt.i1',
      'data.fee',
      'data.diet-Comment',
      'data.open-Comment',
      'data.total',
      'data.numbered.1',
      'data.empty.*.phone',
      'data.empty.0.phone',
      'customData.anything',
      'customFiles.passport',
      '',
    ])('accepts %s', (field) => {
      expect(checker.checkColumn(column(field))).toEqual([]);
    });

    it.each([
      'data.last_name',
      // The question name, not its valueName, is not stored.
      'data.birthday',
      'data.guardian..name',
      'data.guardian.*.guardian_name',
      'computedData.nickname',
      'first_name',
      'data.md.c1',
      'data.md.r2.c1',
      'data.first_name-Comment',
      'data.info',
      'data.internal',
      'data.numbered.3',
    ])('reports %s', (field) => {
      expect(checker.checkColumn(column(field))).toEqual([
        { code: 'field/unknown', column: 'col', field },
      ]);
    });
  });

  describe('icon mapped values', () => {
    it('accepts choice values', () => {
      expect(
        checker.checkColumn(iconMapping('data.leave', ['alone', 'none'])),
      ).toEqual([]);
    });

    it('reports values no choice stores', () => {
      expect(
        checker.checkColumn(iconMapping('data.leave', ['alone', 'maybe'])),
      ).toEqual([
        {
          code: 'value/unknown',
          column: 'col',
          field: 'data.leave',
          value: 'maybe',
        },
      ]);
    });

    it('checks boolean values', () => {
      expect(
        checker
          .checkColumn(iconMapping('data.swim', ['true', 'yes']))
          .map((issue) => issue.code === 'value/unknown' && issue.value),
      ).toEqual(['yes']);
    });

    it('checks choices inside dynamic panels', () => {
      expect(
        checker.checkColumn(iconMapping('data.guardian.*.kind', ['aunt'])),
      ).toHaveLength(1);
    });

    it('checks choices of fixed-row matrix cells', () => {
      expect(
        checker.checkColumn(iconMapping('data.md.r1.c1', ['x', 'y'])),
      ).toHaveLength(1);
    });

    it('knows the value an other item stores', () => {
      expect(
        checker
          .checkColumn(iconMapping('data.open', ['a', 'other', 'b']))
          .map((issue) => issue.code === 'value/unknown' && issue.value),
      ).toEqual(['b']);
    });

    it('knows the values of none, refuse and dont-know items', () => {
      expect(
        checker.checkColumn(
          iconMapping('data.special', ['a', 'none', 'refused', 'dontknow']),
        ),
      ).toEqual([]);
    });

    it.each(['other_as_value', 'custom', 'objects'])(
      'accepts any value for %s, which stores values its items lack',
      (name) => {
        expect(
          checker.checkColumn(iconMapping(`data.${name}`, ['typed'])),
        ).toEqual([]);
      },
    );

    it('ignores mappings of other renderers', () => {
      const col = column('data.leave', {
        renderAs: 'default',
        renderOptions: { mappings: [{ value: 'maybe' }] },
      });

      expect(checker.checkColumn(col)).toEqual([]);
    });
  });

  describe('registrations still holding a reference', () => {
    const registrations = [
      { data: { last_name: 'Doe', leave: 'maybe' } },
      { data: { last_name: '', leave: 'alone' } },
      { data: { guardian: [{ old: 'x' }, { old: 'y' }] } },
    ];
    const withData = new TableTemplateReferenceChecker(form, registrations);

    it('counts registrations with a value for an unknown field', () => {
      expect(withData.checkColumn(column('data.last_name'))).toEqual([
        {
          code: 'field/unknown',
          column: 'col',
          field: 'data.last_name',
          registrations: 1,
        },
      ]);
    });

    it('counts each registration once across array entries', () => {
      expect(
        withData.checkColumn(column('data.guardian.*.old'))[0],
      ).toMatchObject({ registrations: 1 });
    });

    it('counts registrations holding an unknown value', () => {
      expect(
        withData.checkColumn(iconMapping('data.leave', ['maybe', 'never'])),
      ).toEqual([
        {
          code: 'value/unknown',
          column: 'col',
          field: 'data.leave',
          value: 'maybe',
          registrations: 1,
        },
        {
          code: 'value/unknown',
          column: 'col',
          field: 'data.leave',
          value: 'never',
        },
      ]);
    });
  });

  describe('sortBy', () => {
    it('reports a column name the template does not have', () => {
      const columns = [column('data.first_name', { name: 'first_name' })];

      expect(checker.check({ columns, sortBy: 'first_name' })).toEqual([]);
      expect(checker.check({ columns, sortBy: 'last_name' })).toEqual([
        { code: 'sort/unknown', column: 'last_name' },
      ]);
    });
  });
});
