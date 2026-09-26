import { vi } from 'vitest';
import { NoOpMailer } from '#core/mail/drivers/noop.mailer';

export function mockMailer() {
  vi.spyOn(NoOpMailer.prototype, 'sendMail').mockResolvedValue({
    rejected: [],
  });
}
