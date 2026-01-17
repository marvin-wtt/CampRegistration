import type { BuiltMail } from '#app/mail/mail.types';
import { expect } from 'vitest';
import { NoOpMailer } from '#app/mail/noop.mailer';

export const mailer = NoOpMailer.prototype;

export function expectEmailWith(data: BuiltMail) {
  expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining(data));
}

export function expectEmailTo(address: string, name?: string) {
  expect(mailer.sendMail).toBeCalledTimes(1);
  expect(mailer.sendMail).toHaveBeenCalledWith(
    expect.toSatisfy((mail) => {
      const to = mail.to;

      if (name) {
        return (
          typeof to === 'object' &&
          to !== null &&
          to.name === name &&
          to.address === address
        );
      }

      return (
        to === address ||
        (typeof to === 'object' &&
          to !== null &&
          to.address === address &&
          typeof to.name === 'string')
      );
    }),
  );
}
