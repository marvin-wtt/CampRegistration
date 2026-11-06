import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import type {
  AmountDueUpdateData,
  EventPaymentStatus,
  Payment,
  PaymentCreateData,
  PaymentRefundCreateData,
  PaymentRequestResult,
} from '@camp-registration/common/entities';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useRealtimeCollection } from '@/composables/realtimeCollection';
import { useAuthBus, useEventBus } from '@/composables/bus';
import { useRegistrationsStore } from '@/stores/registration-store';

/**
 * The event's payment ledger. Writes refresh it and the registration whose
 * balance they changed; other clients' writes and provider webhooks arrive
 * through the realtime stream. Callers notify about the outcome themselves.
 */
export const usePaymentStore = defineStore('payment', () => {
  const route = useRoute();
  const api = useAPIService();
  const authBus = useAuthBus();
  const eventBus = useEventBus();
  const registrationsStore = useRegistrationsStore();
  const {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    lazyFetch,
    backgroundFetch,
    checkNotNullWithError,
  } = useServiceHandler<Payment[]>('payment');

  authBus.on('logout', () => {
    reset();
  });

  eventBus.on('change', () => {
    reset();
  });

  // No per-payment endpoint: every change reloads the (small) ledger.
  useRealtimeCollection<Payment>('payment', {
    data,
    invalidate,
    reload: () => fetchData(undefined, { background: true }),
  });

  function currentEventId(eventId?: string): string {
    return checkNotNullWithError(
      eventId ?? (route.params.eventId as string | undefined),
    );
  }

  async function fetchData(eventId?: string, opts?: { background?: boolean }) {
    const cid = currentEventId(eventId);
    const fetcher = () => api.fetchEventPayments(cid);
    await (opts?.background ? backgroundFetch(fetcher) : lazyFetch(fetcher));
  }

  function forRegistration(registrationId: string): Payment[] {
    return (data.value ?? []).filter(
      (payment) => payment.registrationId === registrationId,
    );
  }

  async function changed(eventId: string, registrationId: string) {
    await Promise.all([
      fetchData(eventId, { background: true }),
      registrationsStore.refreshOne(registrationId),
    ]);
  }

  async function withRefresh<T>(
    eventId: string,
    registrationId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn();
    } finally {
      await changed(eventId, registrationId);
    }
  }

  function record(
    eventId: string,
    registrationId: string,
    payment: PaymentCreateData,
  ) {
    return withRefresh(eventId, registrationId, () =>
      api.createManualPayment(eventId, registrationId, payment),
    );
  }

  function refund(
    eventId: string,
    registrationId: string,
    paymentId: string,
    refundData: PaymentRefundCreateData,
  ) {
    return withRefresh(eventId, registrationId, () =>
      api.refundPayment(eventId, registrationId, paymentId, refundData),
    );
  }

  function remove(eventId: string, registrationId: string, paymentId: string) {
    return withRefresh(eventId, registrationId, () =>
      api.deletePayment(eventId, registrationId, paymentId),
    );
  }

  function adjustAmountDue(
    eventId: string,
    registrationId: string,
    adjustment: AmountDueUpdateData,
  ) {
    return withRefresh(eventId, registrationId, () =>
      api.updateAmountDue(eventId, registrationId, adjustment),
    );
  }

  function request(eventId: string, registrationId: string) {
    return withRefresh(eventId, registrationId, () =>
      api.requestPayment(eventId, registrationId),
    );
  }

  async function requestAll(eventId: string): Promise<PaymentRequestResult> {
    const result = await api.requestAllPayments(eventId);
    registrationsStore.invalidate();

    return result;
  }

  /** Whether the event can take online payments, for its settings. */
  function fetchStatus(eventId: string): Promise<EventPaymentStatus> {
    return api.fetchEventPaymentStatus(eventId);
  }

  /** The participant's payment link, for managers to pass on by other means. */
  async function fetchPageUrl(
    eventId: string,
    registrationId: string,
  ): Promise<string | null> {
    const { pageUrl } = await api.fetchRegistrationPayments(
      eventId,
      registrationId,
    );

    return pageUrl;
  }

  return {
    data,
    isLoading,
    error,
    reset,
    invalidate,
    fetchData,
    forRegistration,
    record,
    refund,
    remove,
    adjustAmountDue,
    request,
    requestAll,
    fetchStatus,
    fetchPageUrl,
  };
});
