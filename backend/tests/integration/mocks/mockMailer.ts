import { vi } from 'vitest';
import { NoOpMailer } from '#core/mail/noop.mailer';

export function mockMailer() {
  vi.spyOn(NoOpMailer.prototype, 'sendMail').mockResolvedValue();
}
