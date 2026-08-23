import { api } from '@/services/api';
import type {
  Camp,
  Newsletter,
  Organization,
  OrganizationCreateData,
  OrganizationDetails,
  OrganizationQuery,
  OrganizationReviewData,
  OrganizationUpdateData,
} from '@camp-registration/common/entities';

export function useOrganizationService() {
  async function fetchOrganizations(
    params?: OrganizationQuery,
  ): Promise<Organization[]> {
    const response = await api.get('organizations/', { params });

    return response?.data?.data;
  }

  /** The administrators' moderation queue; cursor-paginated for `useServerTable`. */
  async function fetchOrganizationsPaginated(params?: OrganizationQuery) {
    const response = await api.get('organizations/', {
      params: { ...params, view: 'all' },
    });

    return {
      data: response?.data?.data,
      meta: response?.data?.meta,
    };
  }

  async function fetchOrganization(id: string): Promise<OrganizationDetails> {
    const response = await api.get(`organizations/${id}/`);

    return response?.data?.data;
  }

  async function createOrganization(
    data: OrganizationCreateData,
  ): Promise<OrganizationDetails> {
    const response = await api.post('organizations/', data);

    return response?.data?.data;
  }

  async function updateOrganization(
    id: string,
    data: OrganizationUpdateData,
  ): Promise<OrganizationDetails> {
    const response = await api.patch(`organizations/${id}/`, data);

    return response?.data?.data;
  }

  async function deleteOrganization(id: string): Promise<void> {
    await api.delete(`organizations/${id}/`);
  }

  /** Resubmit after a rejection. */
  async function submitOrganizationVerification(
    id: string,
  ): Promise<OrganizationDetails> {
    const response = await api.post(`organizations/${id}/verification/`);

    return response?.data?.data;
  }

  /** The moderation decision. Administrators only. */
  async function reviewOrganization(
    id: string,
    data: OrganizationReviewData,
  ): Promise<OrganizationDetails> {
    const response = await api.patch(`organizations/${id}/verification/`, data);

    return response?.data?.data;
  }

  /**
   * The organization's own camps. A dedicated endpoint rather than
   * `camps?organizationId=…`, because that listing's `view=all` is restricted to
   * system administrators.
   */
  async function fetchOrganizationCamps(id: string): Promise<Camp[]> {
    const response = await api.get(`organizations/${id}/camps/`);

    return response?.data?.data;
  }

  /**
   * The organization's own newsletters. A dedicated endpoint for the same
   * reason as the camps one: `GET /newsletters` only returns newsletters the
   * user manages directly.
   */
  async function fetchOrganizationNewsletters(
    id: string,
  ): Promise<Newsletter[]> {
    const response = await api.get(`organizations/${id}/newsletters/`);

    return response?.data?.data;
  }

  async function moveCampToOrganization(
    campId: string,
    organizationId: string,
  ): Promise<Camp> {
    const response = await api.patch(`camps/${campId}/organization/`, {
      organizationId,
    });

    return response?.data?.data;
  }

  async function moveNewsletterToOrganization(
    newsletterId: string,
    organizationId: string,
  ): Promise<Newsletter> {
    const response = await api.patch(
      `newsletters/${newsletterId}/organization/`,
      { organizationId },
    );

    return response?.data?.data;
  }

  return {
    fetchOrganizations,
    fetchOrganizationsPaginated,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    submitOrganizationVerification,
    reviewOrganization,
    fetchOrganizationCamps,
    fetchOrganizationNewsletters,
    moveCampToOrganization,
    moveNewsletterToOrganization,
  };
}
