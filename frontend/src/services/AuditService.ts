import type { AuditLogEntry } from '@camp-registration/common/entities';
import { api } from 'src/services/api';

export function useAuditService() {
  async function fetchRegistrationAuditLog(
    campId: string,
    registrationId: string,
  ): Promise<AuditLogEntry[]> {
    const response = await api.get(
      `camps/${campId}/registrations/${registrationId}/audit/`,
    );

    return response?.data?.data;
  }

  return {
    fetchRegistrationAuditLog,
  };
}
