import type {
  EventPaymentStatus,
  Payment,
  PaymentCheckout,
  PaymentCreateData,
  PaymentRefundCreateData,
  RegistrationPaymentSummary,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function usePaymentService() {
  async function fetchEventPayments(eventId: string): Promise<Payment[]> {
    const response = await api.get(`events/${eventId}/payments/`);

    return response?.data?.data;
  }

  async function fetchEventPaymentStatus(
    eventId: string,
  ): Promise<EventPaymentStatus> {
    const response = await api.get(`events/${eventId}/payments/status/`);

    return response?.data?.data;
  }

  async function fetchRegistrationPayments(
    eventId: string,
    registrationId: string,
  ): Promise<{ payments: Payment[]; pageUrl: string | null }> {
    const response = await api.get(
      `events/${eventId}/registrations/${registrationId}/payments/`,
    );

    return {
      payments: response?.data?.data ?? [],
      pageUrl: response?.data?.meta?.pageUrl ?? null,
    };
  }

  async function createManualPayment(
    eventId: string,
    registrationId: string,
    data: PaymentCreateData,
  ): Promise<Payment> {
    const response = await api.post(
      `events/${eventId}/registrations/${registrationId}/payments/`,
      data,
    );

    return response?.data?.data;
  }

  async function deletePayment(
    eventId: string,
    registrationId: string,
    paymentId: string,
  ): Promise<void> {
    await api.delete(
      `events/${eventId}/registrations/${registrationId}/payments/${paymentId}/`,
    );
  }

  async function refundPayment(
    eventId: string,
    registrationId: string,
    paymentId: string,
    data: PaymentRefundCreateData,
  ): Promise<Payment> {
    const response = await api.post(
      `events/${eventId}/registrations/${registrationId}/payments/${paymentId}/refunds/`,
      data,
    );

    return response?.data?.data;
  }

  async function requestPayment(
    eventId: string,
    registrationId: string,
  ): Promise<void> {
    await api.post(
      `events/${eventId}/registrations/${registrationId}/payments/request/`,
    );
  }

  async function fetchPaymentSummary(
    eventId: string,
    registrationId: string,
    token: string,
  ): Promise<RegistrationPaymentSummary> {
    const response = await api.get(
      `events/${eventId}/registrations/${registrationId}/payment/`,
      { params: { token } },
    );

    return response?.data?.data;
  }

  async function startCheckout(
    eventId: string,
    registrationId: string,
    token: string,
  ): Promise<PaymentCheckout> {
    const response = await api.post(
      `events/${eventId}/registrations/${registrationId}/payment/checkout/`,
      undefined,
      { params: { token } },
    );

    return response?.data?.data;
  }

  return {
    fetchEventPayments,
    fetchEventPaymentStatus,
    fetchRegistrationPayments,
    createManualPayment,
    deletePayment,
    refundPayment,
    requestPayment,
    fetchPaymentSummary,
    startCheckout,
  };
}
