import type { PermissionMatrix } from '@camp-registration/common/permissions';
import { api } from '@/services/api';

export function usePermissionService() {
  async function fetchPermissionMatrix(): Promise<PermissionMatrix> {
    const response = await api.get('permissions/');

    return response?.data?.data;
  }

  return {
    fetchPermissionMatrix,
  };
}
