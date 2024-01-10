import type {
  Registration,
  RegistrationCreateData,
  RegistrationUpdateData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useRegistrationService() {
  async function fetchRegistrations(campId: string): Promise<Registration[]> {
    const response = await api.get(`camps/${campId}/registrations/`);

    return response.data?.data;
  }

  async function fetchRegistration(
    campId: string,
    registrationId: string,
  ): Promise<Registration> {
    const response = await api.get(
      `camps/${campId}/registrations/${registrationId}/`,
    );

    return response.data?.data;
  }

  async function createRegistration(
    campId: string,
    data: RegistrationCreateData,
  ): Promise<Registration> {
    const response = await api.postForm(`camps/${campId}/registrations/`, data);

    return response.data?.data;
  }

  async function updateRegistration(
    campId: string,
    registrationId: string,
    data: RegistrationUpdateData,
  ): Promise<Registration> {
    const response = await api.putForm(
      `camps/${campId}/registrations/${registrationId}/`,
      data,
    );

    return response.data?.data;
  }

  async function deleteRegistration(
    campId: string,
    registrationId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/registrations/${registrationId}/`);
  }

  return {
    fetchRegistrations,
    fetchRegistration,
    createRegistration,
    updateRegistration,
    deleteRegistration,
  };
}
