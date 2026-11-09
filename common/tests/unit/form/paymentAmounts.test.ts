import { describe, expect, it } from 'vitest';
import { SurveyModel } from 'survey-core';
import { extractPaymentAmounts } from '../../../src/form/index.js';

const fee = (name: string, extra: Record<string, unknown> = {}) => ({
  type: 'expression',
  name,
  expression: '10',
  eventDataType: 'payment_amount',
  ...extra,
});

const role = { type: 'text', name: 'role' };

function amounts(json: object, data: Record<string, unknown> = {}) {
  const survey = new SurveyModel(json);
  survey.setData(data);

  return extractPaymentAmounts(survey);
}

describe('extractPaymentAmounts', () => {
  describe('tagged questions', () => {
    it('collects their answers', () => {
      expect(amounts({ elements: [fee('a'), fee('b')] })).toEqual([10, 10]);
    });

    it('leaves out one hidden by its condition', () => {
      const json = {
        elements: [role, fee('discount', { visibleIf: "{role} = 'team'" })],
      };

      expect(amounts(json, { role: 'participant' })).toEqual([]);
      expect(amounts(json, { role: 'team' })).toEqual([10]);
    });

    it('reads numeric strings and counts anything else as zero', () => {
      const json = (expression: string) => ({
        elements: [fee('a', { expression })],
      });

      expect(amounts(json("'12.5'"))).toEqual([12.5]);
      expect(amounts(json("'abc'"))).toEqual([0]);
      expect(amounts(json('{missing}'))).toEqual([0]);
    });

    it('never counts a typed answer, so nobody sets their own price', () => {
      const json = {
        elements: [
          {
            type: 'text',
            name: 'a',
            inputType: 'number',
            eventDataType: 'payment_amount',
          },
        ],
      };

      expect(amounts(json, { a: -500 })).toEqual([]);
    });

    it('leaves out one that is always hidden', () => {
      expect(amounts({ elements: [fee('a', { visible: false })] })).toEqual([]);
    });

    it('leaves out those of a hidden panel or page', () => {
      const json = {
        pages: [
          {
            name: 'p1',
            elements: [
              role,
              {
                type: 'panel',
                name: 'panel',
                visibleIf: "{role} = 'team'",
                elements: [fee('in_panel')],
              },
            ],
          },
          {
            name: 'p2',
            visibleIf: "{role} = 'team'",
            elements: [fee('on_page')],
          },
        ],
      };

      expect(amounts(json, { role: 'participant' })).toEqual([]);
    });

    it('decides per dynamic panel entry', () => {
      const json = {
        elements: [
          {
            type: 'paneldynamic',
            name: 'children',
            templateElements: [
              { type: 'text', name: 'age', inputType: 'number' },
              fee('child_fee', { visibleIf: '{panel.age} > 3' }),
            ],
          },
        ],
      };

      expect(amounts(json, { children: [{ age: 2 }, { age: 5 }] })).toEqual([
        10,
      ]);
    });
  });

  describe('untagged questions', () => {
    it('add nothing, whatever their price', () => {
      const json = {
        elements: [
          { type: 'boolean', name: 'bus', price: 30 },
          {
            type: 'radiogroup',
            name: 'room',
            choices: [{ value: 'single', price: 25 }],
          },
          { type: 'text', name: 'amount', inputType: 'number' },
        ],
      };

      expect(amounts(json, { bus: true, room: 'single', amount: 10 })).toEqual(
        [],
      );
    });
  });

  describe('tagged calculated values', () => {
    const json = (extra: Record<string, unknown> = {}) => ({
      elements: [role],
      calculatedValues: [
        {
          name: 'team_discount',
          expression: "iif({role} = 'team', -10, 0)",
          eventDataType: 'payment_amount',
          ...extra,
        },
      ],
    });

    it('count without being shown', () => {
      expect(amounts(json(), { role: 'team' })).toEqual([-10]);
      expect(amounts(json(), { role: 'participant' })).toEqual([0]);
    });

    it('follow later answers', () => {
      const survey = new SurveyModel(json());
      survey.setValue('role', 'participant');
      survey.setValue('role', 'team');

      expect(extractPaymentAmounts(survey)).toEqual([-10]);
    });

    it('read survey variables', () => {
      const survey = new SurveyModel(json({ expression: '0 - {event.price}' }));
      survey.setVariable('event.price', 150);

      expect(extractPaymentAmounts(survey)).toEqual([-150]);
    });

    it('leaves out untagged ones', () => {
      expect(
        amounts(json({ eventDataType: undefined }), { role: 'team' }),
      ).toEqual([]);
    });
  });

  describe('priced booleans', () => {
    const json = {
      elements: [
        {
          type: 'boolean',
          name: 'bus',
          price: 30,
          eventDataType: 'payment_amount',
        },
      ],
    };

    it('adds the price when answered yes', () => {
      expect(amounts(json, { bus: true })).toEqual([30]);
    });

    it('adds nothing when answered no or not at all', () => {
      expect(amounts(json, { bus: false })).toEqual([]);
      expect(amounts(json)).toEqual([]);
    });

    it('reads custom true values', () => {
      const custom = {
        elements: [
          {
            type: 'boolean',
            name: 'bus',
            price: -15,
            eventDataType: 'payment_amount',
            valueTrue: 'yes',
            valueFalse: 'no',
          },
        ],
      };

      expect(amounts(custom, { bus: 'yes' })).toEqual([-15]);
    });
  });

  describe('priced choices', () => {
    const choices = [
      { value: 'single', price: 25 },
      { value: 'shared' },
      { value: 'sibling', price: -20 },
    ];

    it.each(['radiogroup', 'dropdown'])(
      'adds the price of the selected choice (%s)',
      (type) => {
        const json = {
          elements: [
            { type, name: 'room', choices, eventDataType: 'payment_amount' },
          ],
        };

        expect(amounts(json, { room: 'single' })).toEqual([25]);
        expect(amounts(json, { room: 'sibling' })).toEqual([-20]);
      },
    );

    it.each(['checkbox', 'tagbox'])(
      'adds the price of every selected choice (%s)',
      (type) => {
        const json = {
          elements: [
            { type, name: 'extras', choices, eventDataType: 'payment_amount' },
          ],
        };

        expect(amounts(json, { extras: ['single', 'sibling'] })).toEqual([
          25, -20,
        ]);
      },
    );

    it('gives a choice without a price nothing to add', () => {
      const json = {
        elements: [
          {
            type: 'radiogroup',
            name: 'r',
            choices,
            eventDataType: 'payment_amount',
          },
        ],
      };

      expect(amounts(json, { r: 'shared' })).toEqual([0]);
    });

    it('leaves out a choice hidden by its condition', () => {
      const json = {
        elements: [
          role,
          {
            type: 'checkbox',
            name: 'extras',
            eventDataType: 'payment_amount',
            choices: [
              { value: 'bus', price: 30 },
              { value: 'team_shirt', price: 10, visibleIf: "{role} = 'team'" },
            ],
          },
        ],
      };

      expect(
        amounts(json, { role: 'participant', extras: ['bus', 'team_shirt'] }),
      ).toEqual([30]);
    });

    it('leaves out a hidden question', () => {
      const json = {
        elements: [
          role,
          {
            type: 'radiogroup',
            name: 'room',
            eventDataType: 'payment_amount',
            visibleIf: "{role} = 'team'",
            choices,
          },
        ],
      };

      expect(amounts(json, { role: 'participant', room: 'single' })).toEqual(
        [],
      );
    });
  });
});
