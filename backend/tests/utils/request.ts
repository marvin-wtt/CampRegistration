import supertest from 'supertest';
import { app } from './setup.js';

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
