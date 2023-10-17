import { Registration, RegistrationCreateData, RegistrationUpdateData } from 'src/types/Registration';
import { api } from 'boot/axios';

export function useRegistrationService() {
  async function fetchRegistrations(campId: string): Promise<Registration[]> {
    const response = await api.get(`camps/${campId}/registrations/`);

    return response.data.data;
  }

  async function fetchRegistration(
    campId: string,
    registrationId: string,
  ): Promise<Registration> {
    const response = await api.get(
      `camps/${campId}/registrations/${registrationId}/`,
    );

    return response.data.data;
  }

  async function createRegistration(
    campId: string,
    data: RegistrationCreateData,
  ): Promise<Registration> {
    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    const response = await api.post(`camps/${campId}/registrations/`, data, {
      headers,
    });

    return response.data.data;
  }

  async function updateRegistration(
    campId: string,
    registrationId: string,
    data: RegistrationUpdateData,
  ): Promise<Registration> {
    const response = await api.put(
      `camps/${campId}/registrations/${registrationId}/`,
      data,
    );

    return response.data.data;
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
