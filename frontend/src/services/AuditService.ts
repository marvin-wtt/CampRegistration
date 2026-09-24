import type {
  AuditActor,
  AuditLogEntry,
  AuditLogQuery,
  CursorPaginated,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

// The backend accepts list filters in comma form only (see `audit.validation.ts`).
function joinList(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value.join(',') : value;
}

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

  async function fetchEventAuditLog(
    eventId: string,
    query: AuditLogQuery = {},
  ): Promise<CursorPaginated<AuditLogEntry>> {
    const response = await api.get(`events/${eventId}/audit/`, {
      params: {
        ...query,
        entityType: joinList(query.entityType),
        actorId: joinList(query.actorId),
      },
    });

    return {
      data: response?.data?.data ?? [],
      meta: response?.data?.meta,
    };
  }

  async function fetchEventAuditActors(eventId: string): Promise<AuditActor[]> {
    const response = await api.get(`events/${eventId}/audit/actors/`);

    return response?.data?.data;
  }

  return {
    fetchRegistrationAuditLog,
    fetchEventAuditLog,
    fetchEventAuditActors,
  };
}
