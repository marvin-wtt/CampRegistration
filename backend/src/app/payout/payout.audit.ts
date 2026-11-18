import {
  changedKeysByAllowList,
  changedValues,
  composeDetails,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy } from '#app/audit/audit.policy';
import type { Payout } from '#generated/prisma/client';
import type { AuditDetails } from '@camp-registration/common/entities';

const FIELD_ALLOWLIST: (keyof Payout)[] = [
  'recipientUserId',
  'recipientName',
  'direction',
  'amount',
  'paidOn',
  'note',
  'signedAt',
];

const VALUE_KEYS = ['direction', 'amount', 'paidOn'] as const;

export const payoutAuditPolicy: AuditChangePolicy<Payout> = {
  entityType: 'payout',

  locate: (payout) => ({ entityId: payout.id, eventId: payout.eventId }),
  identity: payoutIdentity,

  details(before, after) {
    const fields = changedKeysByAllowList(before, after, FIELD_ALLOWLIST);
    if (fields.length === 0) {
      return {};
    }

    return composeDetails({
      changedFields: fields,
      values: changedValues(before, after, VALUE_KEYS),
      ...payoutIdentity(after ?? before),
    });
  },
};

function payoutIdentity(
  payout: Pick<Payout, 'number' | 'direction' | 'amount'> | null | undefined,
): AuditDetails {
  if (!payout) {
    return {};
  }

  return {
    context: {
      number: payout.number,
      direction: payout.direction,
      amount: payout.amount,
    },
  };
}
