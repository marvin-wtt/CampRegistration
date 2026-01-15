import type { MailableCtor, MailBase } from '#app/mail/mail.base';
import type { SimpleJob } from '#core/queue/Queue';

const registry = new Map<string, MailableCtor<unknown>>();

export function registerMailable(ctor: MailableCtor<unknown>) {
  if (!registry.has(ctor.type)) {
    registry.set(ctor.type, ctor);
    return;
  }

  if (registry.get(ctor.type) !== ctor) {
    throw new Error(`Duplicate mailable type: "${ctor.type}"`);
  }
}

export function createMailableFromJob(
  job: SimpleJob<unknown>,
): MailBase<unknown> {
  const ctor = registry.get(job.name);
  if (!ctor) {
    throw new Error(`Unknown mailable: "${job.name}"`);
  }

  return new ctor(job.payload);
}
