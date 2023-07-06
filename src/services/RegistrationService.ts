import { Registration } from 'src/types/Registration';
import { api } from 'boot/axios';
import { AxiosRequestConfig } from 'axios';

export function useRegistrationService() {
  function withoutMiddlewareConfig(): AxiosRequestConfig {
    const transformResponse = Array.isArray(api.defaults.transformResponse)
      ? api.defaults.transformResponse[0]
      : [];

    const transformRequest = Array.isArray(api.defaults.transformRequest)
      ? api.defaults.transformRequest[0]
      : [];

    return {
      transformRequest: transformRequest,
      transformResponse: transformResponse,
    };
  }

  async function fetchRegistrations(campId: string): Promise<Registration[]> {
    const config = withoutMiddlewareConfig();
    const response = await api.get(`camps/${campId}/registrations/`, config);

    return response.data.data;
  }

  async function fetchRegistration(
    campId: string,
    registrationId: string
  ): Promise<Registration> {
    const config = withoutMiddlewareConfig();
    const response = await api.get(
      `camps/${campId}/registrations/${registrationId}/`,
      config
    );

    return response.data.data;
  }

  async function createRegistration(
    campId: string,
    data: Registration
  ): Promise<Registration> {
    const response = await api.post(`camps/${campId}/registrations/`, data);

    return response.data.data;
  }

  async function updateRegistration(
    campId: string,
    registrationId: string,
    data: Partial<Registration>
  ): Promise<Registration> {
    const response = await api.put(
      `camps/${campId}/registrations/${registrationId}/`,
      data
    );

    return response.data.data;
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
