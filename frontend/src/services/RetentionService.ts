import { api } from '@/services/api';
import type {
  EventRetention,
  RetentionDeadlineKind,
  RetentionOverviewEntry,
  RetentionPostponeData,
} from '@camp-registration/common/privacy';

/** The retention workflow (docs/privacy.md, 8). Deletion is irreversible. */
export function useRetentionService() {
  async function fetchEventRetention(eventId: string): Promise<EventRetention> {
    const response = await api.get(`events/${eventId}/retention/`);

    return response?.data?.data;
  }

  async function postponeDeadline(
    eventId: string,
    kind: RetentionDeadlineKind,
    data: RetentionPostponeData,
  ): Promise<EventRetention> {
    const response = await api.post(
      `events/${eventId}/retention/${kind}/postpone/`,
      data,
    );

    return response?.data?.data;
  }

  async function purge(
    eventId: string,
    kind: RetentionDeadlineKind,
  ): Promise<void> {
    await api.post(`events/${eventId}/retention/${kind}/purge/`, {
      confirm: true,
    });
  }

  async function fetchOrganizationRetention(
    organizationId: string,
  ): Promise<RetentionOverviewEntry[]> {
    const response = await api.get(
      `organizations/${organizationId}/retention/`,
    );

    return response?.data?.data;
  }

  async function fetchPlatformRetention(): Promise<RetentionOverviewEntry[]> {
    const response = await api.get('admin/retention/');

    return response?.data?.data;
  }

  return {
    fetchEventRetention,
    postponeDeadline,
    purge,
    fetchOrganizationRetention,
    fetchPlatformRetention,
  };
}
