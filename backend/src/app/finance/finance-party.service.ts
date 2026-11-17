import { injectable } from 'inversify';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import { partyNameKey } from '@camp-registration/common/utils';

export interface FinanceParty {
  userId: string | null;
  name: string | null;
}

/**
 * Who paid, received or got paid out. A user must manage the event and their
 * name is snapshotted, so it survives them leaving or deleting their account;
 * anyone else is a name only. Neither means event funds.
 */
@injectable()
export class FinancePartyService extends BaseService {
  async resolveParty(
    eventId: string,
    party: { userId?: string | null; name?: string | null },
  ): Promise<FinanceParty> {
    if (party.userId) {
      const manager = await this.db.eventManager.findFirst({
        where: { eventId, userId: party.userId },
        select: { user: { select: { name: true } } },
      });

      if (!manager?.user) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Only managers of this event can be picked by account.',
          { code: 'FINANCE_PARTY_NOT_MANAGER' },
        );
      }

      return { userId: party.userId, name: manager.user.name };
    }

    // An empty name counts as none: event funds.
    const name = party.name?.trim().replace(/\s+/g, ' ') ?? '';
    if (name.length === 0) {
      return { userId: null, name: null };
    }

    return (await this.matchKnown(eventId, name)) ?? { userId: null, name };
  }

  /**
   * A typed name that is already someone: the manager of that name, else the
   * name as typed before. Balances group by account or exact name, so a
   * second spelling would split the person. Two managers of one name are
   * ambiguous and left as typed.
   */
  private async matchKnown(
    eventId: string,
    name: string,
  ): Promise<FinanceParty | undefined> {
    const key = partyNameKey(name);
    const [managers, expenses, payouts] = await Promise.all([
      this.db.eventManager.findMany({
        where: {
          eventId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { user: { select: { id: true, name: true } } },
      }),
      this.db.expense.findMany({
        where: { eventId, paidByUserId: null, paidByName: { not: null } },
        select: { paidByName: true },
        distinct: ['paidByName'],
      }),
      this.db.payout.findMany({
        where: { eventId, recipientUserId: null },
        select: { recipientName: true },
        distinct: ['recipientName'],
      }),
    ]);

    const accounts = managers.flatMap((m) =>
      m.user && partyNameKey(m.user.name) === key ? [m.user] : [],
    );
    if (accounts.length === 1 && accounts[0]) {
      return { userId: accounts[0].id, name: accounts[0].name };
    }
    if (accounts.length > 1) {
      return undefined;
    }

    const typed = [
      ...expenses.map((e) => e.paidByName),
      ...payouts.map((p) => p.recipientName),
    ].find((known) => known !== null && partyNameKey(known) === key);

    return typed ? { userId: null, name: typed } : undefined;
  }

  /**
   * Before an account goes, its records fall back to their name snapshot:
   * one name throughout, so a rename in between doesn't split the person
   * (or make their statements look outdated).
   */
  async keepAccountName(account: { id: string; name: string }) {
    await this.transaction(async (tx) => {
      await tx.expense.updateMany({
        where: { paidByUserId: account.id },
        data: { paidByName: account.name },
      });
      await tx.payout.updateMany({
        where: { recipientUserId: account.id },
        data: { recipientName: account.name },
      });
    });
  }
}
