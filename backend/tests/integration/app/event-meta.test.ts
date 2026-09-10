import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { appPath } from '#utils/paths';
import {
  EventFactory,
  EventManagerFactory,
  OrganizationFactory,
  UserFactory,
} from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';
import { request } from '../utils/request.js';

const indexPath = appPath('..', 'frontend', 'dist', 'spa', 'index.html');

/** The shell as Quasar emits it: minified, comments stripped, quotes dropped. */
const SHELL =
  '<!doctype html><html><head><title>Camp Registrations</title>' +
  '<meta charset=utf-8><meta name=description content="Manage camp registrations">' +
  '</head><body><div id=q-app></div></body></html>';

// The backend test job does not build the frontend, so stand the artefact up
// here and restore whatever was there for a developer running against a build.
let original: string | null = null;

beforeAll(async () => {
  original = await fs.readFile(indexPath, 'utf8').catch(() => null);
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, SHELL);
});

afterAll(async () => {
  if (original === null) {
    await fs.rm(indexPath, { force: true });
    return;
  }

  await fs.writeFile(indexPath, original);
});

const createEvent = async (
  data: Parameters<typeof EventFactory.create>[0] = {},
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' = 'VERIFIED',
) =>
  EventFactory.create({
    listed: true,
    name: 'Sommerlager',
    organizer: 'Beispiel e.V.',
    location: 'Berlin',
    organization: {
      create: OrganizationFactory.build({ verificationStatus }),
    },
    ...data,
  });

/** Tolerates the minified shell's unquoted attributes as well as our own output. */
const previewOf = (html: string): string | null =>
  /<meta property="?og:title"? content="([^"]*)"/.exec(html)?.[1] ?? null;

describe('GET /events/:eventId (link preview)', () => {
  it('should serve the event name and description', async () => {
    const event = await createEvent();

    const { text } = await request().get(`/events/${event.id}`).expect(200);

    expect(previewOf(text)).toBe('Sommerlager');
    expect(text).toContain('<title>Sommerlager</title>');
    expect(text).toContain('Berlin · Beispiel e.V.');
    expect(text).toContain(`/events/${event.id}"`);
  });

  it('should keep the SPA entry point intact', async () => {
    const event = await createEvent();

    const { text } = await request().get(`/events/${event.id}`).expect(200);

    expect(text).toContain('<div id=q-app></div>');
  });

  it('should replace the default tags rather than duplicate them', async () => {
    const event = await createEvent();

    const { text } = await request().get(`/events/${event.id}`).expect(200);

    expect(text.match(/og:title/g)).toHaveLength(1);
    expect(text.match(/name="description"/g)).toHaveLength(1);
    expect(text).not.toContain('<title>Camp Registrations</title>');
  });

  it('should escape event content', async () => {
    const event = await createEvent({ name: '<script>alert("x")</script>' });

    const { text } = await request().get(`/events/${event.id}`).expect(200);

    expect(text).not.toContain('<script>alert');
  });

  it('should serve the generic shell for an unknown event', async () => {
    const { text } = await request()
      .get('/events/01JB000000000000000000000X')
      .expect(200);

    expect(previewOf(text)).toBeNull();
    expect(text).toContain('<title>Camp Registrations</title>');
  });

  it('should preview legacy camp links', async () => {
    const event = await createEvent();

    const { text } = await request().get(`/camps/${event.id}`).expect(200);

    expect(previewOf(text)).toBe('Sommerlager');
    // Canonical, even when the link that was shared is the legacy one.
    expect(text).toContain(`/events/${event.id}"`);
  });

  it('should not preview pages that are not an event', async () => {
    const { text } = await request().get('/events').expect(200);

    expect(previewOf(text)).toBeNull();
    expect(text).toContain('<title>Camp Registrations</title>');
  });

  /**
   * ⚠️ The guard-divergence alarm. `eventPubliclyVisible` is the anonymous half
   * of the API route's `eventViewGuard`; if a change narrows one and not the
   * other, exactly one of these two answers moves and this fails.
   *
   * Asserted as an equivalence on purpose — it survives a legitimate change to
   * the visibility rule, unlike a test that pins today's outcome per fixture.
   */
  describe('permission parity with GET /api/v1/events/:eventId', () => {
    const fixtures = [
      ['a verified organization', 'VERIFIED', true],
      ['a verified organization, unlisted', 'VERIFIED', false],
      ['an unverified organization', 'PENDING', true],
      ['a rejected organization', 'REJECTED', true],
    ] as const;

    it.each(fixtures)(
      'should preview an event of %s exactly when the anonymous API serves it',
      async (_label, verificationStatus, listed) => {
        const event = await createEvent({ listed }, verificationStatus);

        const api = await request().get(`/api/v1/events/${event.id}`);
        const { text } = await request().get(`/events/${event.id}`).expect(200);

        expect(previewOf(text) === 'Sommerlager').toBe(api.status === 200);
      },
    );
  });

  /**
   * The preview must be a pure function of the event: a shared cache may hand
   * one viewer's response to the next visitor.
   */
  describe('viewer independence', () => {
    it('should serve identical bytes to a manager, an administrator and a crawler', async () => {
      const event = await createEvent({}, 'PENDING');

      const manager = await UserFactory.create();
      await EventManagerFactory.create({
        event: { connect: { id: event.id } },
        user: { connect: { id: manager.id } },
        role: 'DIRECTOR',
      });
      const administrator = await UserFactory.create({ role: 'ADMIN' });

      const anonymous = await request().get(`/events/${event.id}`).expect(200);
      const asManager = await request()
        .get(`/events/${event.id}`)
        .auth(generateAccessToken(manager), { type: 'bearer' })
        .expect(200);
      const asAdministrator = await request()
        .get(`/events/${event.id}`)
        .auth(generateAccessToken(administrator), { type: 'bearer' })
        .expect(200);

      expect(asManager.text).toBe(anonymous.text);
      expect(asAdministrator.text).toBe(anonymous.text);
    });
  });
});
