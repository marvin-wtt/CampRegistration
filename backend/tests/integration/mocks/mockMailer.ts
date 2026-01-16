import { expect, vi } from 'vitest';
import { NoOpMailer } from '#app/mail/noop.mailer';
import type { BuiltMail } from '#app/mail/mail.types';

export function mockMailer() {
  vi.spyOn(NoOpMailer.prototype, 'sendMail').mockResolvedValue();
}

export const mailer = NoOpMailer.prototype;

export function expectEmailTo(address: string, name?: string) {
  expect(mailer.sendMail).toBeCalledTimes(1);
  expect(mailer.sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: name
        ? {
            name,
            address,
          }
        : address,
    }),
  );
}

export function expectEmailWith(data: BuiltMail) {
  expect(mailer.sendMail).toHaveBeenCalledWith(expect.objectContaining(data));
}
