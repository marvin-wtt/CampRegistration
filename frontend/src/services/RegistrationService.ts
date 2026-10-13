import type {
  Registration,
  RegistrationCreateData,
  RegistrationCreatePaymentMeta,
  RegistrationDeleteQuery,
  RegistrationUpdateData,
  RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

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
