import {
  REGISTRATION_CONSENT_CHANGED,
  REGISTRATION_CONSENT_MISSING,
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

/** Whether the server refused a registration with the given error code. */
function hasRegistrationErrorCode(error: unknown, code: string): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const body = error.response?.data as { errorCode?: unknown } | undefined;

  return body?.errorCode === code;
}

/** Whether the server refused a total the form showed as outdated. */
export const isPriceChangedError = (error: unknown) =>
  hasRegistrationErrorCode(error, REGISTRATION_PRICE_CHANGED);

/** Whether the server refused consent texts the form showed as outdated. */
export const isConsentChangedError = (error: unknown) =>
  hasRegistrationErrorCode(error, REGISTRATION_CONSENT_CHANGED);

/**
 * Whether the server refused answers that need a consent the form does not
 * ask for — a form the organizer still has to fix (docs/privacy.md, 5).
 */
export const isConsentMissingError = (error: unknown) =>
  hasRegistrationErrorCode(error, REGISTRATION_CONSENT_MISSING);
