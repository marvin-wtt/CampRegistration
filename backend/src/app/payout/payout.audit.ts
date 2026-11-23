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

// Logged as one field, never with values: the audit log keeps no free text.
const BANK_ACCOUNT_KEYS: (keyof Payout)[] = [
  'bankAccountHolder',
  'bankIban',
  'bankBic',
];

const VALUE_KEYS = ['direction', 'amount', 'paidOn'] as const;

export const payoutAuditPolicy: AuditChangePolicy<Payout> = {
  entityType: 'payout',

  locate: (payout) => ({ entityId: payout.id, eventId: payout.eventId }),
  identity: payoutIdentity,

  details(before, after) {
    const fields: string[] = changedKeysByAllowList(
      before,
      after,
      FIELD_ALLOWLIST,
    );
    if (changedKeysByAllowList(before, after, BANK_ACCOUNT_KEYS).length > 0) {
      fields.push('bankAccount');
    }
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
