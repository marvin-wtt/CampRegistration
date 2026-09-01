import { api } from '@/services/api';
import type {
  EventPrivacyNotice,
  OrganizationPrivacyNoticeDetails,
  PrivacyNoticeAddendum,
  PrivacyNoticeContent,
  PublishedPrivacyNotice,
} from '@camp-registration/common/privacy';

/**
 * Publishing is the only write on either notice: there is no server-side draft,
 * so an unfinished edit lives in the author's browser and nowhere else.
 */
export function usePrivacyNoticeService() {
  async function fetchOrganizationNotice(
    organizationId: string,
  ): Promise<OrganizationPrivacyNoticeDetails> {
    const response = await api.get(
      `organizations/${organizationId}/privacy-notice/`,
    );

    return response?.data?.data;
  }

  async function publishOrganizationNotice(
    organizationId: string,
    content: PrivacyNoticeContent,
  ): Promise<OrganizationPrivacyNoticeDetails> {
    const response = await api.put(
      `organizations/${organizationId}/privacy-notice/`,
      { content },
    );

    return response?.data?.data;
  }

  /**
   * The composed notice a registrant reads. Published content only — an
   * in-progress edit must not change what the public page says.
   */
  async function fetchEventNotice(
    eventId: string,
  ): Promise<PublishedPrivacyNotice> {
    const response = await api.get(`events/${eventId}/privacy-notice/`);

    return response?.data?.data;
  }

  /**
   * The event's own published additions plus the organization baseline they are
   * added to — the public endpoint above returns the two already merged, which
   * cannot tell an author which half is theirs.
   */
  async function fetchEventAddendum(
    eventId: string,
  ): Promise<EventPrivacyNotice> {
    const response = await api.get(`events/${eventId}/privacy-notice/addendum`);

    return response?.data?.data;
  }

  async function publishEventAddendum(
    eventId: string,
    content: PrivacyNoticeAddendum,
  ): Promise<EventPrivacyNotice> {
    const response = await api.put(
      `events/${eventId}/privacy-notice/addendum`,
      {
        content,
      },
    );

    return response?.data?.data;
  }

  return {
    fetchOrganizationNotice,
    publishOrganizationNotice,
    fetchEventNotice,
    fetchEventAddendum,
    publishEventAddendum,
  };
}
