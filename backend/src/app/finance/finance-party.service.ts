import { inject, injectable } from 'inversify';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';
import {
  normalizePartyName,
  partyNameKey,
  pickSpelling,
} from '@camp-registration/common/utils';
import type {
  EventManagerRole,
  FinancePartyLinkResult,
} from '@camp-registration/common/entities';
import { AuditService } from '#app/audit/audit.service';
import { expenseAuditPolicy } from '#app/expense/expense.audit';
import { payoutAuditPolicy } from '#app/payout/payout.audit';

export interface FinanceParty {
  userId: string | null;
  name: string | null;
}

export interface KnownParties {
  managers: { userId: string; name: string; role: EventManagerRole }[];
  names: string[];
}

/** A manager record that still grants access, with an account. */
function currentManager() {
  return {
    user: { isNot: null },
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

/**
 * Who paid, received or got paid out. A user must manage the event and their
 * name is snapshotted, so it survives them leaving or deleting their account;
 * anyone else is a name only. Neither means event funds.
 */
@injectable()
export class FinancePartyService extends BaseService {
  constructor(@inject(AuditService) private readonly audit: AuditService) {
    super();
  }

  async resolveParty(
    eventId: string,
    party: { userId?: string | null; name?: string | null },
  ): Promise<FinanceParty> {
    if (party.userId) {
      const manager = await this.db.eventManager.findFirst({
        where: { eventId, userId: party.userId, ...currentManager() },
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
    const name = normalizePartyName(party.name ?? '');
    if (name.length === 0) {
      return { userId: null, name: null };
    }

    return (await this.matchKnown(eventId, name)) ?? { userId: null, name };
  }

  /**
   * Who an event's money can be filed under: its current managers with an
   * account, and every name typed before. `distinct` runs in Prisma, so
   * spellings that differ in case stay apart, as they do in the balances.
   */
  async listKnown(eventId: string): Promise<KnownParties> {
    const [managers, expenses, payouts] = await Promise.all([
      this.db.eventManager.findMany({
        where: { eventId, ...currentManager() },
        select: { role: true, user: { select: { id: true, name: true } } },
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

    return {
      managers: managers.flatMap(({ role, user }) =>
        user
          ? [
              {
                userId: user.id,
                name: user.name,
                role: role as EventManagerRole,
              },
            ]
          : [],
      ),
      names: [
        ...new Set([
          ...expenses.flatMap((e) => e.paidByName ?? []),
          ...payouts.map((p) => p.recipientName),
        ]),
      ],
    };
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
    const known = await this.listKnown(eventId);

    const accounts = known.managers.filter((m) => partyNameKey(m.name) === key);
    if (accounts.length > 1) {
      return undefined;
    }
    if (accounts[0]) {
      return { userId: accounts[0].userId, name: accounts[0].name };
    }

    const typed = pickSpelling(
      known.names.filter((spelling) => partyNameKey(spelling) === key),
    );
    return typed ? { userId: null, name: typed } : undefined;
  }

  /**
   * Files everything under a typed name to a manager's account, e.g. once
   * that person has joined: otherwise their balance stays split in two.
   * Only the exact spelling moves, as the balances group by it.
   */
  async linkName(
    eventId: string,
    name: string,
    userId: string,
  ): Promise<FinancePartyLinkResult> {
    return this.transaction(async (tx) => {
      const account = await this.resolveParty(eventId, { userId });
      const accountName = account.name ?? name;

      // The collation ignores case: the exact spelling is picked in code.
      const expenses = (
        await tx.expense.findMany({
          where: { eventId, paidByUserId: null, paidByName: name },
        })
      ).filter((e) => e.paidByName === name);
      const payouts = (
        await tx.payout.findMany({
          where: { eventId, recipientUserId: null, recipientName: name },
        })
      ).filter((p) => p.recipientName === name);

      for (const expense of expenses) {
        const after = await tx.expense.update({
          where: { id: expense.id },
          data: { paidByUserId: userId, paidByName: accountName },
        });
        await this.audit.updated(expenseAuditPolicy, expense, after);
      }
      for (const payout of payouts) {
        const after = await tx.payout.update({
          where: { id: payout.id },
          data: { recipientUserId: userId, recipientName: accountName },
        });
        await this.audit.updated(payoutAuditPolicy, payout, after);
      }

      return { expenses: expenses.length, payouts: payouts.length };
    });
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
