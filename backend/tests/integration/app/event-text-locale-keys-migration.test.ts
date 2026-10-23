import { describe, expect, it } from 'vitest';
import { Prisma } from '#generated/prisma/client.js';
import { EventFactory } from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { up } from '../../../prisma/migrations/20261015120000_event_text_locale_keys/migration.js';

describe('data migration: event_text_locale_keys', () => {
  const run = () => prisma.$transaction((tx) => up(tx));
  const reload = (id: string) =>
    prisma.event.findUniqueOrThrow({
      where: { id },
      select: {
        name: true,
        location: true,
        organizer: true,
        contactEmail: true,
      },
    });

  it('re-keys name and location by locale, leaving per-country fields', async () => {
    const event = await EventFactory.create({
      countries: ['cz', 'gb'],
      name: { cz: 'Tábor', gb: 'Camp' },
      location: { cz: 'Praha', gb: 'Prague' },
      organizer: { cz: 'Spolek', gb: 'Club' },
      contactEmail: { cz: 'cz@test', gb: 'gb@test' },
    });

    await run();

    expect(await reload(event.id)).toEqual({
      name: { cs: 'Tábor', en: 'Camp' },
      location: { cs: 'Praha', en: 'Prague' },
      organizer: { cz: 'Spolek', gb: 'Club' },
      contactEmail: { cz: 'cz@test', gb: 'gb@test' },
    });
  });

  it("keeps the event's first country when two share a language", async () => {
    const event = await EventFactory.create({
      countries: ['us', 'gb'],
      name: { gb: 'Camp GB', us: 'Camp US' },
    });

    await run();

    expect((await reload(event.id)).name).toEqual({ en: 'Camp US' });
  });

  it('prefers a value already stored under the locale', async () => {
    const event = await EventFactory.create({
      countries: ['gb'],
      name: { en: 'Kept', gb: 'Dropped' },
    });

    await run();

    expect((await reload(event.id)).name).toEqual({ en: 'Kept' });
  });

  it('leaves plain values and missing locations alone, and is idempotent', async () => {
    const event = await EventFactory.create({
      countries: ['de'],
      name: 'Lager',
      location: Prisma.DbNull,
    });

    await run();
    await run();

    expect(await reload(event.id)).toMatchObject({
      name: 'Lager',
      location: null,
    });
  });
});
