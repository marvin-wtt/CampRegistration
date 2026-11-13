import { injectable } from 'inversify';
import httpStatus from 'http-status';
import { BaseService } from '#core/base/BaseService';
import ApiError from '#core/router/ApiError';

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
    const name = party.name?.trim() ?? '';

    return { userId: null, name: name.length > 0 ? name : null };
  }
}
