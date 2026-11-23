import type {
  Payout,
  PayoutBankAccount,
} from '@camp-registration/common/entities';
import {
  BIC_PATTERN,
  isValidIban,
  partyKey,
  recipientKey,
} from '@camp-registration/common/utils';
import { useFinanceStore } from '@/stores/finance-store';

/** Ready to send: none at all, or all required parts valid. */
export function isBankAccountValid(bankAccount: PayoutBankAccount | null) {
  return (
    bankAccount === null ||
    (bankAccount.holder.length > 0 &&
      isValidIban(bankAccount.iban) &&
      (bankAccount.bic === null || BIC_PATTERN.test(bankAccount.bic)))
  );
}

/** Same details as before: sending them again would be no change. */
export function sameBankAccount(
  a: PayoutBankAccount | null,
  b: PayoutBankAccount | null,
) {
  return a?.holder === b?.holder && a?.iban === b?.iban && a?.bic === b?.bic;
}

/**
 * The person's latest bank details in this event, from the payouts the
 * viewer can see: a treasurer sees all, a recipient their own.
 */
export function useLastBankAccount() {
  const financeStore = useFinanceStore();

  return (recipient: {
    userId: string | null;
    name: string | null;
  }): PayoutBankAccount | null => {
    const key = partyKey(recipient.userId, recipient.name);
    if (key === null) {
      return null;
    }

    const last = (financeStore.payouts ?? [])
      .filter((p: Payout) => p.bankAccount && recipientKey(p) === key)
      .sort((a, b) => b.number - a.number)[0];

    return last?.bankAccount ?? null;
  };
}
