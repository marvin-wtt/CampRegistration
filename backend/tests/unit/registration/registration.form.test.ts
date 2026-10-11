import { describe, expect, it, vi } from 'vitest';
import { FunctionFactory, SurveyModel } from 'survey-core';
import type { EventWithFreePlaces } from '#app/event/event.types';
import { RegistrationForm } from '#app/registration/registration.form';

// `setVariables` reads these off the event to expose them as survey variables.
function eventWith(elements: object[], freePlaces = 10): EventWithFreePlaces {
  return {
    id: 'event-1',
    form: { pages: [{ name: 'page1', elements }] },
    countries: ['de', 'fr'],
    name: 'Event',
    organizer: 'Organizer',
    contactEmail: 'event@example.com',
    maxParticipants: 10,
    startAt: new Date('2026-07-01T00:00:00.000Z'),
    endAt: new Date('2026-07-14T00:00:00.000Z'),
    minAge: 10,
    maxAge: 18,
    location: null,
    price: 100,
    freePlaces,
  } as unknown as EventWithFreePlaces;
}

const errorsFor = (
  event: EventWithFreePlaces,
  data: unknown,
  locale?: string,
) => new RegistrationForm(event, { locale }).load(data).dataErrors();

describe('RegistrationForm.dataErrors', async () => {
  it('accepts data that fits the form', async () => {
    const event = eventWith([
      { type: 'text', name: 'first_name', isRequired: true },
      { type: 'text', name: 'age', inputType: 'number' },
      { type: 'dropdown', name: 'diet', choices: ['vegan', 'vegetarian'] },
    ]);

    await expect(
      errorsFor(event, { first_name: 'Jhon', age: 12, diet: 'vegan' }),
    ).resolves.toEqual([]);
  });

  it('reports a field the form does not have', async () => {
    const event = eventWith([{ type: 'text', name: 'first_name' }]);

    await expect(
      errorsFor(event, { first_name: 'Jhon', extra: 'x' }),
    ).resolves.toEqual([{ path: 'extra', message: 'Unknown field' }]);
  });

  it('accepts the comment of an "other" choice', async () => {
    const event = eventWith([
      {
        type: 'dropdown',
        name: 'diet',
        choices: ['vegan'],
        showOtherItem: true,
      },
    ]);

    await expect(
      errorsFor(event, { diet: 'other', 'diet-Comment': 'Pescetarian' }),
    ).resolves.toEqual([]);
  });

  it('reports a choice the form does not offer', async () => {
    const event = eventWith([
      { type: 'dropdown', name: 'diet', choices: ['vegan', 'vegetarian'] },
    ]);

    await expect(errorsFor(event, { diet: 'carnivore' })).resolves.toEqual([
      { path: 'diet', message: 'Unknown choice' },
    ]);
  });

  it('reports a country the event is not open to', async () => {
    const event = eventWith([{ type: 'country', name: 'country' }]);

    await expect(errorsFor(event, { country: 'fr' })).resolves.toEqual([]);
    await expect(errorsFor(event, { country: 'pl' })).resolves.toEqual([
      { path: 'country', message: 'Unknown choice' },
    ]);
  });

  it('reports a value of the wrong type', async () => {
    const event = eventWith([
      { type: 'text', name: 'age', inputType: 'number' },
      { type: 'boolean', name: 'consent' },
    ]);

    await expect(
      errorsFor(event, { age: 'twelve', consent: 'maybe' }),
    ).resolves.toEqual([
      { path: 'age', message: 'Invalid value type' },
      { path: 'consent', message: 'Invalid value type' },
    ]);
  });

  it('reports failed validation rules with their messages', async () => {
    const event = eventWith([
      { type: 'text', name: 'first_name', isRequired: true },
      {
        type: 'text',
        name: 'age',
        inputType: 'number',
        validators: [
          {
            type: 'expression',
            expression: '{age} >= {event.minAge}',
            text: { default: 'Too young', de: 'Zu jung' },
          },
        ],
      },
    ]);

    await expect(errorsFor(event, { age: 5 })).resolves.toEqual([
      { path: 'first_name', message: 'Response required.' },
      { path: 'age', message: 'Too young' },
    ]);
  });

  it.each(['de', 'de-DE', 'de_DE'])(
    'reports validation messages in the %s locale',
    async (locale) => {
      const event = eventWith([
        { type: 'text', name: 'first_name', isRequired: true },
        {
          type: 'text',
          name: 'age',
          inputType: 'number',
          validators: [
            {
              type: 'expression',
              expression: '{age} >= {event.minAge}',
              text: { default: 'Too young', de: 'Zu jung' },
            },
          ],
        },
      ]);

      await expect(errorsFor(event, { age: 5 }, locale)).resolves.toEqual([
        { path: 'first_name', message: 'Bitte beantworten Sie diese Frage.' },
        { path: 'age', message: 'Zu jung' },
      ]);
    },
  );

  it('locates errors inside dynamic panels and matrices', async () => {
    const event = eventWith([
      {
        type: 'paneldynamic',
        name: 'contacts',
        templateElements: [{ type: 'text', name: 'phone', isRequired: true }],
      },
      {
        type: 'matrixdynamic',
        name: 'siblings',
        rowCount: 0,
        columns: [{ name: 'name', cellType: 'text', isRequired: true }],
      },
      {
        type: 'matrixdropdown',
        name: 'sizes',
        rows: ['shirt'],
        columns: [
          {
            name: 'size',
            cellType: 'text',
            inputType: 'number',
            validators: [{ type: 'numeric', minValue: 1 }],
          },
        ],
      },
      {
        type: 'paneldynamic',
        name: 'documents',
        templateElements: [{ type: 'file', name: 'scan' }],
      },
    ]);

    await expect(
      errorsFor(event, {
        contacts: [{ phone: '123' }, {}],
        siblings: [{}, { name: 'Anna' }],
        sizes: { shirt: { size: 0 } },
        documents: [{ scan: [{ name: 'a.pdf', content: 'x' }] }],
      }),
    ).resolves.toEqual([
      { path: 'contacts[1].phone', message: 'Response required.' },
      { path: 'siblings[0].name', message: 'Response required.' },
      { path: 'sizes.shirt.size', message: "The 'value' should be at least 1" },
      { path: 'documents[0].scan', message: 'Invalid file reference' },
    ]);
  });

  it('reports a required panel left empty', async () => {
    const event = eventWith([
      {
        type: 'panel',
        name: 'emergency',
        isRequired: true,
        elements: [{ type: 'text', name: 'phone' }],
      },
      {
        type: 'paneldynamic',
        name: 'contacts',
        templateElements: [
          {
            type: 'panel',
            name: 'address',
            isRequired: true,
            elements: [{ type: 'text', name: 'street' }],
          },
        ],
      },
    ]);

    const errors = await errorsFor(event, {
      contacts: [{ street: 'Main St' }, {}],
    });

    expect(errors.map((error) => error.path)).toEqual([
      'emergency',
      'contacts[1].address',
    ]);
  });

  it('does not report warnings', async () => {
    const event = eventWith([
      { type: 'text', name: 'first_name', isRequired: true },
      {
        type: 'text',
        name: 'nickname',
        validators: [
          {
            type: 'expression',
            expression: '{nickname} notempty',
            text: 'Consider a nickname',
            notificationType: 'warning',
          },
        ],
      },
    ]);

    await expect(errorsFor(event, { first_name: 'Jhon' })).resolves.toEqual([]);
    await expect(errorsFor(event, {})).resolves.toEqual([
      { path: 'first_name', message: 'Response required.' },
    ]);
  });

  it('rejects failed validation even when no error can be located', async () => {
    const event = eventWith([{ type: 'text', name: 'first_name' }]);
    const validate = vi
      .spyOn(SurveyModel.prototype, 'validate')
      .mockReturnValue(false);

    try {
      await expect(errorsFor(event, { first_name: 'Jhon' })).resolves.toEqual([
        { path: '', message: 'Response does not satisfy the form' },
      ]);
    } finally {
      validate.mockRestore();
    }
  });

  it('waits for async validators', async () => {
    FunctionFactory.Instance.register(
      'isKnownCode',
      function (
        this: { returnResult: (result: boolean) => void },
        params: unknown[],
      ) {
        setTimeout(() => {
          this.returnResult(params[0] === 'ok');
        }, 1);
      },
      true,
    );

    const event = eventWith([
      {
        type: 'text',
        name: 'code',
        validators: [
          {
            type: 'expression',
            expression: 'isKnownCode({code})',
            text: 'Unknown code',
          },
        ],
      },
    ]);

    try {
      await expect(errorsFor(event, { code: 'ok' })).resolves.toEqual([]);
      await expect(errorsFor(event, { code: 'nope' })).resolves.toEqual([
        { path: 'code', message: 'Unknown code' },
      ]);
    } finally {
      FunctionFactory.Instance.unregister('isKnownCode');
    }
  });

  it('fails when an async validator never settles', async () => {
    FunctionFactory.Instance.register(
      'neverSettles',
      () => {
        // Never calls `returnResult`.
      },
      true,
    );

    const event = eventWith([
      {
        type: 'text',
        name: 'code',
        validators: [
          { type: 'expression', expression: 'neverSettles({code})' },
        ],
      },
    ]);

    vi.useFakeTimers();
    try {
      const errors = errorsFor(event, { code: 'x' });
      const rejection = expect(errors).rejects.toThrow('did not settle');

      await vi.advanceTimersByTimeAsync(5_000);
      await rejection;
    } finally {
      vi.useRealTimers();
      FunctionFactory.Instance.unregister('neverSettles');
    }
  });

  it('reports a file value that is not an upload reference', async () => {
    const event = eventWith([{ type: 'file', name: 'passport' }]);

    await expect(
      errorsFor(event, { passport: '01J0000000000000000000000' }),
    ).resolves.toEqual([]);
    await expect(
      errorsFor(event, {
        passport: [{ name: 'a.pdf', type: 'application/pdf', content: 'x' }],
      }),
    ).resolves.toEqual([
      { path: 'passport', message: 'Invalid file reference' },
    ]);
  });

  it('accepts a computed value that changed since the form was opened', async () => {
    // The participant saw a free place; it was taken before they submitted.
    const event = eventWith(
      [
        { type: 'text', name: 'first_name' },
        {
          type: 'expression',
          name: 'waiting_list',
          expression: 'isWaitingList({event.freePlaces})',
        },
      ],
      0,
    );

    const form = new RegistrationForm(event).load({
      first_name: 'Jhon',
      waiting_list: false,
    });

    expect(form.dataErrors()).resolves.toEqual([]);
    expect(form.data).toHaveProperty('waiting_list', true);
  });
});

describe('RegistrationForm.extractEventData', () => {
  it('collects the answers of tagged questions by tag', () => {
    const event = eventWith([
      { type: 'text', name: 'first_name', eventDataType: 'first_name' },
      { type: 'text', name: 'email', eventDataType: 'email' },
      { type: 'text', name: 'guardian_email', eventDataType: 'email' },
      { type: 'text', name: 'notes' },
    ]);

    const form = new RegistrationForm(event).load({
      first_name: 'Jhon',
      email: 'jhon@example.com',
      notes: 'untagged',
    });

    expect(form.extractEventData()).toEqual({
      first_name: ['Jhon'],
      email: ['jhon@example.com', null],
    });
  });
});

describe('RegistrationForm.getFileIds', () => {
  it('collects the ids of every file question', () => {
    const event = eventWith([
      { type: 'file', name: 'passport' },
      { type: 'file', name: 'documents', allowMultiple: true },
      { type: 'file', name: 'empty' },
    ]);

    const form = new RegistrationForm(event).load({
      passport: 'file-1',
      documents: ['file-2', 'file-3'],
    });

    expect(form.getFileIds()).toEqual(['file-1', 'file-2', 'file-3']);
  });
});
