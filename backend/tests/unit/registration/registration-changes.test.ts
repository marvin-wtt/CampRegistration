import { describe, expect, it } from 'vitest';
import type { Event, Registration } from '#generated/prisma/client.js';
import {
  changesForRegistration,
  diffRegistrationData,
  redactChangeValues,
  renderChangesHtml,
  renderChangesText,
  unwrapChangesBlock,
} from '#app/registration/registration.changes';

const labels = { cleared: 'removed', file: 'file updated' };

// `setVariables` reads these off the event to expose them as survey variables,
// so a stub without them is not a event any form can be rendered against.
function eventWith(form: object): Event {
  return {
    id: 'event-1',
    form,
    countries: ['de'],
    name: { de: 'Event', en: 'Event' },
    organizer: { de: 'Organizer', en: 'Organizer' },
    contactEmail: { de: 'event@example.com', en: 'event@example.com' },
    maxParticipants: { de: 10, en: 10 },
    startAt: new Date('2026-07-01T00:00:00.000Z'),
    endAt: new Date('2026-07-14T00:00:00.000Z'),
    minAge: 10,
    maxAge: 18,
    location: null,
    price: { de: 100, en: 100 },
  } as unknown as Event;
}

const simpleEvent = eventWith({
  pages: [
    {
      name: 'page1',
      title: 'Profile',
      elements: [
        { type: 'text', name: 'first_name', title: 'First name' },
        { type: 'text', name: 'phone', title: 'Phone' },
        {
          type: 'dropdown',
          name: 'diet',
          title: { default: 'Diet', de: 'Ernährung' },
          choices: [
            { value: 'vegan', text: { default: 'Vegan', de: 'Vegan' } },
            {
              value: 'vegetarian',
              text: { default: 'Vegetarian', de: 'Vegetarisch' },
            },
          ],
        },
      ],
    },
  ],
});

describe('diffRegistrationData', () => {
  it('returns nothing when the data is identical', () => {
    const data = { first_name: 'Jane', diet: 'vegan' };

    expect(diffRegistrationData(simpleEvent, data, data, 'en')).toEqual([]);
  });

  it('reports a changed answer with its new value', () => {
    const changes = diffRegistrationData(
      simpleEvent,
      { first_name: 'Jane' },
      { first_name: 'John' },
      'en',
    );

    expect(changes).toEqual([
      { path: 'first_name', label: 'First name', value: 'John', isFile: false },
    ]);
  });

  it('reports a newly filled field', () => {
    const changes = diffRegistrationData(
      simpleEvent,
      { first_name: 'Jane' },
      { first_name: 'Jane', phone: '+49 170 1234' },
      'en',
    );

    expect(changes).toEqual([
      { path: 'phone', label: 'Phone', value: '+49 170 1234', isFile: false },
    ]);
  });

  it('reports a cleared field with a null value', () => {
    const changes = diffRegistrationData(
      simpleEvent,
      { first_name: 'Jane', phone: '+49 170 1234' },
      { first_name: 'Jane' },
      'en',
    );

    expect(changes).toEqual([
      { path: 'phone', label: 'Phone', value: null, isFile: false },
    ]);
  });

  it('uses the localized question title and choice label', () => {
    const [change] = diffRegistrationData(
      simpleEvent,
      { diet: 'vegan' },
      { diet: 'vegetarian' },
      'de',
    );

    expect(change).toMatchObject({
      label: 'Ernährung',
      value: 'Vegetarisch',
    });
  });

  it('joins multi-choice answers into one entry rather than one per choice', () => {
    const event = eventWith({
      elements: [
        {
          type: 'checkbox',
          name: 'allergies',
          title: 'Allergies',
          choices: ['Nuts', 'Milk', 'Eggs'],
        },
      ],
    });

    const changes = diffRegistrationData(
      event,
      { allergies: ['Nuts'] },
      { allergies: ['Nuts', 'Milk'] },
      'en',
    );

    expect(changes).toEqual([
      {
        path: 'allergies',
        label: 'Allergies',
        value: 'Nuts, Milk',
        isFile: false,
      },
    ]);
  });

  it('descends into dynamic panels and labels the nested question', () => {
    const event = eventWith({
      elements: [
        {
          type: 'paneldynamic',
          name: 'contacts',
          title: 'Contacts',
          templateElements: [{ type: 'text', name: 'phone', title: 'Phone' }],
        },
      ],
    });

    const changes = diffRegistrationData(
      event,
      { contacts: [{ phone: '111' }] },
      { contacts: [{ phone: '222' }] },
      'en',
    );

    expect(changes).toHaveLength(1);
    expect(changes[0].label).toBe('Contacts > #1 > Phone');
    expect(changes[0].value).toBe('222');
  });

  it('flags file answers instead of printing the stored id', () => {
    const event = eventWith({
      elements: [{ type: 'file', name: 'passport', title: 'Passport' }],
    });

    const changes = diffRegistrationData(
      event,
      { passport: '01ARZ3NDEKTSV4RRFFQ69G5FAV' },
      { passport: '01ARZ3NDEKTSV4RRFFQ69G5FBW' },
      'en',
    );

    // The stored id never reaches the struct at all; the renderers word it.
    expect(changes).toEqual([
      { path: 'passport', label: 'Passport', value: null, isFile: true },
    ]);
  });

  it('truncates long free text rather than reproducing it whole', () => {
    const event = eventWith({
      elements: [{ type: 'comment', name: 'notes', title: 'Notes' }],
    });
    const long = 'a'.repeat(500);

    const [change] = diffRegistrationData(
      event,
      { notes: 'short' },
      { notes: long },
      'en',
    );

    expect(change.value).toHaveLength(201);
    expect(change.value?.endsWith('…')).toBe(true);
  });
});

describe('changesForRegistration', () => {
  const registrationWith = (
    data: object,
    overrides: Partial<Registration> = {},
  ): Registration =>
    ({
      id: 'registration-1',
      data,
      locale: 'en-US',
      country: null,
      ...overrides,
    }) as unknown as Registration;

  it('labels the changes in the language the mail will be sent in', () => {
    const changes = changesForRegistration(
      simpleEvent,
      registrationWith({ diet: 'vegan' }),
      registrationWith({ diet: 'vegetarian' }, { country: 'de' }),
    );

    expect(changes).toMatchObject([
      { label: 'Ernährung', value: 'Vegetarisch' },
    ]);
  });

  it('falls back to the registration locale when there is no country', () => {
    const changes = changesForRegistration(
      simpleEvent,
      registrationWith({ diet: 'vegan' }),
      registrationWith({ diet: 'vegetarian' }, { locale: 'en-US' }),
    );

    expect(changes).toMatchObject([{ label: 'Diet', value: 'Vegetarian' }]);
  });

  it('returns no changes rather than throwing when the form cannot be read', () => {
    const brokenEvent = { id: 'event-1' } as unknown as Event;

    expect(() =>
      changesForRegistration(
        brokenEvent,
        registrationWith({ diet: 'vegan' }),
        registrationWith({ diet: 'vegetarian' }),
      ),
    ).not.toThrow();
  });
});

describe('renderChangesHtml', () => {
  const changes = [
    { path: 'diet', label: 'Food > Diet', value: 'Vegan', isFile: false },
    { path: 'phone', label: 'Phone', value: null, isFile: false },
  ];

  it('renders one list item per change', () => {
    const html = renderChangesHtml(changes, labels);

    expect(html).toContain('<ul class="registration-changes"');
    expect(html).toContain('<strong>Food &gt; Diet</strong>');
    expect(html).toContain('Vegan');
    expect(html).toContain('removed');
  });

  it('renders nothing for an empty change set', () => {
    expect(renderChangesHtml([], labels)).toBe('');
  });

  it('escapes markup coming from participant answers', () => {
    const html = renderChangesHtml(
      [
        {
          path: 'notes',
          label: 'Notes',
          value: '<script>alert(1)</script>',
          isFile: false,
        },
      ],
      labels,
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('keeps the labels but drops the values when redacted', () => {
    const redacted = redactChangeValues(renderChangesHtml(changes, labels));

    expect(redacted).toContain('<strong>Food &gt; Diet</strong>');
    expect(redacted).not.toContain('Vegan');
    expect(redacted).not.toContain('removed');
  });
});

describe('renderChangesText', () => {
  it('joins the changes into a single line', () => {
    const text = renderChangesText(
      [
        { path: 'diet', label: 'Diet', value: 'Vegan', isFile: false },
        { path: 'passport', label: 'Passport', value: null, isFile: true },
      ],
      labels,
    );

    expect(text).toBe('Diet: Vegan, Passport: file updated');
  });
});

describe('unwrapChangesBlock', () => {
  it('lifts the list out of the paragraph the editor wraps it in', () => {
    const html = '<p>Hi</p><p><ul class="registration-changes"></ul></p>';

    expect(unwrapChangesBlock(html)).toBe(
      '<p>Hi</p><ul class="registration-changes"></ul>',
    );
  });

  it('leaves a list the manager placed between other content alone', () => {
    const html = '<p>Hi</p><ul class="registration-changes"></ul><p>Bye</p>';

    expect(unwrapChangesBlock(html)).toBe(html);
  });
});
