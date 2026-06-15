import { describe, expect, it } from 'vitest';
import { request } from '../utils/request.js';
import { fetchCsrf } from '../utils/csrf.js';
import { UserFactory } from '../../../prisma/factories/index.js';
import { generateAccessToken } from './utils/token.js';

describe('CSRF protection', () => {
  it('should issue a CSRF token', async () => {
    const { token } = await fetchCsrf();

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should reject a state-changing web request without a CSRF token', async () => {
    await request()
      .post('/api/v1/auth/forgot-password')
      .set('X-Client-Type', 'web')
      .send({ email: 'someone@email.net' })
      .expect(403);
  });

  it('should accept a state-changing web request with a valid CSRF token', async () => {
    const { token, cookies } = await fetchCsrf();

    await request()
      .post('/api/v1/auth/forgot-password')
      .set('X-Client-Type', 'web')
      .set('Cookie', cookies)
      .set('x-csrf-token', token)
      .send({ email: 'someone@email.net' })
      .expect(204);
  });

  it('should reject a CSRF token that is missing its matching session cookie', async () => {
    const { token } = await fetchCsrf();

    await request()
      .post('/api/v1/auth/forgot-password')
      .set('X-Client-Type', 'web')
      .set('x-csrf-token', token)
      .send({ email: 'someone@email.net' })
      .expect(403);
  });

  it('should protect public, unauthenticated web routes', async () => {
    // Camp registration is a public route and must still require a CSRF token.
    // The request is rejected by the middleware before any handler runs, so a
    // placeholder camp id is sufficient.
    await request()
      .post('/api/v1/camps/placeholder-camp-id/registrations')
      .set('X-Client-Type', 'web')
      .send({ data: {} })
      .expect(403);
  });

  it('should skip CSRF protection for non-web clients (e.g. the native app)', async () => {
    // The app authenticates (login / 2FA) before it holds a Bearer token, so it
    // must be exempted via its X-Client-Type header.
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
      .set('X-Client-Type', 'web')
      .auth(accessToken, { type: 'bearer' })
      .send()
      .expect(204);
  });
});
