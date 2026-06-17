import { request } from './request.js';

export interface CsrfContext {
  token: string;
  // The `__Host-` prefixed, Secure cookies are not replayed by supertest's
  // cookie jar over HTTP, so callers forward them manually via `.set('Cookie')`.
  cookies: string[];
}

// Fetches a CSRF token together with the cookies it is bound to. Use the
// returned values on a web (`X-Client-Type: web`) request to pass CSRF
// protection.
export async function fetchCsrf(): Promise<CsrfContext> {
  const res = await request().get('/api/v1/auth/csrf-token').expect(200);

  const setCookie = (res.headers['set-cookie'] ?? []) as unknown as string[];
  const cookies = setCookie.map((cookie) => cookie.split(';')[0] as string);

  return { token: res.body.csrfToken as string, cookies };
}
