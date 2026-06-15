import { describe, expect, it } from 'vitest';
import '@camp-registration/common/form';
import { extractFormFields, getSelectOptions } from './surveyJS';

describe('extractFormFields', () => {
  it('extracts field labels and values while applying prefixes and wildcards', () => {
    const form = {
      pages: [
        {
          name: 'profile',
          title: '[Profile](https://example.com/profile)',
          elements: [
            {
              type: 'text',
              name: 'participant_name',
              valueName: 'name',
              title: '[Participant name](https://example.com/name)',
            },
            {
              type: 'checkbox',
              name: 'activities',
              title: 'Activities',
              choices: ['Swimming', 'Hiking'],
            },
            {
              type: 'expression',
              name: 'computed_age',
              title: 'Computed age',
              expression: '18',
            },
            {
              type: 'html',
              name: 'introduction',
              html: '<p>Introduction</p>',
            },
          ],
        },
      ],
    };

    expect(extractFormFields(form, 'registration')).toEqual([
      {
        label: 'Profile > Participant name',
        value: 'registration.name',
      },
      {
        label: 'Profile > Activities > *',
        value: 'registration.activities.*',
      },
    ]);
  });

  it('extracts dynamic panel fields once regardless of the initial panel count', () => {
    const form = {
      pages: [
        {
          name: 'household',
          title: 'Household',
          elements: [
            {
              type: 'paneldynamic',
              name: 'attendees',
              title: 'Attendees',
              panelCount: 2,
              templateElements: [
                {
                  type: 'dropdown',
                  name: 'role',
                  title: 'Role',
                  choices: ['Leader', 'Member'],
                },
                {
                  type: 'checkbox',
                  name: 'interests',
                  title: 'Interests',
                  choices: ['Sports', 'Music'],
                },
              ],
            },
          ],
        },
      ],
    };

    expect(extractFormFields(form)).toEqual([
      {
        label: 'Household > Attendees > *',
        value: 'attendees.*',
      },
      {
        label: 'Household > Attendees > * > Role',
        value: 'attendees.*.role',
      },
      {
        label: 'Household > Attendees > * > Interests > *',
        value: 'attendees.*.interests.*',
      },
    ]);
  });
});

describe('getSelectOptions', () => {
  it.each(['dropdown', 'checkbox', 'radiogroup', 'imagepicker', 'ranking'])(
    'extracts choices from %s questions',
    (type) => {
      const form = {
        elements: [
          {
            type,
            name: 'selection',
            choices: [{ value: 'first', text: 'First option' }],
          },
        ],
      };

      expect(getSelectOptions(form, 'selection')).toEqual({
        first: 'First option',
      });
    },
  );

  it('preserves localized labels and falls back to raw choice values', () => {
    const form = {
      elements: [
        {
          type: 'dropdown',
          name: 'status',
          choices: [
            'pending',
            {
              value: 'confirmed',
              text: {
                default: 'Confirmed',
                de: 'Bestaetigt',
              },
            },
          ],
        },
      ],
    };

    expect(getSelectOptions(form, 'status')).toEqual({
      pending: 'pending',
      confirmed: {
        default: 'Confirmed',
        de: 'Bestaetigt',
      },
    });
  });

  it('resolves select questions nested in dynamic panels', () => {
    const form = {
      elements: [
        {
          type: 'paneldynamic',
          name: 'attendees',
          templateElements: [
            {
              type: 'dropdown',
              name: 'role',
              choices: [
                { value: 'leader', text: 'Leader' },
                { value: 'member', text: 'Member' },
              ],
            },
          ],
        },
      ],
    };

    expect(getSelectOptions(form, 'attendees.*.role')).toEqual({
      leader: 'Leader',
      member: 'Member',
    });
  });

  it('unwraps custom select questions', () => {
    const form = {
      elements: [
        {
          type: 'country',
          name: 'country',
        },
      ],
    };

    expect(getSelectOptions(form, 'country')).toMatchObject({
      de: {
        de: 'Deutschland',
        en: 'Germany',
      },
    });
  });

  it('returns undefined for missing, non-select, and empty select fields', () => {
    const form = {
      elements: [
        {
          type: 'text',
          name: 'notes',
        },
        {
          type: 'dropdown',
          name: 'empty',
          choices: [],
        },
      ],
    };

    expect(getSelectOptions(form, 'missing')).toBeUndefined();
    expect(getSelectOptions(form, 'notes')).toBeUndefined();
    expect(getSelectOptions(form, 'empty')).toBeUndefined();
  });
});
