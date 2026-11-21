import { api } from '@/services/api';
import type {
  AdminAccessGrant,
  AdminAccessGrantCreateData,
  AdminAccessGrantQuery,
  AdminAccessGrantReview,
  CursorPaginated,
} from '@camp-registration/common/entities';

export function useAdminAccessService() {
  async function fetchAdminAccessGrants(
    query?: AdminAccessGrantQuery,
  ): Promise<CursorPaginated<AdminAccessGrantReview>> {
    const response = await api.get('admin/access-grants/', { params: query });

    return {
      data: response?.data?.data ?? [],
      meta: response?.data?.meta,
    };
  }

  async function requestAdminAccess(
    data: AdminAccessGrantCreateData,
  ): Promise<AdminAccessGrant> {
    const response = await api.post('admin/access-grants/', data);

    return response?.data?.data;
  }

  async function endAdminAccess(grantId: string): Promise<void> {
    await api.delete(`admin/access-grants/${grantId}/`);
  }

  return {
    fetchAdminAccessGrants,
    requestAdminAccess,
    endAdminAccess,
  };
}
