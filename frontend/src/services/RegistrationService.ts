import {
  REGISTRATION_PRICE_CHANGED,
  type Registration,
  type RegistrationCreateData,
  type RegistrationCreatePaymentMeta,
  type RegistrationDeleteQuery,
  type RegistrationUpdateData,
  type RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';
import axios from 'axios';

export function useRegistrationService() {
  async function fetchRegistrations(eventId: string): Promise<Registration[]> {
    const response = await api.get(`events/${eventId}/registrations/`);

    return response?.data?.data;
  }

  async function fetchRegistration(
    eventId: string,
    registrationId: string,
  ): Promise<Registration> {
    const response = await api.get(
      `events/${eventId}/registrations/${registrationId}/`,
    );

    return response?.data?.data;
  }

  async function createRegistration(
    eventId: string,
    data: RegistrationCreateData,
  ): Promise<Registration> {
    const response = await api.post(`events/${eventId}/registrations/`, data);

    return response?.data?.data;
  }

  /** Like `createRegistration`, plus the payment step for the submitter, if any. */
  async function submitRegistration(
    eventId: string,
    data: RegistrationCreateData,
  ): Promise<{
    registration: Registration;
    payment: RegistrationCreatePaymentMeta | null;
  }> {
    const response = await api.post(`events/${eventId}/registrations/`, data);

    return {
      registration: response?.data?.data,
      payment: response?.data?.meta?.payment ?? null,
    };
  }

  async function updateRegistration(
    eventId: string,
    registrationId: string,
    data: RegistrationUpdateData,
    params?: RegistrationUpdateQuery,
  ): Promise<Registration> {
    const response = await api.patch(
      `events/${eventId}/registrations/${registrationId}/`,
      data,
      { params },
    );

    return response?.data?.data;
  }

  async function deleteRegistration(
    eventId: string,
    registrationId: string,
    params?: RegistrationDeleteQuery,
  ): Promise<void> {
    await api.delete(`events/${eventId}/registrations/${registrationId}/`, {
      params,
    });
  }

  return {
    fetchRegistrations,
    fetchRegistration,
    createRegistration,
    submitRegistration,
    updateRegistration,
    deleteRegistration,
  };
}

/**
 * The server's own amount from a `REGISTRATION_PRICE_CHANGED` refusal, or
 * `null` for any other error. This — never what the form displayed — is what
 * the person is asked to confirm.
 */
export function serverQuoteFromPriceChange(error: unknown): number | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }
  const body = error.response?.data as
    { errorCode?: unknown; details?: { quotedAmount?: unknown } } | undefined;
  const quote = body?.details?.quotedAmount;

  return body?.errorCode === REGISTRATION_PRICE_CHANGED &&
    typeof quote === 'number'
    ? quote
    : null;
}
