import {
  REGISTRATION_PRICE_CHANGED,
  type Registration,
  type RegistrationCreateData,
  type RegistrationDeleteQuery,
  type RegistrationUpdateData,
  type RegistrationUpdateQuery,
} from '@camp-registration/common/entities';
import { api, withCaptcha } from '@/services/api';
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
    const response = await api.post(
      `events/${eventId}/registrations/`,
      data,
      withCaptcha('registration'),
    );

    return response?.data?.data;
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
    updateRegistration,
    deleteRegistration,
  };
}

/** Whether the server refused a total the form showed as outdated. */
export function isPriceChangedError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const body = error.response?.data as { errorCode?: unknown } | undefined;

  return body?.errorCode === REGISTRATION_PRICE_CHANGED;
}
