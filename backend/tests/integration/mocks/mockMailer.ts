import { vi } from 'vitest';
import { NoOpMailer } from '#app/mail/noop.mailer';

export function mockMailer() {
  vi.spyOn(NoOpMailer.prototype, 'sendMail').mockResolvedValue();
}
