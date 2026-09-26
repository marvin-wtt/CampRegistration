import { api } from '@/services/api';
import type {
  OrganizationMember,
  OrganizationMemberCreateData,
  OrganizationMemberUpdateData,
} from '@camp-registration/common/entities';

export function useOrganizationMemberService() {
  async function fetchOrganizationMembers(
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    const response = await api.get(`organizations/${organizationId}/members/`);

    return response?.data?.data;
  }

  async function createOrganizationMember(
    organizationId: string,
    data: OrganizationMemberCreateData,
  ): Promise<OrganizationMember> {
    const response = await api.post(
      `organizations/${organizationId}/members/`,
      data,
    );

    return response?.data?.data;
  }

  async function updateOrganizationMember(
    organizationId: string,
    id: string,
    data: OrganizationMemberUpdateData,
  ): Promise<OrganizationMember> {
    const response = await api.patch(
      `organizations/${organizationId}/members/${id}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteOrganizationMember(
    organizationId: string,
    id: string,
  ): Promise<void> {
    await api.delete(`organizations/${organizationId}/members/${id}/`);
  }

  return {
    fetchOrganizationMembers,
    createOrganizationMember,
    updateOrganizationMember,
    deleteOrganizationMember,
  };
}
