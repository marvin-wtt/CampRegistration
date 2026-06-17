import supertest from 'supertest';
import { app } from '../setup.js';

declare module 'supertest' {
  interface Test {
    expectOrPrint: (statusCode: number) => Test;
    setSessionId: (sessionId: string) => Test;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(supertest as any).Test.prototype.expectOrPrint = function (
  this: supertest.Test,
  statusCode: number,
) {
  this.expect((res) => {
    if (res.status !== statusCode) {
      console.error(JSON.stringify(res.body, null, 2));
    }
  });
  this.expect(statusCode);
  return this;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(supertest as any).Test.prototype.setSessionId = function (
  this: supertest.Test,
  sessionId: string,
) {
  this.set('Cookie', ['session=' + sessionId, '__Host-session=' + sessionId]);

  return this;
};

// Mutating methods default to a non-web client so requests are exempt from CSRF
// protection (the real middleware stays active). Tests that exercise the web
// client opt in with `.set('X-Client-Type', 'web')` and supply a CSRF token.
const CSRF_RELEVANT_METHODS = ['post', 'put', 'patch', 'delete'] as const;

export const request = () => {
  const agent = supertest(app!);

  for (const method of CSRF_RELEVANT_METHODS) {
    const original = (agent[method] as (url: string) => supertest.Test).bind(
      agent,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (agent as any)[method] = (url: string) =>
      original(url).set('X-Client-Type', 'app');
  }

  return agent;
};
