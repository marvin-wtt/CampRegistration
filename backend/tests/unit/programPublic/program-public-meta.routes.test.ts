import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { EventWithFreePlaces } from '#app/event/event.types';
import { registerRouteModelBinding } from '#core/router/router';
import extensions from '#middlewares/extension.middleware';
import { initI18n } from '#core/i18n/i18n.client';

/** The shell as Quasar emits it: minified, comments stripped, quotes dropped. */
const SHELL =
  '<!doctype html><html><head><title>Camp Registrations</title>' +
  '<meta charset=utf-8><meta name=description content="Manage camp registrations">' +
  '</head><body><div id=q-app></div></body></html>';

const buildEvent = (
  verificationStatus: 'VERIFIED' | 'PENDING',
): EventWithFreePlaces =>
  ({
    id: '01JB000000000000000000000X',
    organizationId: '01JB0000000000000000000ORG',
    organization: {
      id: '01JB0000000000000000000ORG',
      name: 'Beispiel e.V.',
      verificationStatus,
    },
    listed: true,
    registrationOpensAt: null,
    registrationClosesAt: null,
    confirmationMode: 'AUTOMATIC',
    countries: ['de'],
    name: 'Sommerlager',
    organizer: 'Beispiel e.V.',
    contactEmail: 'info@example.org',
    maxParticipants: 30,
    minAge: 8,
    maxAge: 14,
    startAt: new Date('2026-07-12T12:00:00.000Z'),
    endAt: new Date('2026-07-26T12:00:00.000Z'),
    price: 100,
    location: 'Berlin',
    freePlaces: 5,
    registrations: [],
  }) as unknown as EventWithFreePlaces;

const events = new Map<string, EventWithFreePlaces>([
  ['verified', buildEvent('VERIFIED')],
  ['pending', buildEvent('PENDING')],
]);

// The binding must exist before the router is created — `createRouter()` copies
// the registry at construction (and later registrations back-fill it).
registerRouteModelBinding('event', (_req, id) => events.get(id) ?? null);

const indexPath = path.join(
  os.tmpdir(),
  `program-public-meta-shell-${process.pid}.html`,
);
let request: supertest.Agent;

beforeAll(async () => {
  await initI18n();
  await fs.writeFile(indexPath, SHELL);

  const { createProgramPublicMetaRouter } =
    await import('#app/programPublic/program-public-meta.routes');
  const app = express();
  const router = createProgramPublicMetaRouter(indexPath);

  // The request extensions the router expects from its mount context, exactly
  // as `#routes/web` provides them.
  app.use(extensions);

  app.use('/events', router);
  app.get('*splat', (_req, res) => {
    res.type('html').send(SHELL);
  });

  request = supertest(app);
});

afterAll(async () => {
  await fs.rm(indexPath, { force: true });
});

const previewOf = (html: string): string | null =>
  /<meta property="?og:title"? content="([^"]*)"/.exec(html)?.[1] ?? null;

const descriptionOf = (html: string): string | null =>
  /<meta name="?description"? content="([^"]*)"/.exec(html)?.[1] ?? null;

describe('program public meta router', () => {
  it('rewrites the head of a publicly visible event', async () => {
    const { text } = await request.get('/events/verified/program').expect(200);

    expect(previewOf(text)).toBe('Sommerlager');
    expect(text).toContain('<title>Sommerlager</title>');
    expect(descriptionOf(text)).toBe('See the program for Sommerlager.');
    expect(text).toContain('<div id=q-app></div>');
  });

  it('serves the untouched shell for an event of an unverified organization', async () => {
    const { text } = await request.get('/events/pending/program').expect(200);

    expect(previewOf(text)).toBeNull();
    expect(text).toContain('<title>Camp Registrations</title>');
  });

  it('serves the untouched shell for an unknown event', async () => {
    const { text } = await request.get('/events/nope/program').expect(200);

    expect(previewOf(text)).toBeNull();
    expect(text).toContain('<title>Camp Registrations</title>');
  });

  it('honours Accept-Language', async () => {
    const { text } = await request
      .get('/events/verified/program')
      .set('Accept-Language', 'de-DE')
      .expect(200);

    expect(descriptionOf(text)).toBe('Programm für Sommerlager ansehen.');
  });
});
