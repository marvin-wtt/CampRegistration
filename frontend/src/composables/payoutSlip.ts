import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { Payout } from '@camp-registration/common/entities';
import { formatIban } from '@camp-registration/common/utils';
import { parseLocalDate } from '@/utils/date';
import { printPayoutSlip } from '@/components/event/finances/printPayoutSlip';

/**
 * Prints a payout's frozen statement. Only what may change after it was made
 * is added here, in the slip's own language.
 */
export function usePayoutSlip() {
  const quasar = useQuasar();
  const { d } = useI18n({ useScope: 'global' });

  return (payout: Payout) => {
    const { locale } = payout.statement;

    printPayoutSlip(
      {
        ...payout.statement,
        label: payout.label,
        direction: payout.direction,
        paidOn: payout.paidOn
          ? d(parseLocalDate(payout.paidOn), 'date', locale)
          : null,
        createdByName: payout.createdByName,
        recipientName: payout.recipientName,
        note: payout.note,
        bankAccount: payout.bankAccount && {
          ...payout.bankAccount,
          iban: formatIban(payout.bankAccount.iban),
        },
        signature: payout.signature,
        signedAt: payout.signedAt
          ? d(new Date(payout.signedAt), 'dateTime', locale)
          : null,
      },
      (message) => quasar.notify({ type: 'negative', message }),
    );
  };
}
