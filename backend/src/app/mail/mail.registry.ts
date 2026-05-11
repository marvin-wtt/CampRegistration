import type { MailableCtor, MailBase } from '#app/mail/mail.base';
import type { SimpleJob } from '#core/queue/Queue';
import { injectable } from 'inversify';

@injectable()
export class MailableRegistry {
  private registry = new Map<string, MailableCtor<unknown>>();

  has<P>(ctor: MailableCtor<P>): boolean {
    if (!this.registry.has(ctor.type)) {
      return false;
    }

    return this.registry.get(ctor.type) === ctor;
  }

  register<P>(ctor: MailableCtor<P>): void {
    if (!this.registry.has(ctor.type)) {
      this.registry.set(ctor.type, ctor as MailableCtor<unknown>);
      return;
    }

    if (this.registry.get(ctor.type) !== ctor) {
      throw new Error(`Duplicate mailable type: "${ctor.type}"`);
    }
  }

  createFromJob(job: SimpleJob<unknown>): MailBase<unknown> {
    const ctor = this.registry.get(job.name);
    if (!ctor) {
      throw new Error(`Unknown mailable: "${job.name}"`);
    }

    return new ctor(job.payload);
  }
}
