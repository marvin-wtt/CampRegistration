import { useI18n } from 'vue-i18n';
import type { Payout } from '@camp-registration/common/entities';
import { parseLocalDate } from '@/utils/date';

/** On screen, or as a scan of the slip signed on paper. */
export function isSigned(payout: Payout): boolean {
  return payout.signedAt !== null || payout.files.length > 0;
}

export type PayoutStatusKey =
  'outdated' | 'unsigned' | 'toPay' | 'toReceive' | 'done';

/**
 * What is left to do with a payout, one step at a time: signing comes before
 * paying. An outdated payout can't be signed any more; once paid and signed,
 * it is done even if a receipt changed later (settled by a new payout).
 */
function payoutStatusKey(payout: Payout): PayoutStatusKey {
  const signed = isSigned(payout);
  if (payout.outdated && (!signed || !payout.paidOn)) {
    return 'outdated';
  }
  if (!signed) {
    return 'unsigned';
  }
  if (!payout.paidOn) {
    return payout.direction === 'OUT' ? 'toPay' : 'toReceive';
  }
  return 'done';
}

/** A payout's state in words, so it reads without tooltips on touch. */
export function usePayoutStatus() {
  const { t, d } = useI18n({ useScope: 'global' });

  function status(payout: Payout) {
    const key = payoutStatusKey(payout);
    return {
      key,
      label: t(`finance.payout.status.${key}`),
    };
  }

  function paidText(payout: Payout): string {
    return payout.paidOn
      ? t('finance.payout.details.paidOn', {
          date: d(parseLocalDate(payout.paidOn), 'date'),
        })
      : t('finance.payout.details.toPay');
  }

  function signedText(payout: Payout): string {
    if (payout.signedAt) {
      return t('finance.payout.details.signedOn', {
        date: d(new Date(payout.signedAt), 'date'),
      });
    }
    return payout.files.length > 0
      ? t('finance.payout.details.signedScan')
      : t('finance.payout.details.unsigned');
  }

  /** Paid payouts stay as they are; the difference goes to a new payout. */
  function outdatedHint(payout: Payout): string {
    return payout.paidOn
      ? t('finance.statement.correctedLaterHint')
      : t('finance.statement.outdatedHint');
  }

  return { status, paidText, signedText, outdatedHint };
}
