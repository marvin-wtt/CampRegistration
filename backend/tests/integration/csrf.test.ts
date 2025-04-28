import { describe, expect, it } from 'vitest';
import { request, withCsrfToken } from '../utils/request';
import { UserFactory } from '../../prisma/factories';
import { generateAccessToken } from '../utils/token';

describe('CSRF Protection', () => {
  describe('Cookie-based authentication with CSRF protection', () => {
    it('should require CSRF token for POST requests with cookie authentication', async () => {
      // First make a GET request to get the CSRF token and cookie
      const getResponse = await request().get('/api/v1/auth/csrf-token');

      // Extract the CSRF token from the response
      const csrfToken = getResponse.body.csrfToken;
      expect(csrfToken).toBeDefined();

      // Cookie should be set
      const cookies = getResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('_csrf'))).toBe(true);

      // Make a POST request without CSRF token - should fail
      await request()
        .post('/api/v1/auth/register')
        .send({
          name: 'testuser',
          email: 'csrf-test@email.net',
          password: 'Password1',
        })
        .set('Cookie', cookies)
        .expect(403);

      // Make a POST request with CSRF token - should succeed
      await withCsrfToken(
        request()
          .post('/api/v1/auth/register')
          .send({
            name: 'testuser',
            email: 'csrf-test@email.net',
            password: 'Password1',
          })
          .set('Cookie', cookies),
        csrfToken
      )
        .expect(201);
    });
  });

  describe('Header-based authentication without CSRF protection', () => {
    it('should not require CSRF token for requests with Bearer token authentication', async () => {
      // Create a user and generate an access token
      const user = await UserFactory.create();
      const accessToken = generateAccessToken(user);

      // Make a POST request with Bearer token - should succeed without CSRF token
      await request()
        .post('/api/v1/auth/logout')
        .auth(accessToken, { type: 'bearer' })
        .expect(204);
    });
  });
});
