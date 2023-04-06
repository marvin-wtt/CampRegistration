import { Registration } from 'src/types/Registration';
import { api } from 'boot/axios';

export function useRegistrationService() {
  async function fetchRegistrations(campId: string): Promise<Registration[]> {
    const response = await api.get(`camps/${campId}/registrations/`);

    return response.data.data;
  }

  async function fetchRegistration(
    campId: string,
    registrationId: string
  ): Promise<Registration> {
    const response = await api.get(
      `camps/${campId}/registrations/${registrationId}/`
    );

    return response.data.data;
  }

  async function createRegistration(
    campId: string,
    data: Registration
  ): Promise<void> {
    await api.post(`camps/${campId}/registrations/`, data);
  }

  async function updateRegistration(
    campId: string,
    registrationId: string,
    data: Partial<Registration>
  ): Promise<void> {
    await api.put(`camps/${campId}/registrations/${registrationId}/`, data);
  }

  async function deleteRegistration(
    campId: string,
    registrationId: string
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
