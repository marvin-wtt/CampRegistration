import type {
  AmountDueUpdateData,
  Payment,
  PaymentCreateData,
  PaymentRefundCreateData,
  PaymentUpdateData,
  RegistrationFee,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function usePaymentService() {
  async function fetchRegistrationFees(
    eventId: string,
  ): Promise<RegistrationFee[]> {
    const response = await api.get(`events/${eventId}/payments/registrations/`);

    return response?.data?.data;
  }

  async function fetchRegistrationFee(
    eventId: string,
    registrationId: string,
  ): Promise<RegistrationFee> {
    const response = await api.get(
      `events/${eventId}/payments/registrations/${registrationId}/`,
    );

    return response?.data?.data;
  }

  async function fetchOrphanedPayments(eventId: string): Promise<Payment[]> {
    const response = await api.get(`events/${eventId}/payments/orphaned/`);

    return response?.data?.data;
  }

  async function recordPayment(
    eventId: string,
    registrationId: string,
    data: PaymentCreateData,
  ): Promise<RegistrationFee> {
    const response = await api.post(
      `events/${eventId}/payments/registrations/${registrationId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function updateAmountDue(
    eventId: string,
    registrationId: string,
    data: AmountDueUpdateData,
  ): Promise<RegistrationFee> {
    const response = await api.put(
      `events/${eventId}/payments/registrations/${registrationId}/amount-due/`,
      data,
    );

    return response?.data?.data;
  }

  async function updatePayment(
    eventId: string,
    paymentId: string,
    data: PaymentUpdateData,
  ): Promise<Payment> {
    const response = await api.patch(
      `events/${eventId}/payments/${paymentId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deletePayment(
    eventId: string,
    paymentId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/payments/${paymentId}/`);
  }

  async function refundPayment(
    eventId: string,
    paymentId: string,
    data: PaymentRefundCreateData,
  ): Promise<Payment> {
    const response = await api.post(
      `events/${eventId}/payments/${paymentId}/refunds/`,
      data,
    );

    return response?.data?.data;
  }

  async function deletePaymentRefund(
    eventId: string,
    paymentId: string,
    refundId: string,
  ): Promise<Payment> {
    const response = await api.delete(
      `events/${eventId}/payments/${paymentId}/refunds/${refundId}/`,
    );

    return response?.data?.data;
  }

  return {
    fetchRegistrationFees,
    fetchRegistrationFee,
    fetchOrphanedPayments,
    recordPayment,
    updateAmountDue,
    updatePayment,
    deletePayment,
    refundPayment,
    deletePaymentRefund,
  };
}
