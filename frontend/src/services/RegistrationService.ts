import type {
  Registration,
  RegistrationCreateData,
  RegistrationUpdateData,
} from '@camp-registration/common/entities';
import { useApi } from 'src/composables/api';

export function useRegistrationService() {
  const api = useApi();

  async function fetchRegistrations(campId: string): Promise<Registration[]> {
    const response = await api.get(`camps/${campId}/registrations/`);

    return response?.data?.data;
  }

  async function fetchRegistration(
    campId: string,
    registrationId: string,
  ): Promise<Registration> {
    const response = await api.get(
      `camps/${campId}/registrations/${registrationId}/`,
    );

    return response?.data?.data;
  }

  async function createRegistration(
    campId: string,
    data: RegistrationCreateData,
  ): Promise<Registration> {
    const response = await api.post(`camps/${campId}/registrations/`, data);

    return response?.data?.data;
  }

  async function updateRegistration(
    campId: string,
    registrationId: string,
    data: RegistrationUpdateData,
  ): Promise<Registration> {
    const response = await api.patch(
      `camps/${campId}/registrations/${registrationId}/`,
      data,
    );

    return response?.data?.data;
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
