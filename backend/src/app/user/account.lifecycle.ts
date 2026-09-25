import type { User } from '#generated/prisma/client.js';
import { injectable } from 'inversify';
import type { PrismaTransaction } from '#core/database/transaction';

export type VerifiedAccount = Pick<User, 'id' | 'email'>;

export type EmailVerifiedListener = (
  tx: PrismaTransaction,
  account: VerifiedAccount,
) => Promise<void>;

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

  // Fired in the verifying transaction, so a failing listener rolls it back.
  // Fires when an address becomes verified, once per verification.
  async emailVerified(
    tx: PrismaTransaction,
    account: VerifiedAccount,
  ): Promise<void> {
    for (const listener of this.emailVerifiedListeners) {
      await listener(tx, account);
    }
  }
}
