import { describe, expect, it } from 'vitest';
import type { EventWithFreePlaces } from '#app/event/event.types';
// Nothing else imported: the form module must bring the platform's question
// types along itself, or every server path reading a form would lose them.
import { RegistrationForm } from '#app/registration/registration.form';

const event = {
  id: 'event-1',
  form: {
    elements: [
      { type: 'role', name: 'role' },
      { type: 'country', name: 'nationality' },
      { type: 'address', name: 'address' },
      { type: 'date_of_birth', name: 'date_of_birth' },
    ],
  },
  countries: ['de'],
  name: 'Event',
  organizer: 'Organizer',
  contactEmail: 'event@example.com',
  maxParticipants: 10,
  startAt: new Date('2026-07-01T00:00:00.000Z'),
  endAt: new Date('2026-07-14T00:00:00.000Z'),
  minAge: 10,
  maxAge: 18,
  location: null,
  price: 0,
  freePlaces: 10,
} as unknown as EventWithFreePlaces;

describe('RegistrationForm', () => {
  it('knows the platform question types without further imports', async () => {
    const form = new RegistrationForm(event, 'de').load({
      role: 'participant',
      nationality: 'de',
      address: {
        address: 'Main Street 1',
        zip_code: '12345',
        city: 'Sometown',
        country: 'de',
      },
      date_of_birth: '2012-01-01',
    });

    await expect(form.dataErrors()).resolves.toEqual([]);
  });
});
