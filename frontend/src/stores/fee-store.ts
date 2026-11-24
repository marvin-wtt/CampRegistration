import { defineStore } from 'pinia';
import { computed, watch } from 'vue';
import { useAPIService } from '@/services/APIService';
import {
  useCollection,
  useResource,
  useRouteKey,
} from '@/composables/resource';
import { replaceById } from '@/utils/collection';
import type {
  AmountDueUpdateData,
  Payment,
  PaymentCreateData,
  PaymentRefundCreateData,
  PaymentUpdateData,
  RegistrationFee,
} from '@camp-registration/common/entities';

/**
 * Registration fees: each registration's balance and ledger, live by
 * registration id, and the payments of deleted registrations beside them.
 * Read through its own projection, so a treasurer without registration
 * access can work on it (docs/payments.md).
 */
export const useFeeStore = defineStore('fee', () => {
  const api = useAPIService();
  const key = useRouteKey('eventId');

  const registrations = useCollection<RegistrationFee>({
    name: 'fee',
    key,
    fetch: (eventId) => api.fetchRegistrationFees(eventId),
    realtime: {
      resource: 'registration_fee',
      fetchOne: (eventId, id) => api.fetchRegistrationFee(eventId, id),
    },
  });

  const orphaned = useResource<Payment[]>({
    name: 'fee',
    key,
    fetch: (eventId) => api.fetchOrphanedPayments(eventId),
  });

  const byId = computed(
    () => new Map((registrations.data.value ?? []).map((fee) => [fee.id, fee])),
  );

  // A deleted registration leaves its payments behind, settled.
  watch(registrations.data, (next, prev) => {
    if (prev === undefined || orphaned.data.value === undefined) {
      return;
    }
    const remaining = new Set((next ?? []).map((fee) => fee.id));
    if (prev.some((fee) => !remaining.has(fee.id))) {
      void orphaned.reload();
    }
  });

  function fetchData() {
    return Promise.all([registrations.load(), orphaned.load()]);
  }

  function recordPayment(
    registrationId: string,
    data: PaymentCreateData,
  ): Promise<RegistrationFee> {
    return registrations.mutate(
      'record',
      (eventId) => api.recordPayment(eventId, registrationId, data),
      { apply: replaceById, feedback: 'result' },
    );
  }

  function updateAmountDue(
    registrationId: string,
    data: AmountDueUpdateData,
  ): Promise<RegistrationFee> {
    return registrations.mutate(
      'amountDue',
      (eventId) => api.updateAmountDue(eventId, registrationId, data),
      { apply: replaceById, feedback: 'result' },
    );
  }

  /**
   * A write to one payment, then the registration it belongs to read again:
   * its balance changed with it. A deleted registration's payment updates
   * the orphaned list instead.
   */
  async function onPayment(
    operation: string,
    payment: Payment,
    write: (eventId: string) => Promise<unknown>,
    feedback: 'error' | 'result' = 'result',
  ): Promise<void> {
    const registrationId = payment.registrationId;
    if (registrationId) {
      await registrations.mutate(
        operation,
        async (eventId) => {
          await write(eventId);
          return api.fetchRegistrationFee(eventId, registrationId);
        },
        { apply: replaceById, feedback, multiWrite: true },
      );
      return;
    }

    await orphaned.mutate(operation, write, { reload: true, feedback });
  }

  function updatePayment(payment: Payment, data: PaymentUpdateData) {
    return onPayment(
      'updatePayment',
      payment,
      (eventId) => api.updatePayment(eventId, payment.id, data),
      'error',
    );
  }

  function deletePayment(payment: Payment) {
    return onPayment('deletePayment', payment, (eventId) =>
      api.deletePayment(eventId, payment.id),
    );
  }

  function refundPayment(payment: Payment, data: PaymentRefundCreateData) {
    return onPayment('refund', payment, (eventId) =>
      api.refundPayment(eventId, payment.id, data),
    );
  }

  function deleteRefund(payment: Payment, refundId: string) {
    return onPayment('deleteRefund', payment, (eventId) =>
      api.deletePaymentRefund(eventId, payment.id, refundId),
    );
  }

  return {
    registrations: registrations.data,
    orphanedPayments: orphaned.data,
    byId,
    isLoading: registrations.isLoading,
    error: registrations.error,
    fetchData,
    recordPayment,
    updateAmountDue,
    updatePayment,
    deletePayment,
    refundPayment,
    deleteRefund,
  };
});
