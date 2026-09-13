import { describe, expect, it } from 'vitest';
import type { Event } from '@camp-registration/common/entities';
import { buildEventPageMeta } from '#app/event/event.meta';

const event = (data: Partial<Event> = {}): Event =>
  ({
    id: '01JB000000000000000000000X',
    name: 'Sommerlager',
    organizer: 'Beispiel e.V.',
    location: 'Berlin',
    startAt: '2026-07-12T12:00:00',
    endAt: '2026-07-26T12:00:00',
    ...data,
  }) as Event;

describe('buildEventPageMeta', () => {
  it('resolves translatable fields for the requested locale', () => {
    const meta = buildEventPageMeta(
      event({
        name: { de: 'Sommerlager', fr: 'Camp d’été' },
        organizer: { de: 'Beispiel e.V.', fr: 'Exemple' },
        location: { de: 'Berlin', fr: 'Paris' },
      }),
      'fr-FR',
    );

    expect(meta.title).toBe('Camp d’été');
    expect(meta.description).toContain('Paris');
    expect(meta.description).toContain('Exemple');
  });

  it('describes the event from data alone', () => {
    const meta = buildEventPageMeta(event(), 'de-DE');

    expect(meta.description).toBe('12.–26.07.2026 · Berlin · Beispiel e.V.');
  });

  it('omits parts the event does not have', () => {
    const meta = buildEventPageMeta(event({ location: null }), 'en-US');

    expect(meta.description).not.toContain(' ·  · ');
    expect(meta.description).toContain('Beispiel e.V.');
  });

  it('points at the canonical events path', () => {
    expect(buildEventPageMeta(event(), 'en-US').url).toMatch(
      /\/events\/01JB000000000000000000000X$/,
    );
  });

  it('carries the logo as the preview image when the event has one', () => {
    expect(buildEventPageMeta(event(), 'en-US').image).toBeUndefined();
    expect(
      buildEventPageMeta(
        event({ logo: 'https://example.org/api/v1/files/1' }),
        'en-US',
      ).image,
    ).toBe('https://example.org/api/v1/files/1');
  });

  it('leaves whitespace and length to the renderer', () => {
    const name = `  ${'a'.repeat(200)}\n\n  `;

    expect(buildEventPageMeta(event({ name }), 'en-US').title).toBe(name);
  });
});
