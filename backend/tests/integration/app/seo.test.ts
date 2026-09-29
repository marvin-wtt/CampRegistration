import { describe, expect, it } from 'vitest';
import {
  EventFactory,
  OrganizationFactory,
} from '../../../prisma/factories/index.js';
import { request } from '../utils/request.js';

const DAY = 24 * 60 * 60 * 1000;

const createEvent = async (
  data: Parameters<typeof EventFactory.create>[0] = {},
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' = 'VERIFIED',
) =>
  EventFactory.create({
    listed: true,
    startAt: new Date(Date.now() + 7 * DAY),
    endAt: new Date(Date.now() + 14 * DAY),
    organization: {
      create: OrganizationFactory.build({ verificationStatus }),
    },
    ...data,
  });

describe('GET /robots.txt', () => {
  it('should point crawlers to the sitemap', async () => {
    const { text, headers } = await request().get('/robots.txt').expect(200);

    expect(headers['content-type']).toContain('text/plain');
    expect(text).toContain('Disallow: /management');
    expect(text).toContain('Sitemap: http://localhost:3000/sitemap.xml');
  });
});

describe('GET /sitemap.xml', () => {
  it('should list the public pages and every listed event', async () => {
    const event = await createEvent();

    const { text, headers } = await request().get('/sitemap.xml').expect(200);

    expect(headers['content-type']).toContain('application/xml');
    expect(text).toContain('<loc>http://localhost:3000/</loc>');
    expect(text).toContain('<loc>http://localhost:3000/events</loc>');
    expect(text).toContain(
      `<loc>http://localhost:3000/events/${event.id}</loc>`,
    );
  });

  it.each([
    ['an unlisted event', { listed: false }, 'VERIFIED'],
    ['an event of an unverified organization', {}, 'PENDING'],
    ['an event of a rejected organization', {}, 'REJECTED'],
    [
      'an event that has ended',
      {
        startAt: new Date(Date.now() - 14 * DAY),
        endAt: new Date(Date.now() - 7 * DAY),
      },
      'VERIFIED',
    ],
  ] as const)('should omit %s', async (_label, data, verificationStatus) => {
    const event = await createEvent(data, verificationStatus);

    const { text } = await request().get('/sitemap.xml').expect(200);

    expect(text).not.toContain(event.id);
  });

  /**
   * ⚠️ The drift alarm. The sitemap must offer exactly what the anonymous
   * directory lists; a visibility change applied to one side only fails here.
   */
  it('should list exactly the events the anonymous directory serves', async () => {
    await createEvent();
    await createEvent({ listed: false });
    await createEvent({}, 'PENDING');
    await createEvent({ listed: false }, 'PENDING');
    await createEvent({}, 'REJECTED');

    const { body } = await request().get('/api/v1/events').expect(200);
    const { text } = await request().get('/sitemap.xml').expect(200);

    const listed = body.data.map((event: { id: string }) => event.id).sort();
    const offered = [...text.matchAll(/\/events\/([0-9A-Z]{26})</g)]
      .map((match) => match[1])
      .sort();

    expect(listed.length).toBeGreaterThan(0);
    expect(offered).toEqual(listed);
  });
});
