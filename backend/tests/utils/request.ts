import supertest from 'supertest';
import app from '../../src/app';
import { SuperAgentRequest } from 'superagent';

declare module 'supertest' {
  interface Test {
    expectOrPrint: (statusCode: number) => Test;
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

export const request = () => {
  return supertest(app);
};

export const withJsonHeader = <Req extends SuperAgentRequest>(
  request: Req,
): Req => {
  return request.set('Accept', 'application/json');
};

export const withAuthToken = <Req extends SuperAgentRequest>(
  request: Req,
  token: string,
): Req => {
  return request.set('Authorization', `Bearer ${token}`);
};

export const withCsrfToken = <Req extends SuperAgentRequest>(
  request: Req,
  token: string,
): Req => {
  return request.set('x-csrf-token', token);
};
