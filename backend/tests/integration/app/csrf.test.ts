import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from '#config';
import { request } from '../utils/request.js';
import { UserFactory } from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';

// CSRF protection is disabled for the rest of the integration suite (see
// `config.csrf.enabled`). This suite re-enables it to verify the protection
// end-to-end.
describe('CSRF protection', () => {
  beforeAll(() => {
    config.csrf.enabled = true;
  });

  afterAll(() => {
    config.csrf.enabled = false;
  });

  const fetchCsrf = async (): Promise<{ token: string; cookies: string[] }> => {
    const res = await request().get('/api/v1/auth/csrf-token').expect(200);

    const setCookie = (res.headers['set-cookie'] ?? []) as unknown as string[];
    // The `__Host-` prefixed, Secure cookies are not replayed by supertest's
    // cookie jar over HTTP, so forward them manually on the protected request.
    const cookies = setCookie.map((cookie) => cookie.split(';')[0] as string);

    return { token: res.body.csrfToken as string, cookies };
  };

  it('should issue a CSRF token', async () => {
    const { token } = await fetchCsrf();

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should reject a state-changing request without a CSRF token', async () => {
    await request()
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'someone@email.net' })
      .expect(403);
  });

  it('should accept a state-changing request with a valid CSRF token', async () => {
    const { token, cookies } = await fetchCsrf();

    await request()
      .post('/api/v1/auth/forgot-password')
      .set('Cookie', cookies)
      .set('x-csrf-token', token)
      .send({ email: 'someone@email.net' })
      .expect(204);
  });

  it('should reject a CSRF token that is missing its matching session cookie', async () => {
    const { token } = await fetchCsrf();

    await request()
      .post('/api/v1/auth/forgot-password')
      .set('x-csrf-token', token)
      .send({ email: 'someone@email.net' })
      .expect(403);
  });

  it('should protect public, unauthenticated routes', async () => {
    // Camp registration is a public route and must still require a CSRF token.
    // The request is rejected by the middleware before any handler runs, so a
    // placeholder camp id is sufficient.
    await request()
      .post('/api/v1/camps/placeholder-camp-id/registrations')
      .send({ data: {} })
      .expect(403);
  });

  it('should skip CSRF protection for non-web clients (e.g. the native app)', async () => {
    // The app authenticates (login / 2FA) before it holds a Bearer token, so
    // it must be exempted via its X-Client-Type header.
    await request()
      .post('/api/v1/auth/forgot-password')
      .set('X-Client-Type', 'app')
      .send({ email: 'someone@email.net' })
      .expect(204);
  });

  it('should skip CSRF protection for Bearer authenticated requests', async () => {
    const accessToken = generateAccessToken(await UserFactory.create());

    await request()
      .post('/api/v1/auth/logout')
      .auth(accessToken, { type: 'bearer' })
      .send()
      .expect(204);
  });
});
