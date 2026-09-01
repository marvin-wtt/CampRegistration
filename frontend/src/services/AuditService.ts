import type { AuditLogEntry } from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useAuditService() {
  async function fetchRegistrationAuditLog(
    eventId: string,
    registrationId: string,
  ): Promise<AuditLogEntry[]> {
    const response = await api.get(
      `events/${eventId}/registrations/${registrationId}/audit/`,
    );

    return response?.data?.data;
  }

  async function fetchEventAuditLog(eventId: string): Promise<AuditLogEntry[]> {
    const response = await api.get(`events/${eventId}/audit/`);

    return response?.data?.data;
  }

  return {
    fetchRegistrationAuditLog,
    fetchEventAuditLog,
  };
}
