import { api } from '@/services/api';
import type { AdminOverview } from '@camp-registration/common/entities';

export function useAdminService() {
  async function fetchAdminOverview(): Promise<AdminOverview> {
    const response = await api.get('admin/overview/');

    return response?.data?.data;
  }

  return {
    fetchAdminOverview,
  };
}
