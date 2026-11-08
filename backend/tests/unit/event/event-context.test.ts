import { describe, expect, it } from 'vitest';
import type { Event } from '#generated/prisma/client.js';
import { translateEventContext } from '#app/event/event.util';

const event = {
  name: 'Camp',
  location: null,
  organizer: 'Org',
  contactEmail: 'a@example.com',
  maxParticipants: 10,
  countries: ['de', 'pl'],
  price: { de: 15000, pl: 12050 },
  currency: 'EUR',
} as unknown as Event;

describe('translateEventContext', () => {
  it('gives templates the group’s price, formatted', () => {
    expect(
      translateEventContext(event, { locale: 'de', group: 'pl' }).price,
    ).toBe(formatted(120.5));
  });
});

function formatted(amount: number): string {
  return new Intl.NumberFormat('de', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
