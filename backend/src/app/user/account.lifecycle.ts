import type { User } from '#generated/prisma/client.js';
import { injectable } from 'inversify';
import type { AccountDeletionBlocker } from '@camp-registration/common/entities';

export type VerifiedAccount = Pick<User, 'id' | 'email'>;
export type DeletedAccount = Pick<User, 'id' | 'name'>;

type Listener<T> = (account: T) => Promise<void>;
type BlockerSource = (userId: string) => Promise<AccountDeletionBlocker[]>;

/**
 * Lets modules react to account changes without the user module knowing them.
 * Listeners register in their module's `configure()` and join the caller's
 * transaction, so a failing listener rolls it back.
 */
@injectable()
export class AccountLifecycle {
  private readonly emailVerifiedListeners: Listener<VerifiedAccount>[] = [];
  private readonly deletingListeners: Listener<DeletedAccount>[] = [];
  private readonly blockerSources: BlockerSource[] = [];

  onEmailVerified(listener: Listener<VerifiedAccount>): void {
    this.emailVerifiedListeners.push(listener);
  }

  // Runs before the account row is removed, while its relations still exist.
  onDeleting(listener: Listener<DeletedAccount>): void {
    this.deletingListeners.push(listener);
  }

  // Deletion is refused while any source reports something.
  blockDeletion(source: BlockerSource): void {
    this.blockerSources.push(source);
  }

  async emailVerified(account: VerifiedAccount): Promise<void> {
    for (const listener of this.emailVerifiedListeners) {
      await listener(account);
    }
  }

  async deleting(account: DeletedAccount): Promise<void> {
    for (const listener of this.deletingListeners) {
      await listener(account);
    }
  }

  async deletionBlockers(userId: string): Promise<AccountDeletionBlocker[]> {
    const lists = await Promise.all(
      this.blockerSources.map((source) => source(userId)),
    );
    return lists.flat();
  }
}
