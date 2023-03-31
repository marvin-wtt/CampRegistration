import { Camp } from 'src/types/Camp';
import axios from 'axios';
import { TableTemplate } from 'src/types/TableTemplate';
import { Registration } from 'src/types/Registration';

export function useAPIService() {
  const API_SERVER = process.env.API_SERVER;

  async function fetchCamps(): Promise<Camp[]> {
    const response = await axios.get(`${API_SERVER}/camps/`);

    return response.data;
  }

  async function fetchCamp(id: string): Promise<Camp> {
    const response = await axios.get(`${API_SERVER}/camps/${id}/`);

    return response.data;
  }

  async function createCamp(data: Camp): Promise<void> {
    await axios.post(`${API_SERVER}/camps/`, data);
  }

  async function updateCamp(id: string, data: Partial<Camp>): Promise<void> {
    await axios.patch(`${API_SERVER}/camps/${id}/`, data);
  }

  async function deleteCamp(id: string): Promise<void> {
    await axios.delete(`${API_SERVER}/camps/${id}/`);
  }

  async function fetchRegistrations(campId: string): Promise<Registration[]> {
    const response = await axios.get(
      `${API_SERVER}/camps/${campId}/registrations/`
    );

    return response.data;
  }

  async function fetchRegistration(
    campId: string,
    registrationId: string
  ): Promise<Registration> {
    const response = await axios.get(
      `${API_SERVER}/camps/${campId}/registrations/${registrationId}/`
    );

    return response.data;
  }

  async function createRegistration(
    campId: string,
    data: Registration
  ): Promise<void> {
    await axios.post(`${API_SERVER}/camps/${campId}/registrations/`, data);
  }

  async function updateRegistration(
    campId: string,
    registrationId: string,
    data: Partial<Registration>
  ): Promise<void> {
    await axios.patch(
      `${API_SERVER}/camps/${campId}/registrations/${registrationId}/`,
      data
    );
  }

  async function deleteRegistration(
    campId: string,
    registrationId: string
  ): Promise<void> {
    await axios.delete(
      `${API_SERVER}/camps/${campId}/registrations/${registrationId}/`
    );
  }

  async function fetchResultTemplates(
    campId: string
  ): Promise<TableTemplate[]> {
    const response = await axios.get(
      `${API_SERVER}/camps/${campId}/resultTemplates/`
    );

    return response.data;
  }

  async function fetchResultTemplate(
    campId: string,
    templateId: string
  ): Promise<TableTemplate[]> {
    const response = await axios.get(
      `${API_SERVER}/camps/${campId}/resultTemplates/${templateId}/`
    );

    return response.data;
  }

  async function createResultTemplate(
    campId: string,
    data: TableTemplate
  ): Promise<void> {
    await axios.post(`${API_SERVER}/camps/${campId}/resultTemplates/`, data);
  }

  async function updateResultTemplate(
    campId: string,
    templateId: string,
    data: Partial<TableTemplate>
  ): Promise<void> {
    await axios.patch(
      `${API_SERVER}/camps/${campId}/resultTemplates/${templateId}/`,
      data
    );
  }

  async function deleteResultTemplate(
    campId: string,
    templateId: string
  ): Promise<void> {
    await axios.delete(
      `${API_SERVER}/camps/${campId}/resultTemplates/${templateId}/`
    );
  }

  async function fetchCampManagers(campId: string): Promise<void> {
    await axios.get(`${API_SERVER}/camps/${campId}/managers/`);
  }

  async function addCampManager(campId: string, userId: string): Promise<void> {
    const data = {
      userId: userId,
    };
    await axios.post(`${API_SERVER}/camps/${campId}/managers/`, data);
  }

  async function deleteCampManager(
    campId: string,
    userId: string
  ): Promise<void> {
    await axios.delete(`${API_SERVER}/camps/${campId}/managers/${userId}/`);
  }

  return {
    fetchCamps,
    fetchCamp,
    createCamp,
    updateCamp,
    deleteCamp,
    fetchRegistrations,
    fetchRegistration,
    createRegistration,
    updateRegistration,
    deleteRegistration,
    fetchResultTemplates,
    fetchResultTemplate,
    createResultTemplate,
    updateResultTemplate,
    deleteResultTemplate,
    fetchCampManagers,
    addCampManager,
    deleteCampManager,
  };
}
