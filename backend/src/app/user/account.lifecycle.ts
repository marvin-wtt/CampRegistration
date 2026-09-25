import type { User } from '#generated/prisma/client.js';
import { injectable } from 'inversify';

export type VerifiedAccount = Pick<User, 'id' | 'email'>;

export type EmailVerifiedListener = (account: VerifiedAccount) => Promise<void>;

/**
 * Lets modules react to account changes without the user module knowing them.
 * Listeners register in their module's `configure()`.
 */
@injectable()
export class AccountLifecycle {
  private readonly emailVerifiedListeners: EmailVerifiedListener[] = [];

  onEmailVerified(listener: EmailVerifiedListener): void {
    this.emailVerifiedListeners.push(listener);
  }

  // Fired whenever an account holds a verified email it did not hold before.
  async emailVerified(account: VerifiedAccount): Promise<void> {
    for (const listener of this.emailVerifiedListeners) {
      await listener(account);
    }
  }
}
